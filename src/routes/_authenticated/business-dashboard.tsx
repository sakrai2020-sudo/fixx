import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Building2, Loader2, Bot, CreditCard, ChevronLeft } from "lucide-react";
import { BusinessAppShell } from "@/components/BusinessAppShell";
import { getAuthUserOrLocal } from "@/lib/auth-session";
import { fetchBusinessProfile } from "@/lib/account-type";
import { BUSINESS_EXPENSE_META, type BusinessProfile } from "@/lib/business";
import { formatCurrency } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/business-dashboard")({
  component: BusinessDashboard,
});

function BusinessDashboard() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const user = await getAuthUserOrLocal();
      const biz = await fetchBusinessProfile(user.id, user.source);
      if (!biz?.onboarding_complete) {
        navigate({ to: "/business-onboarding", replace: true });
        return;
      }
      setProfile(biz);
      setLoading(false);
    })();
  }, [navigate]);

  if (loading) {
    return (
      <BusinessAppShell>
        <div className="page-loading min-h-[60vh]">
          <Loader2 className="size-8 animate-spin" style={{ color: "var(--teal)" }} />
          <p className="text-sm">טוען את נתוני העסק…</p>
        </div>
      </BusinessAppShell>
    );
  }

  if (!profile) return null;

  const totalTracked = profile.fixed_expenses.length;

  return (
    <BusinessAppShell>
      <div className="flex items-center gap-3 mt-2">
        <div
          className="size-12 rounded-xl flex items-center justify-center"
          style={{ background: "rgba(255,107,0,0.12)", border: "1px solid rgba(255,107,0,0.35)" }}
        >
          <Building2 className="size-6" style={{ color: "var(--cta)" }} />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold truncate">{profile.business_name}</h1>
          <p className="text-sm text-muted-foreground">
            {profile.business_type}
            {profile.employee_count != null ? ` · ${profile.employee_count} עובדים` : ""}
          </p>
        </div>
      </div>

      <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
        <Bot className="size-4 shrink-0" style={{ color: "var(--teal)" }} />
        <span>הסוכן בודק {totalTracked} הוצאות קבועות של העסק</span>
      </div>

      <div className="mt-5 glass-card p-5">
        <p className="text-xs text-muted-foreground">פוטנציאל חיסכון חודשי</p>
        <p className="text-3xl font-bold mt-1" style={{ color: "var(--savings)" }}>
          {formatCurrency(totalTracked * 120)}
        </p>
        <p className="text-xs text-muted-foreground mt-2">אומדן ראשוני — הסוכן יעדכן לאחר סריקת השוק</p>
      </div>

      <Link
        to="/business-payment-processing"
        className="mt-4 block glass-card p-4 w-full text-right"
        style={{ borderColor: "rgba(255,107,0,0.45)", background: "rgba(255,107,0,0.06)" }}
      >
        <div className="flex items-center gap-3">
          <div
            className="size-11 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "rgba(255,107,0,0.15)" }}
          >
            <CreditCard className="size-5" style={{ color: "var(--cta)" }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm">עמלות סליקה — בדוק אם אתה משלם יותר מדי</p>
            <p className="text-xs text-muted-foreground mt-1">העלאת דוח או שאלון מהיר · ניתוח תוך דקות</p>
          </div>
          <ChevronLeft className="size-5 shrink-0 text-muted-foreground" />
        </div>
      </Link>

      <div className="mt-6 flex items-center justify-between">
        <h2 className="font-semibold">הוצאות העסק</h2>
        <Link to="/business-onboarding" className="text-xs" style={{ color: "var(--teal)" }}>
          עדכן פרטים
        </Link>
      </div>

      <div className="mt-3 flex flex-col gap-2.5">
        {profile.fixed_expenses.map((cat) => {
          const meta = BUSINESS_EXPENSE_META[cat];
          return (
            <div key={cat} className="glass-card p-4 flex items-center gap-3">
              <div className="text-2xl" aria-hidden>{meta.emoji}</div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{cat}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{meta.hint}</p>
              </div>
              <span
                className="shrink-0 text-[11px] font-semibold rounded-full px-2.5 py-1"
                style={{ background: "rgba(0,194,168,0.15)", color: "var(--teal)" }}
              >
                בבדיקה
              </span>
            </div>
          );
        })}
      </div>

      {profile.fixed_expenses.length === 0 && (
        <div className="empty-state mt-8">
          <p>לא הוגדרו הוצאות עדיין.</p>
          <Link to="/business-onboarding" className="inline-block mt-3 font-semibold" style={{ color: "var(--cta)" }}>
            השלם את השאלון העסקי
          </Link>
        </div>
      )}
    </BusinessAppShell>
  );
}
