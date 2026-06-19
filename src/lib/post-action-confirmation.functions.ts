import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  buildProtocolBody,
  computeExpiresAt,
  getProtocolTitle,
  type ActionConfirmation,
  type RollbackSnapshot,
} from "@/lib/post-action-confirmation";

const RollbackSchema = z.object({
  user_provider_id: z.string(),
  provider_name: z.string(),
  plan_name: z.string(),
  monthly_price: z.number(),
  negotiation_id: z.string().optional(),
  savings_quarter_share: z.number().optional(),
});

const CreateSchema = z.object({
  negotiationId: z.string().uuid().optional(),
  actionType: z.enum(["registration", "switch", "disconnect"]),
  providerName: z.string(),
  planName: z.string(),
  monthlyPrice: z.number(),
  rollback: RollbackSchema,
});

const IdSchema = z.object({ id: z.string().uuid() });

async function resolveContact(supabase: any, userId: string, userEmail: string | null) {
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("phone")
    .eq("id", userId)
    .maybeSingle();
  return {
    email: userEmail?.trim() || "—",
    phone: profile?.phone?.trim() || "—",
  };
}

async function sendProtocolMessages(
  supabase: any,
  userId: string,
  confirmationId: string,
  conf: Pick<ActionConfirmation, "action_type" | "provider_name" | "plan_name" | "monthly_price" | "contact_email" | "contact_phone" | "expires_at">,
) {
  const body = buildProtocolBody(conf);
  const subject = getProtocolTitle();
  const rows = [
    { confirmation_id: confirmationId, user_id: userId, channel: "sms", subject: null, body, status: "sent" },
    { confirmation_id: confirmationId, user_id: userId, channel: "email", subject, body, status: "sent" },
  ];
  await supabase.from("action_confirmation_messages").insert(rows);
}

async function executeRollback(supabase: any, userId: string, snap: RollbackSnapshot) {
  await supabase
    .from("user_providers")
    .update({
      provider_name: snap.provider_name,
      plan_name: snap.plan_name,
      monthly_price: snap.monthly_price,
    })
    .eq("id", snap.user_provider_id);

  if (snap.negotiation_id) {
    await supabase
      .from("negotiations")
      .update({ status: "active" })
      .eq("id", snap.negotiation_id)
      .eq("user_id", userId);
  }

  if (snap.savings_quarter_share && snap.savings_quarter_share > 0) {
    const now = new Date();
    const q = Math.floor(now.getMonth() / 3) + 1;
    const { data: existing } = await supabase
      .from("savings")
      .select("*")
      .eq("user_id", userId)
      .eq("year", now.getFullYear())
      .eq("quarter", q)
      .maybeSingle();
    if (existing) {
      const next = Math.max(0, Number(existing.amount) - snap.savings_quarter_share);
      await supabase.from("savings").update({ amount: next }).eq("id", existing.id);
    }
  }
}

export const createActionConfirmation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => CreateSchema.parse(input))
  .handler(async ({ data, context }): Promise<ActionConfirmation> => {
    const { supabase, userId, claims } = context;
    const userEmail = typeof claims?.email === "string" ? claims.email : null;
    const contact = await resolveContact(supabase, userId, userEmail);
    const now = new Date();
    const expiresAt = computeExpiresAt(now);

    const { data: row, error } = await supabase
      .from("action_confirmations")
      .insert({
        user_id: userId,
        negotiation_id: data.negotiationId ?? null,
        action_type: data.actionType,
        provider_name: data.providerName,
        plan_name: data.planName,
        monthly_price: data.monthlyPrice,
        contact_email: contact.email,
        contact_phone: contact.phone,
        rollback: data.rollback,
        status: "pending",
        expires_at: expiresAt,
        protocol_sent_at: now.toISOString(),
      })
      .select("*")
      .single();

    if (error || !row) throw new Error(error?.message || "Failed to create confirmation");

    await sendProtocolMessages(supabase, userId, row.id, {
      action_type: data.actionType,
      provider_name: data.providerName,
      plan_name: data.planName,
      monthly_price: data.monthlyPrice,
      contact_email: contact.email,
      contact_phone: contact.phone,
      expires_at: expiresAt,
    });

    return row as ActionConfirmation;
  });

export const confirmActionConfirmation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => IdSchema.parse(input))
  .handler(async ({ data, context }): Promise<ActionConfirmation> => {
    const { supabase, userId } = context;
    const { data: row, error } = await supabase
      .from("action_confirmations")
      .update({ status: "confirmed", resolved_at: new Date().toISOString() })
      .eq("id", data.id)
      .eq("user_id", userId)
      .eq("status", "pending")
      .select("*")
      .maybeSingle();
    if (error || !row) throw new Error("Confirmation not found or already resolved");
    return row as ActionConfirmation;
  });

export const cancelActionConfirmation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => IdSchema.parse(input))
  .handler(async ({ data, context }): Promise<ActionConfirmation> => {
    const { supabase, userId } = context;
    const { data: existing, error: fetchErr } = await supabase
      .from("action_confirmations")
      .select("*")
      .eq("id", data.id)
      .eq("user_id", userId)
      .eq("status", "pending")
      .maybeSingle();
    if (fetchErr || !existing) throw new Error("Confirmation not found");

    await executeRollback(supabase, userId, existing.rollback as RollbackSnapshot);

    const { data: row, error } = await supabase
      .from("action_confirmations")
      .update({ status: "cancelled", resolved_at: new Date().toISOString() })
      .eq("id", data.id)
      .select("*")
      .single();
    if (error || !row) throw new Error(error?.message || "Cancel failed");
    return row as ActionConfirmation;
  });

export const processExpiredActionConfirmations = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ expired: string[] }> => {
    const { supabase, userId } = context;
    const now = new Date().toISOString();
    const { data: pending } = await supabase
      .from("action_confirmations")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "pending")
      .lt("expires_at", now);

    const expired: string[] = [];
    for (const conf of pending || []) {
      await executeRollback(supabase, userId, conf.rollback as RollbackSnapshot);
      await supabase
        .from("action_confirmations")
        .update({ status: "expired", resolved_at: new Date().toISOString() })
        .eq("id", conf.id);
      expired.push(conf.id);
    }
    return { expired };
  });

export const listPendingActionConfirmations = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ActionConfirmation[]> => {
    const { supabase, userId } = context;
    const { data } = await supabase
      .from("action_confirmations")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "pending")
      .order("created_at", { ascending: false });
    return (data || []) as ActionConfirmation[];
  });

export const getActionConfirmation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => IdSchema.parse(input))
  .handler(async ({ data, context }): Promise<ActionConfirmation | null> => {
    const { supabase, userId } = context;
    const { data: row } = await supabase
      .from("action_confirmations")
      .select("*")
      .eq("id", data.id)
      .eq("user_id", userId)
      .maybeSingle();
    return (row as ActionConfirmation) || null;
  });
