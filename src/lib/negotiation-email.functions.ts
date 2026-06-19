import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  buildNegotiationEmail,
  buildNegotiationEmailSubject,
  defaultCompetitorForCategory,
  resolveDisplayName,
  resolveProviderLabel,
} from "@/lib/negotiation-email";

const InputSchema = z.object({
  negotiationId: z.string().uuid(),
});

export type SendNegotiationEmailResult = {
  id: string;
  subject: string;
  body: string;
  status: string;
};

export const sendNegotiationEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data, context }): Promise<SendNegotiationEmailResult> => {
    const { supabase, userId, claims } = context;
    const userEmail = typeof claims?.email === "string" ? claims.email : null;

    const { data: neg, error: negErr } = await supabase
      .from("negotiations")
      .select("id, user_id, user_provider_id")
      .eq("id", data.negotiationId)
      .eq("user_id", userId)
      .maybeSingle();
    if (negErr || !neg?.user_provider_id) throw new Error("Negotiation not found");

    const [{ data: profile }, { data: up }, { data: offers }] = await Promise.all([
      supabase.from("user_profiles").select("name").eq("id", userId).maybeSingle(),
      supabase
        .from("user_providers")
        .select("provider_name, plan_name, category, monthly_price")
        .eq("id", neg.user_provider_id)
        .maybeSingle(),
      supabase
        .from("offers")
        .select("provider_name, plan_name, monthly_price, offer_type")
        .eq("negotiation_id", data.negotiationId)
        .order("monthly_price", { ascending: true }),
    ]);

    if (!up) throw new Error("Provider not found");

    const cheapest = offers?.[0];
    const competitor =
      cheapest?.provider_name?.trim() ||
      defaultCompetitorForCategory(up.category);
    const competitorPrice = Number(cheapest?.monthly_price || up.monthly_price || 0);
    const planName = cheapest?.plan_name || up.plan_name || "חבילה";
    const fullName = resolveDisplayName(profile?.name, userEmail?.split("@")[0]);
    const userName = resolveDisplayName(profile?.name, userEmail?.split("@")[0]);

    const body = buildNegotiationEmail({
      fullName,
      providerName: resolveProviderLabel(up),
      competitor,
      competitorPrice,
      planName,
      userName,
    });
    const subject = buildNegotiationEmailSubject(up.provider_name);

    const { data: row, error: insertErr } = await supabase
      .from("negotiation_emails")
      .insert({
        negotiation_id: data.negotiationId,
        user_id: userId,
        recipient_email: null,
        subject,
        body,
        status: "sent",
        sent_at: new Date().toISOString(),
      })
      .select("id, subject, body, status")
      .single();

    if (insertErr || !row) throw new Error(insertErr?.message || "Failed to store negotiation email");

    return {
      id: row.id,
      subject: row.subject,
      body: row.body,
      status: row.status,
    };
  });
