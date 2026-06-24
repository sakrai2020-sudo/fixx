import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AppShell } from "@/components/AppShell";
import { PostActionConfirmationCard } from "@/components/PostActionConfirmationCard";
import { supabase } from "@/integrations/supabase/client";
import { fetchPendingConfirmations } from "@/lib/action-confirmation.service";
import { listPendingActionConfirmations } from "@/lib/post-action-confirmation.functions";
import type { ActionConfirmation } from "@/lib/post-action-confirmation";
import { Bell, Handshake, Check, Phone, ShieldCheck, Bot, AlertTriangle, Tag } from "lucide-react";
import { getAuthUserOrLocal } from "@/lib/auth-session";
import { fetchAgentActivities } from "@/lib/proactive-agent";

export const Route = createFileRoute("/_authenticated/notifications")({
  component: Notifications,
});

type Item = {
  id: string;
  ts: string;
  icon: "start" | "completed" | "retention" | "protocol" | "agent" | "expiry" | "promo";
  title: string;
  body: string;
  negId?: string;
  confirmId?: string;
};

function fmtRel(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "עכשיו";
  if (m < 60) return `לפני ${m} דק׳`;
  const h = Math.floor(m / 60);
  if (h < 24) return `לפני ${h} שעות`;
  const d = Math.floor(h / 24);
  return `לפני ${d} ימים`;
}

function Notifications() {
  const runListPending = useServerFn(listPendingActionConfirmations);
  const [items, setItems] = useState<Item[]>([]);
  const [pending, setPending] = useState<ActionConfirmation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const user = await getAuthUserOrLocal();
      const pendingList = await fetchPendingConfirmations({ list: runListPending });
      setPending(pendingList);

      const list: Item[] = pendingList.map((c) => ({
        id: `protocol-${c.id}`,
        ts: c.created_at,
        icon: "protocol" as const,
        title: "פרוטוקול אישור — SMS + דוא״ל",
        body: "אשר או בטל את הפעולה תוך 3 ימים",
        confirmId: c.id,
      }));

      if (user.source !== "local") {
        const agentActs = await fetchAgentActivities(user.id, "supabase");
        for (const a of agentActs) {
          if (a.activity_type === "scheduled_scan") continue;
          list.push({
            id: `agent-${a.id}`,
            ts: a.created_at,
            icon:
              a.activity_type === "expiry_alert"
                ? "expiry"
                : a.activity_type === "promotion_alert"
                  ? "promo"
                  : "agent",
            title:
              a.activity_type === "expiry_alert"
                ? "הסכם עומד לפוג"
                : a.activity_type === "promotion_alert"
                  ? "מבצע רלוונטי"
                  : "הצעה טובה יותר",
            body: a.summary,
          });
        }

        const { data: negs } = await supabase
          .from("negotiations")
          .select("id, status, started_at, retention_call_status, user_providers(provider_name)")
          .eq("user_id", user.id)
          .order("started_at", { ascending: false })
          .limit(20);
        for (const n of (negs as any[]) || []) {
          const name = n.user_providers?.provider_name || "ספק";
          list.push({
            id: `${n.id}-start`,
            ts: n.started_at,
            icon: "start",
            title: "מו״מ חדש הופעל",
            body: `הסוכן פתח פנייה ל${name}`,
            negId: n.id,
          });
          if (n.status === "completed") {
            list.push({
              id: `${n.id}-done`,
              ts: n.started_at,
              icon: "completed",
              title: "המו״מ הושלם",
              body: `סגרנו את ההצעה הטובה ביותר עם ${name}`,
              negId: n.id,
            });
          }
          if (n.status === "retention_contact" || n.retention_call_status === "called") {
            list.push({
              id: `${n.id}-ret`,
              ts: n.started_at,
              icon: "retention",
              title: "מחלקת השימור מתקשרת",
              body: `${name} עומדים לחזור אליך עם הצעה`,
              negId: n.id,
            });
          }
        }
      } else {
        const agentActs = await fetchAgentActivities(user.id, "local");
        for (const a of agentActs) {
          if (a.activity_type === "scheduled_scan") continue;
          list.push({
            id: `agent-${a.id}`,
            ts: a.created_at,
            icon:
              a.activity_type === "expiry_alert"
                ? "expiry"
                : a.activity_type === "promotion_alert"
                  ? "promo"
                  : "agent",
            title:
              a.activity_type === "expiry_alert"
                ? "הסכם עומד לפוג"
                : a.activity_type === "promotion_alert"
                  ? "מבצע רלוונטי"
                  : "הצעה טובה יותר",
            body: a.summary,
          });
        }
      }

      list.sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime());
      setItems(list);
      setLoading(false);
    })();
  }, [runListPending]);

  return (
    <AppShell>
      <h1 className="text-xl font-bold mt-2">התראות</h1>

      {pending.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-semibold text-primary mb-2">ממתין לאישורך</p>
          {pending.map((conf) => (
            <PostActionConfirmationCard
              key={conf.id}
              confirmation={conf}
              compact
              onResolved={() => {
                void fetchPendingConfirmations({ list: runListPending }).then(setPending);
              }}
            />
          ))}
        </div>
      )}

      {loading ? (
        <p className="mt-10 text-center text-muted-foreground text-sm">טוען...</p>
      ) : items.length === 0 && pending.length === 0 ? (
        <div className="mt-10 text-center text-muted-foreground">
          <Bell className="size-10 mx-auto mb-3" />
          <p className="text-sm">אין התראות חדשות</p>
        </div>
      ) : (
        <div className="mt-5 flex flex-col gap-2.5">
          {items.map((it) => {
            const href = it.confirmId
              ? { to: "/confirm/$id" as const, params: { id: it.confirmId } }
              : it.negId
                ? { to: "/negotiation/$id" as const, params: { id: it.negId } }
                : null;
            const inner = (
              <>
                <NotifIcon kind={it.icon} />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">{it.title}</p>
                  <p className="text-[12px] text-muted-foreground mt-0.5">{it.body}</p>
                  <p className="text-[11px] text-muted-foreground mt-1.5">{fmtRel(it.ts)}</p>
                </div>
              </>
            );
            if (!href) {
              return (
                <div key={it.id} className="glass-card p-4 flex items-start gap-3 text-right">
                  {inner}
                </div>
              );
            }
            return (
              <Link key={it.id} {...href} className="glass-card p-4 flex items-start gap-3 text-right">
                {inner}
              </Link>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}

function NotifIcon({ kind }: { kind: Item["icon"] }) {
  const map = {
    start: { Icon: Handshake, color: "var(--teal)" },
    completed: { Icon: Check, color: "var(--savings)" },
    retention: { Icon: Phone, color: "var(--cta)" },
    protocol: { Icon: ShieldCheck, color: "var(--teal)" },
    agent: { Icon: Bot, color: "var(--savings)" },
    expiry: { Icon: AlertTriangle, color: "var(--cta)" },
    promo: { Icon: Tag, color: "var(--cta)" },
  } as const;
  const { Icon, color } = map[kind];
  return (
    <div
      className="size-9 rounded-xl flex items-center justify-center shrink-0"
      style={{ background: `color-mix(in oklab, ${color} 15%, transparent)`, color }}
    >
      <Icon className="size-4" />
    </div>
  );
}
