import { createServerFn } from "@tanstack/react-start";

export type DetectedCharge = {
  provider_name: string;
  monthly_amount: number;
  frequency: "monthly" | "quarterly" | "annual";
};

const SYSTEM_PROMPT =
  "You are analyzing a Hebrew bank statement or credit card standing orders page. Extract recurring charges/standing orders ONLY. For each charge return: provider_name, monthly_amount, frequency (monthly/quarterly/annual). Do NOT extract or return credit card numbers, bank account numbers, IBAN, ID numbers, or any other sensitive identifiers. Return ONLY valid JSON array, no other text. Example: [{\"provider_name\": \"HOT\", \"monthly_amount\": 129, \"frequency\": \"monthly\"}]";

export const scanStatement = createServerFn({ method: "POST" })
  .inputValidator((input: { imageDataUrl: string }) => {
    if (!input?.imageDataUrl || !input.imageDataUrl.startsWith("data:image/")) {
      throw new Error("Invalid image");
    }
    return input;
  })
  .handler(async ({ data }): Promise<DetectedCharge[]> => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": key,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: [
              { type: "text", text: "Extract all recurring charges from this image." },
              { type: "image_url", image_url: { url: data.imageDataUrl } },
            ],
          },
        ],
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      if (res.status === 429) throw new Error("יותר מדי בקשות — נסה שוב בעוד רגע");
      if (res.status === 402) throw new Error("נגמרו הקרדיטים של הסוכן");
      throw new Error(`AI error ${res.status}: ${body.slice(0, 200)}`);
    }

    const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const content = json.choices?.[0]?.message?.content ?? "";
    const match = content.match(/\[[\s\S]*\]/);
    if (!match) return [];
    try {
      const parsed = JSON.parse(match[0]) as DetectedCharge[];
      return parsed
        .filter((p) => p && p.provider_name && typeof p.monthly_amount === "number")
        .map((p) => ({
          provider_name: String(p.provider_name).slice(0, 80),
          monthly_amount: Math.max(0, Math.round(Number(p.monthly_amount))),
          frequency: (["monthly", "quarterly", "annual"].includes(p.frequency) ? p.frequency : "monthly") as DetectedCharge["frequency"],
        }));
    } catch {
      return [];
    }
  });
