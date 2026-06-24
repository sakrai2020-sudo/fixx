export const PAYMENT_PROCESSORS = [
  "כאל",
  "ישראכרט",
  "מקס",
  "אמריקן אקספרס",
  "דיינרס",
  "טרנזילה",
  "קארדקום",
  "HYP",
  "Payme",
  "אחר",
] as const;

export type PaymentProcessor = (typeof PAYMENT_PROCESSORS)[number];

export const MARKET_AVG_CLEARING_RATE = 1.1;

/** Conservative estimate when user selects "לא יודע" */
export const UNKNOWN_RATE_ESTIMATE = 2.0;

export type PaymentProcessingRecord = {
  id?: string;
  user_id: string;
  processor_name: string;
  current_rate: number | null;
  monthly_volume: number | null;
  created_at?: string;
};

export type PaymentProcessingSummary = {
  displayRate: string;
  rateValue: number | null;
  marketAvg: number;
  annualSavings: number | null;
  processorName: string;
};

export function computeClearingSavings(
  currentRate: number | null,
  monthlyVolume: number | null,
  rateUnknown = false,
): PaymentProcessingSummary {
  const effectiveRate =
    currentRate != null ? currentRate : rateUnknown ? UNKNOWN_RATE_ESTIMATE : null;
  const marketAvg = MARKET_AVG_CLEARING_RATE;

  let annualSavings: number | null = null;
  if (effectiveRate != null && monthlyVolume != null && monthlyVolume > 0) {
    const excess = Math.max(0, effectiveRate - marketAvg);
    annualSavings = Math.round(monthlyVolume * (excess / 100) * 12);
  }

  const displayRate =
    currentRate != null
      ? `${currentRate}%`
      : rateUnknown
        ? `לא יודע (משוער ${UNKNOWN_RATE_ESTIMATE}%)`
        : "לא יודע";

  return {
    displayRate,
    rateValue: effectiveRate,
    marketAvg,
    annualSavings,
    processorName: "",
  };
}

const LOCAL_KEY = "fixx_payment_processing";

export function getLocalPaymentProcessingRecords(): PaymentProcessingRecord[] {
  if (typeof localStorage === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(LOCAL_KEY) || "[]") as PaymentProcessingRecord[];
  } catch {
    return [];
  }
}

export function saveLocalPaymentProcessingRecord(record: PaymentProcessingRecord) {
  if (typeof localStorage === "undefined") return;
  const existing = getLocalPaymentProcessingRecords();
  const entry: PaymentProcessingRecord = {
    ...record,
    id: record.id ?? crypto.randomUUID?.() ?? `local-${Date.now()}`,
    created_at: record.created_at ?? new Date().toISOString(),
  };
  localStorage.setItem(LOCAL_KEY, JSON.stringify([entry, ...existing].slice(0, 20)));
}

export async function savePaymentProcessingRecord(
  record: Omit<PaymentProcessingRecord, "id" | "created_at">,
  source: "local" | "supabase",
): Promise<PaymentProcessingRecord> {
  const payload = {
    user_id: record.user_id,
    processor_name: record.processor_name,
    current_rate: record.current_rate,
    monthly_volume: record.monthly_volume,
  };

  if (source === "local") {
    const saved: PaymentProcessingRecord = { ...payload, created_at: new Date().toISOString() };
    saveLocalPaymentProcessingRecord(saved);
    return saved;
  }

  const { supabase } = await import("@/integrations/supabase/client");
  const { data, error } = await supabase
    .from("business_payment_processing")
    .insert(payload)
    .select("*")
    .single();
  if (error) throw error;
  return data as PaymentProcessingRecord;
}

export async function fetchLatestPaymentProcessing(
  userId: string,
  source: "local" | "supabase",
): Promise<PaymentProcessingRecord | null> {
  if (source === "local") {
    const rows = getLocalPaymentProcessingRecords().filter((r) => r.user_id === userId);
    return rows[0] ?? null;
  }

  const { supabase } = await import("@/integrations/supabase/client");
  const { data } = await supabase
    .from("business_payment_processing")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as PaymentProcessingRecord) ?? null;
}
