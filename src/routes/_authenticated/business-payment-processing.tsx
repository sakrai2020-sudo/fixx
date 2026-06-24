import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ChevronRight, FileUp, Loader2, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { BusinessAppShell } from "@/components/BusinessAppShell";
import { getAuthUserOrLocal } from "@/lib/auth-session";
import { getAccountType } from "@/lib/account-type";
import {
  computeClearingSavings,
  PAYMENT_PROCESSORS,
  type PaymentProcessor,
  type PaymentProcessingSummary,
  savePaymentProcessingRecord,
} from "@/lib/payment-processing";

export const Route = createFileRoute("/_authenticated/business-payment-processing")({
  component: PaymentProcessingFlow,
});

type Step = "choose" | "upload" | "q1" | "q2" | "q3" | "summary";

function PaymentProcessingFlow() {
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>("choose");
  const [busy, setBusy] = useState(false);
  const [processor, setProcessor] = useState<PaymentProcessor | "">("");
  const [rateUnknown, setRateUnknown] = useState(false);
  const [rate, setRate] = useState("");
  const [volume, setVolume] = useState("");
  const [summary, setSummary] = useState<PaymentProcessingSummary | null>(null);
  const [userId, setUserId] = useState("");
  const [userSource, setUserSource] = useState<"local" | "supabase">("local");

  useEffect(() => {
    (async () => {
      const user = await getAuthUserOrLocal();
      const accountType = await getAccountType(user.id, user.source);
      if (accountType !== "business") {
        navigate({ to: "/dashboard", replace: true });
        return;
      }
      setUserId(user.id);
      setUserSource(user.source);
    })();
  }, [navigate]);

  const finishQuestionnaire = async (skippedVolume: boolean) => {
    if (!processor) {
      toast.error("יש לבחור חברת סליקה");
      return;
    }
    if (!rateUnknown && !rate.trim()) {
      toast.error("יש להזין אחוז עמלה או לסמן ״לא יודע״");
      return;
    }

    const currentRate = rateUnknown ? null : Number(rate);
    const monthlyVolume = skippedVolume || !volume.trim() ? null : Number(volume);

    setBusy(true);
    try {
      await savePaymentProcessingRecord(
        {
          user_id: userId,
          processor_name: processor,
          current_rate: currentRate,
          monthly_volume: monthlyVolume,
        },
        userSource,
      );
      const calc = computeClearingSavings(currentRate, monthlyVolume, rateUnknown);
      calc.processorName = processor;
      setSummary(calc);
      setStep("summary");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "שגיאה בשמירה");
    } finally {
      setBusy(false);
    }
  };

  const onPdfSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.type !== "application/pdf") {
      toast.error("יש להעלות קובץ PDF");
      return;
    }
    setBusy(true);
    try {
      await savePaymentProcessingRecord(
        {
          user_id: userId,
          processor_name: "דוח PDF הועלה",
          current_rate: null,
          monthly_volume: null,
        },
        userSource,
      );
      toast.success("הדוח התקבל — נשלח אליך ניתוח תוך 24 שעות");
      navigate({ to: "/business-dashboard" });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "שגיאה בהעלאה");
    } finally {
      setBusy(false);
    }
  };

  const onNegotiate = () => {
    toast.success("הסוכן יצור קשר לניהול מו״מ על עמלות הסליקה");
    navigate({ to: "/business-dashboard" });
  };

  return (
    <BusinessAppShell showBottomNav={false}>
      <button
        type="button"
        onClick={() => {
          if (step === "choose") navigate({ to: "/business-dashboard" });
          else if (step === "upload") setStep("choose");
          else if (step === "q1") setStep("choose");
          else if (step === "q2") setStep("q1");
          else if (step === "q3") setStep("q2");
          else if (step === "summary") setStep("choose");
        }}
        className="nav-back btn-inline mt-2 flex items-center gap-1 text-sm text-muted-foreground"
      >
        <ChevronRight className="size-4" /> חזרה
      </button>

      <h1 className="text-xl font-bold mt-4">עמלות סליקה</h1>
      <p className="text-sm text-muted-foreground mt-1">בדוק אם אתה משלם יותר מדי על סליקת אשראי</p>

      {step === "choose" && (
        <div className="mt-6 flex flex-col gap-4">
          <button
            type="button"
            onClick={() => setStep("upload")}
            className="glass-card p-5 text-right flex items-start gap-4 w-full"
            style={{ borderColor: "rgba(255,107,0,0.35)" }}
          >
            <div className="size-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(255,107,0,0.12)" }}>
              <FileUp className="size-5" style={{ color: "var(--cta)" }} />
            </div>
            <div>
              <p className="font-bold">מסלול א׳ — העלאת דוח</p>
              <p className="text-sm text-muted-foreground mt-1">העלה דוח סליקה (PDF)</p>
              <p className="text-xs mt-2" style={{ color: "var(--teal)" }}>נשלח אליך ניתוח תוך 24 שעות</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setStep("q1")}
            className="glass-card p-5 text-right flex items-start gap-4 w-full"
            style={{ borderColor: "rgba(0,194,168,0.35)" }}
          >
            <div className="size-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(0,194,168,0.12)" }}>
              <CreditCard className="size-5" style={{ color: "var(--teal)" }} />
            </div>
            <div>
              <p className="font-bold">מסלול ב׳ — שאלון מהיר</p>
              <p className="text-sm text-muted-foreground mt-1">3 שאלות קצרות ותקבל הערכת חיסכון מיידית</p>
            </div>
          </button>
        </div>
      )}

      {step === "upload" && (
        <div className="mt-8 flex flex-col items-center text-center">
          <input ref={fileRef} type="file" accept="application/pdf" className="sr-only" onChange={onPdfSelected} />
          <div
            className="w-full glass-card p-8"
            style={{ border: "2px dashed rgba(255,107,0,0.4)", background: "rgba(255,107,0,0.04)" }}
          >
            <FileUp className="size-10 mx-auto" style={{ color: "var(--cta)" }} />
            <p className="mt-4 font-semibold">העלה דוח סליקה (PDF)</p>
            <p className="text-sm text-muted-foreground mt-2">נשלח אליך ניתוח תוך 24 שעות</p>
            <button
              type="button"
              disabled={busy}
              onClick={() => fileRef.current?.click()}
              className="mt-6 w-full rounded-xl btn-cta font-bold py-3 cta-glow disabled:opacity-50"
            >
              {busy ? <Loader2 className="size-5 animate-spin mx-auto" /> : "בחר קובץ PDF"}
            </button>
          </div>
        </div>
      )}

      {step === "q1" && (
        <QuestionStep title="באיזו חברת סליקה אתה משתמש?" step={1}>
          <div className="flex flex-wrap gap-2">
            {PAYMENT_PROCESSORS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setProcessor(p)}
                className="rounded-full px-4 py-2 text-sm font-semibold border"
                style={
                  processor === p
                    ? { background: "var(--cta)", color: "#fff", borderColor: "var(--cta)" }
                    : { borderColor: "var(--border)", color: "var(--muted-foreground)" }
                }
              >
                {p}
              </button>
            ))}
          </div>
          <button
            type="button"
            disabled={!processor}
            onClick={() => setStep("q2")}
            className="mt-8 w-full rounded-xl btn-cta font-bold py-3 cta-glow disabled:opacity-40"
          >
            המשך
          </button>
        </QuestionStep>
      )}

      {step === "q2" && (
        <QuestionStep title="מה האחוז שאתה משלם?" step={2}>
          <input
            type="number"
            step="0.01"
            min={0}
            max={10}
            disabled={rateUnknown}
            value={rate}
            onChange={(e) => setRate(e.target.value)}
            placeholder="לדוגמה: 1.8"
            className="w-full min-h-11 rounded-xl px-4 text-sm bg-secondary border border-border outline-none focus:border-primary disabled:opacity-40"
          />
          <label className="mt-4 flex items-center gap-3 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={rateUnknown}
              onChange={(e) => {
                setRateUnknown(e.target.checked);
                if (e.target.checked) setRate("");
              }}
              className="size-4 rounded"
            />
            לא יודע
          </label>
          <button
            type="button"
            disabled={!rateUnknown && !rate.trim()}
            onClick={() => setStep("q3")}
            className="mt-8 w-full rounded-xl btn-cta font-bold py-3 cta-glow disabled:opacity-40"
          >
            המשך
          </button>
        </QuestionStep>
      )}

      {step === "q3" && (
        <QuestionStep
          title="מה המחזור החודשי המשוער בסליקה?"
          step={3}
          hint="ככל שהמחזור גדול יותר — כוח המיקוח גדל"
        >
          <input
            type="number"
            min={0}
            value={volume}
            onChange={(e) => setVolume(e.target.value)}
            placeholder="לדוגמה: 150000"
            className="w-full min-h-11 rounded-xl px-4 text-sm bg-secondary border border-border outline-none focus:border-primary"
          />
          <div className="mt-6 flex flex-col gap-2">
            <button
              type="button"
              disabled={busy || !volume.trim()}
              onClick={() => finishQuestionnaire(false)}
              className="w-full rounded-xl btn-cta font-bold py-3 cta-glow disabled:opacity-40"
            >
              {busy ? "מחשב…" : "ראה סיכום"}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => finishQuestionnaire(true)}
              className="w-full rounded-xl border border-border font-semibold py-3 text-muted-foreground"
            >
              דלג
            </button>
          </div>
        </QuestionStep>
      )}

      {step === "summary" && summary && (
        <div className="mt-6 glass-card p-6 text-center" style={{ borderColor: "rgba(255,107,0,0.4)" }}>
          <p className="text-xs text-muted-foreground uppercase tracking-wider">סיכום ניתוח עמלות</p>
          {summary.processorName && (
            <p className="text-sm mt-2 text-muted-foreground">{summary.processorName}</p>
          )}
          <div className="mt-6 space-y-4 text-right">
            <Row label="אתה משלם" value={summary.displayRate} highlight />
            <Row label="הממוצע בשוק" value={`${summary.marketAvg}%`} />
            <Row
              label="חיסכון פוטנציאלי שנתי"
              value={
                summary.annualSavings != null
                  ? `₪${summary.annualSavings.toLocaleString("he-IL")}`
                  : "הזן מחזור חודשי לחישוב"
              }
              savings
            />
          </div>
          <button
            type="button"
            onClick={onNegotiate}
            className="mt-8 w-full rounded-xl btn-cta font-bold py-4 cta-glow"
          >
            Fixx ינהל עבורך מו״מ
          </button>
          <Link to="/business-dashboard" className="block mt-4 text-sm text-muted-foreground">
            חזרה ללוח העסקי
          </Link>
        </div>
      )}
    </BusinessAppShell>
  );
}

function QuestionStep({
  title,
  step,
  hint,
  children,
}: {
  title: string;
  step: number;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-6">
      <p className="text-xs font-semibold" style={{ color: "var(--teal)" }}>שאלה {step} מתוך 3</p>
      <h2 className="text-lg font-bold mt-2">{title}</h2>
      {hint && <p className="text-sm text-muted-foreground mt-2">{hint}</p>}
      <div className="mt-5">{children}</div>
    </div>
  );
}

function Row({
  label,
  value,
  highlight,
  savings,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  savings?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2 border-b border-border/50 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span
        className="font-bold text-lg"
        style={{
          color: savings ? "var(--savings)" : highlight ? "var(--cta)" : "var(--foreground)",
        }}
      >
        {value}
      </span>
    </div>
  );
}
