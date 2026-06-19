export const NEGOTIATION_EMAIL_TEMPLATE = `שלום,
אני לקוח קיים.
שם: [שם מלא]
ספק: [שם ספק]
קיבלתי הצעה מ-[מתחרה] בסך ₪[X] לחודש עבור [שם חבילה].
בהעדר הצעה מתחרה רלוונטית תוך 3 ימי עסקים — אבצע מעבר.
[שם המשתמש]`;

export type NegotiationEmailParams = {
  fullName: string;
  providerName: string;
  competitor: string;
  competitorPrice: number;
  planName: string;
  userName: string;
};

export function buildNegotiationEmail(params: NegotiationEmailParams): string {
  const price = Math.round(params.competitorPrice).toLocaleString("he-IL");
  return NEGOTIATION_EMAIL_TEMPLATE.replace("[שם מלא]", params.fullName)
    .replace("[שם ספק]", params.providerName)
    .replace("[מתחרה]", params.competitor)
    .replace("[X]", price)
    .replace("[שם חבילה]", params.planName)
    .replace("[שם המשתמש]", params.userName);
}

export function buildNegotiationEmailSubject(providerName: string): string {
  return `בקשת מו״מ מחיר — ${providerName}`;
}

const FALLBACK = "לא צוין";

export function resolveProviderLabel(provider: {
  provider_name?: string | null;
  plan_name?: string | null;
}): string {
  const parts = [provider.provider_name, provider.plan_name].filter(Boolean);
  return parts.length ? parts.join(" · ") : FALLBACK;
}

export function resolveDisplayName(profileName?: string | null, fallback?: string | null): string {
  const name = profileName?.trim() || fallback?.trim();
  return name || FALLBACK;
}

/** Default competitor labels for seeded offers when market search has not run yet. */
export const DEFAULT_COMPETITORS: Record<string, string> = {
  סלולר: "Partner",
  "טלוויזיה ואינטרנט": "HOT",
  "חברת חשמל": "סלקום חשמל",
  "ביטוח רכב": "הפניקס",
  "ביטוח חיים": "מגדל",
  "ביטוח בריאות": "כלל",
  "ביטוח דירה": "הראל",
  "קופת חולים": "מכבי",
  "מועדון כושר": "Holmes Place",
  סטרימינג: "Disney+",
};

export function defaultCompetitorForCategory(category?: string | null): string {
  if (!category) return "ספק מתחרה";
  return DEFAULT_COMPETITORS[category.trim()] || "ספק מתחרה";
}
