import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { shouldRunScheduledScan, type AgentActivity } from "@/lib/proactive-agent";

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
};

const PROMOTIONS: { category: string; title: string; providerHint: string }[] = [
  { category: "סלולר", title: "מבצע 5G — חודש ראשון חינם", providerHint: "סלקום" },
  { category: "מועדון כושר", title: "Holmes Place — ₪99 לחודש הראשון", providerHint: "Holmes" },
  { category: "טלוויזיה ואינטרנט", title: "HOT — חבילת Triple ב-₪79", providerHint: "HOT" },
  { category: "ביטוח רכב", title: "הנחת 15% לנהגים ללא תביעות", providerHint: "הראל" },
];

const EXPIRY_WINDOW_DAYS = 30;
const CHECK_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000;

export const runProactiveAgentCheck = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ ran: boolean; newCount: number; newItems: AgentActivity[]; activities: AgentActivity[] }> => {
    const { supabase, user } = context;

    const { data: existing } = await supabase
      .from("agent_activity")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(100);

    const activities = (existing || []) as AgentActivity[];
    const runFullScan = shouldRunScheduledScan(activities);

    const { data: providers } = await supabase
      .from("user_providers")
      .select("id, provider_name, category, monthly_price, expiry_date")
      .eq("user_id", user.id);

    const rows = providers || [];
    const now = new Date().toISOString();
    const today = now.slice(0, 10);
    const inserts: Omit<AgentActivity, "id">[] = [];

    if (runFullScan) {
      inserts.push({
        user_id: user.id,
        activity_type: "scheduled_scan",
        summary: `בדיקה שבועית — ${rows.length} ספקים`,
        details: { provider_count: rows.length },
        created_at: now,
      });
    }

    for (const p of rows) {
      if (runFullScan) {
        const benchmark = CATEGORY_BENCHMARKS[p.category];
        const price = Number(p.monthly_price || 0);
        if (benchmark != null && benchmark > 0 && price > benchmark * 1.12) {
          const dup = activities.some(
            (a) =>
              a.activity_type === "better_offer_found" &&
              a.user_provider_id === p.id &&
              Date.now() - new Date(a.created_at).getTime() < CHECK_INTERVAL_MS,
          );
          if (!dup) {
            const save = Math.round((price - benchmark) * 12);
            inserts.push({
              user_id: user.id,
              activity_type: "better_offer_found",
              user_provider_id: p.id,
              summary: `נמצאה הצעה טובה יותר ל${p.provider_name} — חיסכון פוטנציאלי ₪${save}/שנה`,
              details: { provider_name: p.provider_name, benchmark, current: price, annual_save: save },
              created_at: now,
            });
          }
        }
      }

      if (p.expiry_date) {
        const daysLeft = Math.ceil((new Date(p.expiry_date).getTime() - Date.now()) / (24 * 60 * 60 * 1000));
        if (daysLeft > 0 && daysLeft <= EXPIRY_WINDOW_DAYS) {
          const dup = activities.some(
            (a) =>
              a.activity_type === "expiry_alert" &&
              a.user_provider_id === p.id &&
              a.details?.days_left === daysLeft,
          );
          if (!dup) {
            inserts.push({
              user_id: user.id,
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
        const dup = activities.some(
          (a) =>
            a.activity_type === "promotion_alert" &&
            a.user_provider_id === p.id &&
            a.details?.promotion === promo.title &&
            a.created_at.startsWith(today),
        );
        if (!dup) {
          inserts.push({
            user_id: user.id,
            activity_type: "promotion_alert",
            user_provider_id: p.id,
            summary: `מבצע רלוונטי ב${p.category}: ${promo.title}`,
            details: { category: p.category, promotion: promo.title },
            created_at: now,
          });
        }
      }
    }

    if (inserts.length === 0) {
      return { ran: false, newCount: 0, newItems: [], activities };
    }

    const { data: inserted, error } = await supabase
      .from("agent_activity")
      .insert(
        inserts.map(({ user_id, activity_type, user_provider_id, summary, details, created_at }) => ({
          user_id,
          activity_type,
          user_provider_id: user_provider_id ?? null,
          summary,
          details,
          created_at,
        })),
      )
      .select("*");

    if (error) throw error;

    const { data: all } = await supabase
      .from("agent_activity")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(100);

    return {
      ran: true,
      newCount: inserted?.length ?? inserts.length,
      newItems: (inserted as AgentActivity[]) || [],
      activities: (all as AgentActivity[]) || [],
    };
  });

export const listAgentActivities = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AgentActivity[]> => {
    const { supabase, user } = context;
    const { data } = await supabase
      .from("agent_activity")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(100);
    return (data as AgentActivity[]) || [];
  });
