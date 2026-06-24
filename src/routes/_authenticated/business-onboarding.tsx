import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import {
  BUSINESS_EXPENSE_OPTIONS,
  BUSINESS_TYPES,
  type BusinessExpenseCategory,
  type BusinessType,
} from "@/lib/business";
import { getAuthUserOrLocal } from "@/lib/auth-session";
import { saveBusinessProfile, setAccountType } from "@/lib/account-type";

export const Route = createFileRoute("/_authenticated/business-onboarding")({
  component: BusinessOnboarding,
});

function BusinessOnboarding() {
  const navigate = useNavigate();
  const [businessName, setBusinessName] = useState("");
  const [businessType, setBusinessType] = useState<BusinessType | "">("");
  const [employeeCount, setEmployeeCount] = useState("");
  const [expenses, setExpenses] = useState<BusinessExpenseCategory[]>([]);
  const [busy, setBusy] = useState(false);

  const toggleExpense = (cat: BusinessExpenseCategory) => {
    setExpenses((prev) =>
      prev.includes(cat) ? prev.filter((x) => x !== cat) : [...prev, cat],
    );
  };

  const submit = async () => {
    if (!businessName.trim()) {
      toast.error("יש להזין שם עסק");
      return;
    }
    if (!businessType) {
      toast.error("יש לבחור סוג עסק");
      return;
    }
    if (expenses.length === 0) {
      toast.error("בחר לפחות הוצאה קבועה אחת");
      return;
    }

    setBusy(true);
    try {
      const user = await getAuthUserOrLocal();
      await setAccountType(user.id, "business", user.source);
      await saveBusinessProfile(
        {
          user_id: user.id,
          business_name: businessName.trim(),
          business_type: businessType,
          employee_count: employeeCount ? Number(employeeCount) : null,
          fixed_expenses: expenses,
          onboarding_complete: true,
        },
        user.source,
      );
      toast.success("פרטי העסק נשמרו — הסוכן מתחיל לעבוד");
      navigate({ to: "/business-dashboard", replace: true });
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "שגיאה בשמירת פרטי העסק");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppShell showBottomNav={false}>
      <h1 className="text-xl font-bold mt-2">שאלון עסקי</h1>
      <p className="text-sm text-muted-foreground mt-1">ספר לנו על העסק — הסוכן יבדוק הוצאות קבועות בשבילך</p>

      <div className="mt-6 flex flex-col gap-4">
        <Field label="שם העסק">
          <input
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            placeholder="לדוגמה: קפה השכונה"
            className="w-full min-h-11 rounded-xl px-4 text-sm bg-secondary border border-border outline-none focus:border-primary"
          />
        </Field>

        <Field label="סוג העסק">
          <div className="flex flex-wrap gap-2">
            {BUSINESS_TYPES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setBusinessType(t)}
                className="rounded-full px-4 py-2 text-sm font-semibold border transition-colors"
                style={
                  businessType === t
                    ? { background: "var(--cta)", color: "#fff", borderColor: "var(--cta)" }
                    : { borderColor: "var(--border)", color: "var(--muted-foreground)" }
                }
              >
                {t}
              </button>
            ))}
          </div>
        </Field>

        <Field label="מספר עובדים (אופציונלי)">
          <input
            type="number"
            min={0}
            value={employeeCount}
            onChange={(e) => setEmployeeCount(e.target.value)}
            placeholder="לדוגמה: 12"
            className="w-full min-h-11 rounded-xl px-4 text-sm bg-secondary border border-border outline-none focus:border-primary"
          />
        </Field>

        <Field label="אילו הוצאות קבועות יש לעסק?">
          <div className="flex flex-col gap-2">
            {BUSINESS_EXPENSE_OPTIONS.map((cat) => {
              const on = expenses.includes(cat);
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => toggleExpense(cat)}
                  className="glass-card p-3 text-right flex items-center justify-between"
                  style={on ? { borderColor: "var(--teal)", boxShadow: "0 0 0 1px var(--teal)" } : undefined}
                >
                  <span className="text-sm font-medium">{cat}</span>
                  <span
                    className="size-5 rounded-md border flex items-center justify-center text-xs"
                    style={
                      on
                        ? { background: "var(--teal)", borderColor: "var(--teal)", color: "#0B1628" }
                        : { borderColor: "var(--border)" }
                    }
                  >
                    {on ? "✓" : ""}
                  </span>
                </button>
              );
            })}
          </div>
        </Field>
      </div>

      <button
        type="button"
        disabled={busy}
        onClick={submit}
        className="mt-8 w-full rounded-xl btn-cta font-bold py-4 cta-glow disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {busy ? "שומר…" : "המשך ללוח העסק"}
        <ArrowLeft className="size-4" />
      </button>
    </AppShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold mb-2">{label}</p>
      {children}
    </div>
  );
}
