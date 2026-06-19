import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { ProviderActionSheet } from "@/components/ProviderActionSheet";
import { DiscoveryCard } from "@/components/DiscoveryCard";
import { ViralShareBanner } from "@/components/ViralShareBanner";
import { supabase } from "@/integrations/supabase/client";
import { getLocalUser } from "@/lib/local-auth";
import { getLocalProviderStore } from "@/lib/local-providers";
import { getLocalTotalSavings } from "@/lib/local-negotiations";
import { formatCurrency, formatGreeting } from "@/lib/format";
import { peekRecentSaving, clearRecentSaving } from "@/lib/recent-saving";
import { ChevronLeft, Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [providers, setProviders] = useState<any[]>([]);
  const [totalSavings, setTotalSavings] = useState<number>(0);
  const [activeNegs, setActiveNegs] = useState<any[]>([]);
  const [sheetProvider, setSheetProvider] = useState<any | null>(null);
  const [shareAmount, setShareAmount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const recent = peekRecentSaving();
    if (recent) setShareAmount(recent);
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const localUser = getLocalUser();
      const store = getLocalProviderStore();

      if (store) {
        setProviders(store.providers);
        setProfile({
          name: localUser?.email?.split("@")[0] || null,
          onboarding_complete: store.onboardingComplete,
        });
        setTotalSavings(getLocalTotalSavings());
        setActiveNegs([]);
        setLoading(false);
        if (!store.onboardingComplete && store.providers.length === 0 && store.draft.selected.length === 0) {
          return;
        }
        if (!store.onboardingComplete && store.providers.length > 0) {
          navigate({ to: "/onboarding", replace: true });
        }
        return;
      }

      if (localUser) {
        setProfile({ name: null, onboarding_complete: false });
        setProviders([]);
        setLoading(false);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const [{ data: prof }, { data: ups }, { data: sav }, { data: negs }] = await Promise.all([
        supabase.from("user_profiles").select("*").eq("id", user.id).maybeSingle(),
        supabase.from("user_providers").select("*").eq("user_id", user.id).order("created_at"),
        supabase.from("savings").select("amount").eq("user_id", user.id),
        supabase
          .from("negotiations")
          .select("id, status, retention_call_status, user_providers(provider_name)")
          .eq("user_id", user.id)
          .neq("status", "completed")
          .order("started_at", { ascending: false }),
      ]);
      setProfile(prof);
      setProviders(ups || []);
      setTotalSavings((sav || []).reduce((s: number, r: any) => s + Number(r.amount || 0), 0));
      setActiveNegs((negs as any[]) || []);
      const skipped =
        typeof sessionStorage !== "undefined" && sessionStorage.getItem("nego-questionnaire-skipped") === "1";
      if (prof && !prof.onboarding_complete && (ups?.length ?? 0) > 0 && !skipped) {
        navigate({ to: "/onboarding", replace: true });
      }
      setLoading(false);
    })();
  }, [navigate]);

  const greeting = formatGreeting(profile?.name, getLocalUser()?.email);
  const showQuestionnaireEmpty = providers.length === 0;

  if (loading) {
    return (
      <AppShell>
        <div className="page-loading min-h-[60vh]">
          <Loader2 className="size-8 animate-spin" style={{ color: "var(--primary)" }} />
          <p className="text-sm">טוען את הנתונים שלך…</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <h1 className="text-xl font-bold mt-2">{greeting}</h1>
      <p className="text-sm text-muted-foreground">הסוכן שלך פעיל</p>

      {showQuestionnaireEmpty ? (
        <div className="mt-5 glass-card p-6 text-center">
          <p className="text-3xl" aria-hidden>📋</p>
          <p className="font-semibold mt-3">עדיין לא הוספת חבילות</p>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
            כדי שהסוכן יוכל לחפש חיסכון, צריך להשלים את השאלון הקצר — זה לוקח דקה.
          </p>
          <Link
            to="/onboarding"
            className="inline-flex mt-4 rounded-[20px] bg-primary text-primary-foreground font-bold py-3 px-6 teal-glow"
          >
            השלם את השאלון
          </Link>
        </div>
      ) : (
        <>
      <div className="mt-5 relative rounded-2xl p-[1px]" style={{ background: "linear-gradient(135deg, #00C2A8, transparent)" }}>
        <div className="rounded-2xl bg-secondary p-5">
          <p className="text-xs text-muted-foreground">חסכת עד היום</p>
          <div className="mt-1 flex items-end justify-between">
            <p className="text-3xl font-bold" style={{ color: "var(--primary)" }}>{formatCurrency(totalSavings)}</p>
            <span
              className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold"
              style={{ background: "rgba(0,194,168,0.15)", color: "var(--primary)" }}
            >
              פעיל ✓
            </span>
          </div>
        </div>
      </div>

      {activeNegs.length > 0 && (
        <div className="mt-3 flex flex-col gap-2">
          {activeNegs.length > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">{activeNegs.length} מו״מים פעילים</p>
              <Link to="/negotiations" className="text-xs" style={{ color: "var(--primary)" }}>הצג הכל</Link>
            </div>
          )}
          {activeNegs.slice(0, 3).map((n) => (
            <Link
              key={n.id}
              to="/negotiation/$id"
              params={{ id: n.id }}
              className="block glass-card p-4 flex items-center gap-3"
              style={{ borderColor: "rgba(255,176,32,0.4)" }}
            >
              <span className="relative inline-flex size-2.5">
                <span className="absolute inset-0 rounded-full pulse-ring" style={{ background: "var(--warning)" }} />
                <span className="relative size-2.5 rounded-full" style={{ background: "var(--warning)" }} />
              </span>
              <p className="text-sm flex-1">מנהל מו״מ עם {n.user_providers?.provider_name || "ספק"}</p>
              <ChevronLeft className="size-4 text-muted-foreground" />
            </Link>
          ))}
        </div>
      )}

      <div className="mt-7 flex items-center justify-between">
        <h2 className="font-semibold">כל הספקים שלך</h2>
        <Link to="/control" className="text-xs" style={{ color: "var(--primary)" }}>לוח בקרה מלא</Link>
      </div>

      <div className="mt-3 flex flex-col gap-2.5">
        {providers.length === 0 && (
          <div className="glass-card p-6 text-center text-sm text-muted-foreground">
            עדיין לא הוספת ספקים.
            <Link to="/onboarding" className="block mt-3 font-semibold" style={{ color: "var(--primary)" }}>בוא נתחיל ←</Link>
          </div>
        )}
        {providers.map((p) => {
          const score = typeof p.savings_score === "number" ? p.savings_score : null;
          return (
            <div key={p.id} className="glass-card p-4 flex items-center gap-3 text-right">
              <div
                className="size-10 rounded-xl flex items-center justify-center text-xl"
                style={{ background: "rgba(255,255,255,0.06)" }}
              >
                {p.logo_emoji || "💼"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-[14px] truncate">{p.provider_name}</p>
                <p className="text-[12px] text-muted-foreground truncate">{p.plan_name || p.category}</p>
                <button
                  onClick={() => setSheetProvider(p)}
                  className="mt-2 inline-flex items-center rounded-full px-3 py-1.5 text-[12px] font-semibold text-primary-foreground"
                  style={{ background: "var(--primary)" }}
                >
                  טפל עכשיו ←
                </button>
              </div>
              <div className="text-left">
                <p className="font-semibold text-sm">{formatCurrency(Number(p.monthly_price || 0))}</p>
                {score != null && (
                  <p className="text-[11px]" style={{ color: scoreColor(score) }}>פוטנציאל {score}/10</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <DiscoveryCard className="mt-6" limit={2} />
        </>
      )}

      {sheetProvider && (
        <ProviderActionSheet
          provider={sheetProvider}
          open
          onOpenChange={(o) => {
            if (!o) setSheetProvider(null);
          }}
        />
      )}
      {shareAmount != null && (
        <ViralShareBanner
          amount={shareAmount}
          onDismiss={() => {
            clearRecentSaving();
            setShareAmount(null);
          }}
        />
      )}
    </AppShell>
  );
}

function scoreColor(s: number) {
  if (s >= 7) return "var(--primary)";
  if (s >= 4) return "var(--warning)";
  return "var(--muted-foreground)";
}
