import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { getLocalActiveNegotiations, getLocalProviderById } from "@/lib/local-negotiations";
import { getLocalUser } from "@/lib/local-auth";
import { formatDateIL } from "@/lib/format";
import { ChevronLeft, Handshake, Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/negotiations")({
  component: NegotiationsList,
});

type Neg = {
  id: string;
  status: string;
  started_at: string;
  retention_call_status: string | null;
  user_providers: { provider_name: string; logo_emoji: string | null; category: string | null } | null;
};

function statusLabel(n: Neg): { text: string; color: string } {
  if (n.status === "retention_contact" || n.retention_call_status === "called") {
    return { text: "מחלקת שימור פעילה", color: "var(--warning)" };
  }
  if (n.status === "active") return { text: "מו״מ פעיל", color: "var(--primary)" };
  if (n.status === "completed") return { text: "הושלם", color: "var(--muted-foreground)" };
  return { text: n.status, color: "var(--muted-foreground)" };
}

function NegotiationsList() {
  const [negs, setNegs] = useState<Neg[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const localUser = getLocalUser();
      if (localUser) {
        const localNegs = getLocalActiveNegotiations().map((n) => {
          const up = getLocalProviderById(n.user_provider_id);
          return {
            id: n.id,
            status: n.status,
            started_at: n.started_at,
            retention_call_status: n.retention_call_status ?? null,
            user_providers: up
              ? { provider_name: up.provider_name, logo_emoji: up.logo_emoji, category: up.category }
              : null,
          };
        });
        setNegs(localNegs);
        setLoading(false);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      const { data } = await supabase
        .from("negotiations")
        .select("id, status, started_at, retention_call_status, user_providers(provider_name, logo_emoji, category)")
        .eq("user_id", user.id)
        .neq("status", "completed")
        .order("started_at", { ascending: false });
      setNegs((data as any[]) || []);
      setLoading(false);
    })();
  }, []);

  return (
    <AppShell>
      <h1 className="text-xl font-bold mt-2">מו״מ פעיל</h1>
      <p className="text-sm text-muted-foreground mt-1">כל המו״מים שהסוכן מנהל בשבילך כרגע</p>

      {loading ? (
        <div className="page-loading mt-10">
          <Loader2 className="size-8 animate-spin" style={{ color: "var(--primary)" }} />
          <p className="text-sm">טוען מו״מים…</p>
        </div>
      ) : negs.length === 0 ? (
        <div className="empty-state mt-10">
          <Handshake className="size-10 mx-auto mb-3" style={{ color: "var(--muted-foreground)" }} />
          <p className="font-semibold text-foreground">אין כרגע מו״מים פעילים</p>
          <p className="mt-2">לחץ על ספק בדף הבית כדי שהסוכן יתחיל לעבוד</p>
          <Link to="/dashboard" data-inline="true" className="btn-inline mt-4 inline-block text-sm font-semibold min-h-[44px] leading-[44px]" style={{ color: "var(--primary)" }}>
            חזרה לדף הבית
          </Link>
        </div>
      ) : (
        <div className="mt-5 flex flex-col gap-2.5">
          {negs.map((n) => {
            const s = statusLabel(n);
            return (
              <Link
                key={n.id}
                to="/negotiation/$id"
                params={{ id: n.id }}
                className="glass-card p-4 flex items-center gap-3 text-right"
              >
                <div className="size-10 rounded-xl flex items-center justify-center text-xl" style={{ background: "rgba(255,255,255,0.06)" }}>
                  {n.user_providers?.logo_emoji || "🤝"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{n.user_providers?.provider_name || "ספק"}</p>
                  <p className="text-[12px] text-muted-foreground truncate">
                    {n.user_providers?.category || ""}
                    {n.started_at ? ` · ${formatDateIL(n.started_at)}` : ""}
                  </p>
                  <span
                    className="inline-flex items-center gap-1.5 mt-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold"
                    style={{ background: `color-mix(in oklab, ${s.color} 15%, transparent)`, color: s.color }}
                  >
                    <span className="relative inline-flex size-1.5">
                      <span className="absolute inset-0 rounded-full pulse-ring" style={{ background: s.color }} />
                      <span className="relative size-1.5 rounded-full" style={{ background: s.color }} />
                    </span>
                    {s.text}
                  </span>
                </div>
                <ChevronLeft className="size-4 text-muted-foreground shrink-0" />
              </Link>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
