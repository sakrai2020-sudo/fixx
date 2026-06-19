import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { ChevronRight, ChevronDown, Check } from "lucide-react";
import { type DetectedCharge } from "@/lib/scan-statement.functions";
import { ScreenshotUpload } from "@/components/ScreenshotUpload";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/bank-guide")({
  component: BankGuide,
});

type Entity = { id: string; emoji: string; name: string; steps: string[] };

type TabKey = "standing-orders" | "credit-card" | "direct-debit";

const standingOrderBanks: Entity[] = [
  { id: "poalim-so", emoji: "🏦", name: "בנק הפועלים", steps: [
    "פתח את אפליקציית הפועלים",
    "לחץ על \"חשבון\" בתפריט התחתון",
    "גלול ל\"עסקאות עתידיות\"",
    "בחר \"הוראות קבע\"",
    "צלם את הרשימה המלאה",
  ]},
  { id: "leumi-so", emoji: "🏦", name: "בנק לאומי", steps: [
    "פתח את אפליקציית לאומי",
    "בחר \"עו\"ש\" בתפריט התחתון",
    "לחץ על \"חיובים קבועים\"",
    "בחר \"הוראות קבע\"",
    "צלם את הרשימה המלאה",
  ]},
  { id: "discount-so", emoji: "🏦", name: "בנק דיסקונט", steps: [
    "פתח את אפליקציית דיסקונט",
    "כניסה לתפריט \"חשבון עו\"ש\"",
    "בחר \"חיובים והרשאות\"",
    "לחץ על \"הוראות קבע\"",
    "צלם את הרשימה המלאה",
  ]},
  { id: "mizrahi-so", emoji: "🏦", name: "בנק מזרחי", steps: [
    "פתח את אפליקציית מזרחי-טפחות",
    "בחר \"עובר ושב\"",
    "לחץ על \"חיובים והעברות עתידיות\"",
    "בחר \"הוראות קבע\"",
    "צלם את הרשימה המלאה",
  ]},
  { id: "fibi-so", emoji: "🏦", name: "בנק הבינלאומי", steps: [
    "פתח את אפליקציית הבינלאומי",
    "בחר \"עו\"ש\"",
    "לחץ על \"הרשאות לחיוב חשבון\"",
    "פתח \"הוראות קבע\"",
    "צלם את הרשימה המלאה",
  ]},
];

const creditCards: Entity[] = [
  { id: "cal", emoji: "💳", name: "ויזה כ.א.ל", steps: [
    "פתח את אפליקציית cal",
    "בחר את הכרטיס בעמוד הראשי",
    "לחץ על \"עסקאות עתידיות\"",
    "סנן לפי \"הוראות קבע\"",
    "צלם את הרשימה המלאה",
  ]},
  { id: "max", emoji: "💳", name: "מקס (לאומיקארד)", steps: [
    "פתח את אפליקציית max",
    "כניסה ל\"הפעולות שלי\"",
    "בחר \"הוראות קבע ותשלומים קבועים\"",
    "סקור את כל הרשומות",
    "צלם את הרשימה המלאה",
  ]},
  { id: "isracard", emoji: "💳", name: "ישראכרט", steps: [
    "פתח את אפליקציית ישראכרט",
    "בחר את הכרטיס הרצוי",
    "לחץ על \"חיובים עתידיים\"",
    "בחר \"הוראות קבע\"",
    "צלם את הרשימה המלאה",
  ]},
  { id: "amex", emoji: "💳", name: "אמריקן אקספרס", steps: [
    "פתח את אפליקציית American Express",
    "בחר את הכרטיס בעמוד הראשי",
    "לחץ על \"עסקאות מתוכננות\"",
    "סנן \"הוראות קבע\"",
    "צלם את הרשימה המלאה",
  ]},
];

const directDebitBanks: Entity[] = [
  { id: "poalim-dd", emoji: "🏦", name: "בנק הפועלים", steps: [
    "פתח את אפליקציית הפועלים",
    "לחץ על \"חשבון\" בתפריט התחתון",
    "בחר \"הרשאות לחיוב חשבון\"",
    "פתח \"הרשאות גבייה\"",
    "צלם את הרשימה המלאה",
  ]},
  { id: "leumi-dd", emoji: "🏦", name: "בנק לאומי", steps: [
    "פתח את אפליקציית לאומי",
    "בחר \"עו\"ש\" בתפריט התחתון",
    "לחץ על \"חיובים קבועים\"",
    "בחר \"הרשאות גבייה\"",
    "צלם את הרשימה המלאה",
  ]},
  { id: "discount-dd", emoji: "🏦", name: "בנק דיסקונט", steps: [
    "פתח את אפליקציית דיסקונט",
    "כניסה לתפריט \"חשבון עו\"ש\"",
    "בחר \"חיובים והרשאות\"",
    "לחץ על \"הרשאות לחיוב\"",
    "צלם את הרשימה המלאה",
  ]},
  { id: "mizrahi-dd", emoji: "🏦", name: "בנק מזרחי", steps: [
    "פתח את אפליקציית מזרחי-טפחות",
    "בחר \"עובר ושב\"",
    "לחץ על \"חיובים והעברות עתידיות\"",
    "בחר \"הרשאות גבייה\"",
    "צלם את הרשימה המלאה",
  ]},
];

type Stage = "idle" | "review";

export default function BankGuide() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabKey>("standing-orders");
  const [openId, setOpenId] = useState<string | null>(null);
  const [stage, setStage] = useState<Stage>("idle");
  const [results, setResults] = useState<DetectedCharge[]>([]);
  const [checked, setChecked] = useState<Set<number>>(new Set());
  const [saving, setSaving] = useState(false);
  const toggle = (id: string) => setOpenId((c) => (c === id ? null : id));

  const onScanResults = (charges: DetectedCharge[]) => {
    setResults(charges);
    setChecked(new Set(charges.map((_, i) => i)));
    setStage("review");
  };

  const confirm = async () => {
    setSaving(true);
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) { setSaving(false); return; }
    const rows = Array.from(checked).map((i) => {
      const c = results[i];
      const monthly = c.frequency === "annual" ? Math.round(c.monthly_amount / 12)
        : c.frequency === "quarterly" ? Math.round(c.monthly_amount / 3)
        : c.monthly_amount;
      return {
        user_id: u.user!.id,
        category_name: c.provider_name,
        price_range: `₪${monthly}/חודש`,
        details: { exact: monthly, min: monthly, max: monthly, company: c.provider_name } as any,
        registration_fee: null,
      };
    });
    if (rows.length > 0) {
      const { error } = await supabase.from("user_categories").insert(rows);
      if (error) { toast.error(error.message); setSaving(false); return; }
    }
    toast.success("נשמר — הסוכן מתחיל לעבוד");
    setSaving(false);
    navigate({ to: "/dashboard" });
  };

  if (stage === "review") {
    return (
      <AppShell showBottomNav={false}>
        <button type="button" onClick={() => setStage("idle")} className="nav-back btn-inline mt-2 flex items-center gap-1 text-sm text-muted-foreground">
          <ChevronRight className="size-4" /> חזרה
        </button>
        <h1 className="mt-3 text-[20px] font-bold">מצאנו את החיובים הבאים</h1>
        <p className="text-sm text-muted-foreground mt-1">בטל סימון לחיובים שאין צורך לעקוב אחריהם</p>
        <div className="mt-4 flex flex-col gap-2">
          {results.map((r, i) => {
            const on = checked.has(i);
            return (
              <button key={i} onClick={() => {
                const n = new Set(checked);
                if (on) n.delete(i); else n.add(i);
                setChecked(n);
              }} className="glass-card p-3 flex items-center justify-between text-right"
                style={on ? { borderColor: "var(--primary)" } : undefined}>
                <div className="size-5 rounded border grid place-content-center"
                  style={on ? { background: "var(--primary)", borderColor: "var(--primary)" } : { borderColor: "var(--border)" }}>
                  {on && <Check className="size-3" style={{ color: "var(--primary-foreground)" }} />}
                </div>
                <div className="flex-1 mr-3">
                  <p className="font-semibold text-sm">{r.provider_name}</p>
                  <p className="text-xs text-muted-foreground">
                    ₪{r.monthly_amount} · {r.frequency === "monthly" ? "חודשי" : r.frequency === "quarterly" ? "רבעוני" : "שנתי"}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
        <div className="sticky bottom-0 -mx-4 px-4 py-4 mt-6 bg-background/95 backdrop-blur border-t border-border">
          <button disabled={saving || checked.size === 0} onClick={confirm}
            className="w-full rounded-[20px] bg-primary text-primary-foreground font-bold py-4 teal-glow disabled:opacity-50">
            אשר והסוכן יתחיל לעבוד
          </button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell showBottomNav={false}>
      <button type="button" onClick={() => navigate({ to: "/dashboard" })} className="nav-back btn-inline mt-2 flex items-center gap-1 text-sm text-muted-foreground">
        <ChevronRight className="size-4" /> חזרה
      </button>

      <h1 className="mt-3 text-[20px] font-bold text-foreground">מדריך חיובים קבועים</h1>
      <p className="text-sm text-muted-foreground mt-1">בחר את מקור החיובים שברצונך למצוא</p>

      <div className="mt-4 glass-card p-4" style={{ borderColor: "var(--primary)", background: "rgba(0,194,168,0.08)" }}>
        <p className="text-sm leading-relaxed">
          <strong>💡 הדרך המהירה ביותר:</strong> פתח את אפליקציית הבנק או כרטיס האשראי שלך ← לחץ על 🔍 חיפוש ← הקלד "הוראות קבע" או "הרשאות" ← האפליקציה תעביר אותך ישירות לדף הנכון.
        </p>
      </div>

      <ScreenshotUpload
        onResults={onScanResults}
        buttonLabel="בחר צילום מהגלריה"
      />

      <div className="mt-4 glass-card p-4" style={{ borderColor: "var(--primary)", background: "rgba(0,194,168,0.06)" }}>
        <p className="text-sm leading-relaxed">
          <strong>💡 טיפ:</strong> ביטוחים מופיעים תחת <strong>הרשאות גבייה</strong> — לא תחת הוראות קבע. חפש בנפרד.
        </p>
      </div>

      {/* Tabs */}
      <div className="mt-6 flex flex-wrap gap-2 pb-1" dir="rtl">
        <TabButton
          active={activeTab === "standing-orders"}
          onClick={() => { setActiveTab("standing-orders"); setOpenId(null); }}
          emoji="🏦"
          label="הוראות קבע"
        />
        <TabButton
          active={activeTab === "credit-card"}
          onClick={() => { setActiveTab("credit-card"); setOpenId(null); }}
          emoji="💳"
          label="חיובי כרטיס"
        />
        <TabButton
          active={activeTab === "direct-debit"}
          onClick={() => { setActiveTab("direct-debit"); setOpenId(null); }}
          emoji="🔒"
          label="הרשאות גבייה"
        />
      </div>

      {activeTab === "standing-orders" && (
        <>
          <p className="mt-4 text-sm text-muted-foreground">הוראות קבע מופיעות בחשבון הבנק שלך — אלו העברות חוזרות שהגדרת.</p>
          <Section title="בנקים" items={standingOrderBanks} openId={openId} toggle={toggle} />
        </>
      )}

      {activeTab === "credit-card" && (
        <>
          <p className="mt-4 text-sm text-muted-foreground">חיובי כרטיס אשראי קבועים נמצאים באפליקציית חברת האשראי.</p>
          <Section title="חברות אשראי" items={creditCards} openId={openId} toggle={toggle} />
        </>
      )}

      {activeTab === "direct-debit" && (
        <>
          <div className="mt-4 glass-card p-4" style={{ background: "rgba(251,191,36,0.08)", borderColor: "rgba(251,191,36,0.4)" }}>
            <p className="text-sm leading-relaxed">
              <strong>🔒 מה זה הרשאות גבייה?</strong><br />
              חברות ביטוח וספקים נוספים גובים כסף ישירות מחשבון הבנק באמצעות הרשאת גבייה — לא דרך הוראת קבע רגילה. יש לחפש אותן בתפריט נפרד.
            </p>
          </div>
          <Section title="בנקים" items={directDebitBanks} openId={openId} toggle={toggle} />
        </>
      )}
    </AppShell>
  );
}

function TabButton({ active, onClick, emoji, label }: { active: boolean; onClick: () => void; emoji: string; label: string }) {
  return (
    <button
      onClick={onClick}
      className="flex-shrink-0 rounded-xl px-3 py-2 text-sm font-semibold flex items-center gap-1.5 transition-colors"
      style={{
        background: active ? "var(--primary)" : "var(--card)",
        color: active ? "var(--primary-foreground)" : "var(--foreground)",
        border: active ? "none" : "1px solid var(--border)",
      }}
    >
      <span>{emoji}</span>
      <span>{label}</span>
    </button>
  );
}

function Section({ title, items, openId, toggle }: { title: string; items: Entity[]; openId: string | null; toggle: (id: string) => void }) {
  return (
    <div className="mt-4">
      <p className="text-[11px] uppercase tracking-wider mb-2 text-muted-foreground">{title}</p>
      <div className="grid grid-cols-2 gap-2">
        {items.map((it) => {
          const open = openId === it.id;
          return (
            <button key={it.id} onClick={() => toggle(it.id)} className="glass-card p-3 text-right flex flex-col items-end"
              style={open ? { borderColor: "var(--primary)", gridColumn: "1 / -1" } : undefined}>
              <div className="w-full flex items-center justify-between">
                <ChevronDown className={`size-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">{it.name}</span>
                  <span className="text-xl">{it.emoji}</span>
                </div>
              </div>
              {open && (
                <ol className="mt-3 w-full space-y-2 list-decimal pr-5 text-right text-[13px] text-foreground" style={{ direction: "rtl" }}>
                  {it.steps.map((s, i) => <li key={i}>{s}</li>)}
                </ol>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
