import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { ProviderActionSheet } from "@/components/ProviderActionSheet";
import { supabase } from "@/integrations/supabase/client";
import { ChevronDown, TrendingUp, ShieldCheck } from "lucide-react";

function fmtDate(d: Date) {
  return d.toLocaleDateString("he-IL", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export const Route = createFileRoute("/_authenticated/control")({
  component: Control,
});

function Control() {
  const [providers, setProviders] = useState<any[]>([]);
  const [savings, setSavings] = useState<any[]>([]);
  const [open, setOpen] = useState<string | null>(null);
  const [sheetProvider, setSheetProvider] = useState<any | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const [{ data: ups }, { data: sv }] = await Promise.all([
        supabase.from("user_providers").select("*").eq("user_id", user.id),
        supabase.from("savings").select("*").eq("user_id", user.id).order("year").order("quarter"),
      ]);
      setProviders(ups || []);
      setSavings(sv || []);
    })();
  }, []);

  const now = new Date();
  const curQ = Math.floor(now.getMonth() / 3) + 1;
  const curY = now.getFullYear();

  // last 4 quarters
  const quarters: { label: string; q: number; y: number; amount: number; isCurrent: boolean }[] = [];
  for (let i = 3; i >= 0; i--) {
    let q = curQ - i, y = curY;
    while (q <= 0) { q += 4; y -= 1; }
    const match = savings.find((s) => s.quarter === q && s.year === y);
    quarters.push({ label: `ר${q}`, q, y, amount: Number(match?.amount || 0), isCurrent: q === curQ && y === curY });
  }
  const max = Math.max(1, ...quarters.map((q) => q.amount));
  const cur = quarters[3].amount;
  const prev = quarters[2].amount;
  const diffPct = prev > 0 ? Math.round(((cur - prev) / prev) * 100) : (cur > 0 ? 100 : 0);

  const lastScan = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
  const nextScan = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);

  return (
    <AppShell>
      <h1 className="text-xl font-bold mt-2">לוח בקרה</h1>
      <p className="text-sm text-muted-foreground">כל הספקים שלך במקום אחד</p>

      <div className="mt-5 glass-card p-5">
        <div className="flex items-center gap-2">
          <span className="relative flex size-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: "var(--primary)" }} />
            <span className="relative inline-flex rounded-full size-2.5" style={{ background: "var(--primary)" }} />
          </span>
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="size-4" style={{ color: "var(--primary)" }} />
            <p className="text-sm font-semibold">מצב הגנה פעיל</p>
          </div>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">הסוכן סורק את החבילות שלך באופן שוטף</p>

        <div className="mt-4 grid grid-cols-2 gap-2 text-[12px]">
          <div className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.04)" }}>
            <p className="text-muted-foreground">סריקה אחרונה</p>
            <p className="mt-0.5 font-semibold">{fmtDate(lastScan)}</p>
          </div>
          <div className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.04)" }}>
            <p className="text-muted-foreground">סריקה הבאה</p>
            <p className="mt-0.5 font-semibold">{fmtDate(nextScan)}</p>
          </div>
        </div>

        <div className="mt-2 rounded-xl p-3 flex items-center justify-between" style={{ background: "rgba(255,255,255,0.04)" }}>
          <span className="text-[12px] text-muted-foreground">ספקים תחת ניטור פעיל</span>
          <span className="text-base font-bold" style={{ color: "var(--primary)" }}>{providers.length}</span>
        </div>

        <p className="mt-3 text-[11px] text-muted-foreground leading-relaxed">
          Fixx עובדת בשבילך גם כשאין פעולה נדרשת — כדי שהמחירים שלך לא יקפצו בשקט
        </p>
      </div>


      <div className="mt-5 glass-card p-5">
        <p className="text-xs text-muted-foreground">חיסכון רבעוני</p>
        <div className="mt-4 h-32 flex items-end gap-3">
          {quarters.map((q, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
              <div className="w-full rounded-t-lg transition-all" style={{ height: `${(q.amount / max) * 100}%`, minHeight: 6, background: q.isCurrent ? "var(--primary)" : "rgba(255,255,255,0.12)" }} />
              <p className="text-[11px] text-muted-foreground">{q.label}</p>
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-2 text-sm">
          <TrendingUp className="size-4" style={{ color: diffPct >= 0 ? "var(--primary)" : "var(--danger)" }} />
          <span className="text-muted-foreground">השוואה לרבעון קודם:</span>
          <span className="font-semibold" style={{ color: diffPct >= 0 ? "var(--primary)" : "var(--danger)" }}>{diffPct >= 0 ? "+" : ""}{diffPct}%</span>
        </div>
      </div>

      <h2 className="mt-6 font-semibold">ספקים</h2>
      <div className="mt-3 flex flex-col gap-2.5">
        {providers.map((p) => {
          const isOpen = open === p.id;
          return (
            <div key={p.id} className="glass-card overflow-hidden">
              <button onClick={() => setOpen(isOpen ? null : p.id)} className="w-full p-4 flex items-center gap-3 text-right">
                <div className="size-10 rounded-xl flex items-center justify-center text-xl" style={{ background: "rgba(255,255,255,0.06)" }}>{p.logo_emoji}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{p.provider_name}</p>
                  <p className="text-[12px] text-muted-foreground truncate">₪{Math.round(Number(p.monthly_price || 0))} / חודש</p>
                </div>
                <ChevronDown className={"size-4 text-muted-foreground transition-transform " + (isOpen ? "rotate-180" : "")} />
              </button>
              {isOpen && (
                <div className="px-4 pb-4 border-t border-border pt-3 space-y-1.5 text-sm">
                  <Row k="חבילה נוכחית" v={p.plan_name || "—"} />
                  <Row k="קטגוריה" v={p.category} />
                  <Row k="פוטנציאל חיסכון" v={`${p.savings_score}/10`} />
                  {p.expiry_date && <Row k="פג תוקף" v={p.expiry_date} />}
                  <button
                    onClick={() => setSheetProvider(p)}
                    className="mt-3 w-full rounded-xl py-2.5 font-semibold text-primary-foreground text-sm"
                    style={{ background: "var(--primary)" }}
                  >
                    טפל עכשיו ←
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
      {sheetProvider && (
        <ProviderActionSheet
          provider={sheetProvider}
          open
          onOpenChange={(o) => {
            if (!o) setSheetProvider(null);
          }}
        />
      )}
    </AppShell>
  );
}
function Row({ k, v }: { k: string; v: string }) {
  return <div className="flex justify-between"><span className="text-muted-foreground">{k}</span><span>{v}</span></div>;
}
