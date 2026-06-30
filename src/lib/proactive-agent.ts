export type AgentActivityType =
  | "scheduled_scan"
  | "better_offer_found"
  | "expiry_alert"
  | "promotion_alert";

export type AgentActivity = {
  id: string;
  user_id: string;
  activity_type: AgentActivityType;
  user_provider_id?: string | null;
  summary: string;
  details: Record<string, string | number | boolean | null>;
  created_at: string;
};

const LOCAL_KEY = "fixx_agent_activity";
const CHECK_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000;
const EXPIRY_WINDOW_DAYS = 30;

/** Category benchmark monthly prices (₪) — heuristic until live market API */
const CATEGORY_BENCHMARKS: Record<string, number> = {
  סלולר: 49,
  "טלוויזיה ואינטרנט": 89,
  חשמל: 120,
  גז: 45,
  "ביטוח רכב": 180,
  "ביטוח דירה": 55,
  "ביטוח חיים ובריאות": 95,
  "מועדון כושר": 129,
  "חוגי ילדים": 160,
  "קופת חולים": 0,
};

const PROMOTIONS: { category: string; title: string; providerHint: string }[] = [
  { category: "סלולר", title: "מבצע 5G — חודש ראשון חינם", providerHint: "סלקום" },
  { category: "מועדון כושר", title: "Holmes Place — ₪99 לחודש הראשון", providerHint: "Holmes" },
  { category: "טלוויזיה ואינטרנט", title: "HOT — חבילת Triple ב-₪79", providerHint: "HOT" },
  { category: "ביטוח רכב", title: "הנחת 15% לנהגים ללא תביעות", providerHint: "הראל" },
];

function readLocal(): AgentActivity[] {
  if (typeof localStorage === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(LOCAL_KEY) || "[]") as AgentActivity[];
  } catch {
    return [];
  }
}

function writeLocal(items: AgentActivity[]) {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(LOCAL_KEY, JSON.stringify(items.slice(0, 200)));
}

export function daysSinceLastScan(activities: AgentActivity[]): number | null {
  const last = activities.find((a) => a.activity_type === "scheduled_scan");
  if (!last) return null;
  return Math.floor((Date.now() - new Date(last.created_at).getTime()) / (24 * 60 * 60 * 1000));
}

export function formatLastScanLabel(days: number | null): string {
  if (days == null) return "הסוכן טרם ביצע בדיקה";
  if (days === 0) return "הסוכן בדק היום";
  if (days === 1) return "הסוכן בדק אתמול";
  return `הסוכן בדק לאחרונה לפני ${days} ימים`;
}

export function shouldRunScheduledScan(activities: AgentActivity[]): boolean {
  const last = activities.find((a) => a.activity_type === "scheduled_scan");
  if (!last) return true;
  return Date.now() - new Date(last.created_at).getTime() >= CHECK_INTERVAL_MS;
}

type ProviderRow = {
  id: string;
  provider_name: string;
  category: string;
  monthly_price: number;
  expiry_date?: string | null;
};

export function runLocalProactiveCheck(
  userId: string,
  providers: ProviderRow[],
): { activities: AgentActivity[]; newItems: AgentActivity[] } {
  const existing = readLocal();
  const now = new Date().toISOString();
  const newItems: AgentActivity[] = [];
  const runFullScan = shouldRunScheduledScan(existing);

  if (runFullScan) {
    newItems.push({
      id: crypto.randomUUID?.() ?? `local-${Date.now()}`,
      user_id: userId,
      activity_type: "scheduled_scan",
      summary: `בדיקה שבועית — ${providers.length} ספקים`,
      details: { provider_count: providers.length },
      created_at: now,
    });
  }

  for (const p of providers) {
    if (runFullScan) {
      const benchmark = CATEGORY_BENCHMARKS[p.category];
      if (benchmark != null && benchmark > 0 && Number(p.monthly_price) > benchmark * 1.12) {
        const save = Math.round((Number(p.monthly_price) - benchmark) * 12);
        const dup = existing.some(
          (a) =>
            a.activity_type === "better_offer_found" &&
            a.user_provider_id === p.id &&
            Date.now() - new Date(a.created_at).getTime() < CHECK_INTERVAL_MS,
        );
        if (!dup) {
          newItems.push({
            id: crypto.randomUUID?.() ?? `local-bo-${Date.now()}-${p.id}`,
            user_id: userId,
            activity_type: "better_offer_found",
            user_provider_id: p.id,
            summary: `נמצאה הצעה טובה יותר ל${p.provider_name} — חיסכון פוטנציאלי ₪${save}/שנה`,
            details: { provider_name: p.provider_name, benchmark, current: p.monthly_price, annual_save: save },
            created_at: now,
          });
        }
      }
    }

    if (p.expiry_date) {
      const daysLeft = Math.ceil((new Date(p.expiry_date).getTime() - Date.now()) / (24 * 60 * 60 * 1000));
      if (daysLeft > 0 && daysLeft <= EXPIRY_WINDOW_DAYS) {
        const dup = existing.some(
          (a) =>
            a.activity_type === "expiry_alert" &&
            a.user_provider_id === p.id &&
            a.details?.days_left === daysLeft,
        );
        if (!dup) {
          newItems.push({
            id: crypto.randomUUID?.() ?? `local-ex-${Date.now()}-${p.id}`,
            user_id: userId,
            activity_type: "expiry_alert",
            user_provider_id: p.id,
            summary: `ההסכם עם ${p.provider_name} פג תוך ${daysLeft} ימים`,
            details: { provider_name: p.provider_name, expiry_date: p.expiry_date, days_left: daysLeft },
            created_at: now,
          });
        }
      }
    }

    const promo = PROMOTIONS.find(
      (pr) => pr.category === p.category && !p.provider_name.includes(pr.providerHint),
    );
    if (promo) {
      const today = new Date().toISOString().slice(0, 10);
      const dup = existing.some(
        (a) =>
          a.activity_type === "promotion_alert" &&
          a.user_provider_id === p.id &&
          String(a.details?.promotion) === promo.title &&
          a.created_at.startsWith(today),
      );
      if (!dup) {
        newItems.push({
          id: crypto.randomUUID?.() ?? `local-pr-${Date.now()}-${p.id}`,
          user_id: userId,
          activity_type: "promotion_alert",
          user_provider_id: p.id,
          summary: `מבצע רלוונטי ב${p.category}: ${promo.title}`,
          details: { category: p.category, promotion: promo.title },
          created_at: now,
        });
      }
    }
  }

  if (newItems.length === 0) {
    return { activities: existing, newItems: [] };
  }

  const merged = [...newItems, ...existing];
  writeLocal(merged);
  return { activities: merged, newItems };
}

export async function fetchAgentActivities(userId: string, source: "local" | "supabase"): Promise<AgentActivity[]> {
  if (source === "local") return readLocal();

  const { supabase } = await import("@/integrations/supabase/client");
  const { data } = await supabase
    .from("agent_activity")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(100);
  return (data as AgentActivity[]) || [];
}

export { CHECK_INTERVAL_MS, EXPIRY_WINDOW_DAYS };
