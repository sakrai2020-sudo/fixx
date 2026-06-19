import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const InputSchema = z.object({
  negotiationId: z.string().uuid(),
});

export type AiOffer = {
  provider_name: string;
  plan_name: string;
  monthly_price: number;
  key_features: string[];
  annual_saving: number;
  offer_type: "cheapest" | "value" | "premium";
};

const SYSTEM_PROMPT =
  "You are Fixx, an Israeli financial agent helping consumers save money on monthly subscriptions. Search the live Israeli market in Hebrew using web_search. Return ONLY valid JSON. No prose, no markdown fences.";

function buildUserPrompt(p: {
  category: string;
  providerName: string;
  currentPrice: number;
  planName: string;
}) {
  return `המשתמש מנוי על ${p.category} אצל ${p.providerName} (חבילה: ${p.planName || "לא צוין"}) ומשלם ₪${p.currentPrice} לחודש.

חפש בגוגל בעברית עכשיו את 3 ההצעות הטובות ביותר בשוק הישראלי לקטגוריה הזו. בדוק אתרי השוואה ישראליים (זאפ, אתרי הספקים, פרסומים עדכניים).

החזר בדיוק 3 הצעות ממוינות לפי:
1. הכי זולה (offer_type: "cheapest")
2. הכי משתלמת (offer_type: "value")
3. פרמיום (offer_type: "premium")

עבור כל הצעה החזר:
- provider_name: שם הספק
- plan_name: שם החבילה
- monthly_price: מחיר חודשי במספר
- key_features: מערך של 3 יתרונות עיקריים בעברית
- annual_saving: חיסכון שנתי לעומת ₪${p.currentPrice * 12} (number, יכול להיות שלילי בפרמיום)
- offer_type: "cheapest" | "value" | "premium"

החזר JSON בלבד בפורמט: {"offers": [...]}`;
}

export const searchMarketOffers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data, context }): Promise<AiOffer[]> => {
    const key = process.env.ANTHROPIC_API_KEY;
    if (!key) throw new Error("Missing ANTHROPIC_API_KEY");

    const { supabase } = context;
    const { data: neg } = await supabase
      .from("negotiations")
      .select("user_provider_id")
      .eq("id", data.negotiationId)
      .maybeSingle();
    if (!neg?.user_provider_id) throw new Error("Negotiation not found");

    const { data: up } = await supabase
      .from("user_providers")
      .select("provider_name, category, plan_name, monthly_price")
      .eq("id", neg.user_provider_id)
      .maybeSingle();
    if (!up) throw new Error("Provider not found");

    const currentPrice = Number(up.monthly_price || 0);

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5",
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
        tools: [
          {
            type: "web_search_20250305",
            name: "web_search",
            max_uses: 5,
          },
        ],
        messages: [
          {
            role: "user",
            content: buildUserPrompt({
              category: String(up.category || ""),
              providerName: String(up.provider_name || ""),
              currentPrice,
              planName: String(up.plan_name || ""),
            }),
          },
        ],
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Claude error ${res.status}: ${body.slice(0, 300)}`);
    }

    const json = (await res.json()) as {
      content?: Array<{ type: string; text?: string }>;
    };
    const textParts = (json.content || [])
      .filter((c) => c.type === "text" && c.text)
      .map((c) => c.text as string)
      .join("\n");
    const match = textParts.match(/\{[\s\S]*"offers"[\s\S]*\}/);
    if (!match) throw new Error("No JSON in Claude response");

    let parsed: { offers?: AiOffer[] };
    try {
      parsed = JSON.parse(match[0]);
    } catch {
      throw new Error("Invalid JSON from Claude");
    }
    const offers = (parsed.offers || []).slice(0, 3).map((o) => ({
      provider_name: String(o.provider_name || "").slice(0, 80),
      plan_name: String(o.plan_name || "").slice(0, 120),
      monthly_price: Math.max(0, Math.round(Number(o.monthly_price) || 0)),
      key_features: Array.isArray(o.key_features)
        ? o.key_features.slice(0, 3).map((f) => String(f).slice(0, 120))
        : [],
      annual_saving: Math.round(Number(o.annual_saving) || 0),
      offer_type: (["cheapest", "value", "premium"].includes(o.offer_type)
        ? o.offer_type
        : "value") as AiOffer["offer_type"],
    }));

    if (offers.length === 0) throw new Error("No offers returned");

    // Persist: replace existing offers for this negotiation
    await supabase.from("offers").delete().eq("negotiation_id", data.negotiationId);
    const { error: insErr } = await supabase.from("offers").insert(
      offers.map((o) => ({
        negotiation_id: data.negotiationId,
        offer_type: o.offer_type,
        provider_name: o.provider_name,
        plan_name: `${o.provider_name} · ${o.plan_name}`,
        features: o.key_features,
        monthly_price: o.monthly_price,
        registration_fee: 0,
      })),
    );
    if (insErr) throw new Error(insErr.message);

    return offers;
  });
