import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { ChevronRight, ChevronLeft, Check, Clock, FileSearch, Phone } from "lucide-react";
import { toast } from "sonner";
import { loadingOverlay } from "@/lib/loading-overlay";
import {
  addLocalSavings,
  getLocalNegotiation,
  getLocalNegotiationEmail,
  getLocalOffers,
  getLocalProviderById,
  getLocalSwitchGuide,
  isLocalNegotiationId,
  updateLocalNegotiation,
  updateLocalProvider,
} from "@/lib/local-negotiations";
import { SwitchGuidePanel } from "@/components/SwitchGuidePanel";
import { SavingsSuccessPanel } from "@/components/ShareSavingsButton";
import { formatCurrency, formatDateIL } from "@/lib/format";
import type { SwitchGuide } from "@/lib/switch-guide";
import { Loader2 } from "lucide-react";
import { RetentionLiveAssist, type RetentionCallResult } from "@/components/RetentionLiveAssist";
import { setRecentSaving } from "@/lib/recent-saving";
import { getAuthUserOrLocal } from "@/lib/auth-session";

export const Route = createFileRoute("/_authenticated/negotiation/$id")({
  component: Negotiation,
});

function Negotiation() {
  const { id } = useParams({ from: "/_authenticated/negotiation/$id" });
  const navigate = useNavigate();
  const [neg, setNeg] = useState<any>(null);
  const [up, setUp] = useState<any>(null);
  const [offers, setOffers] = useState<any[]>([]);
  const [sentEmail, setSentEmail] = useState<{ subject: string; body: string } | null>(null);
  const [switchGuide, setSwitchGuide] = useState<SwitchGuide | null>(null);
  const [loading, setLoading] = useState(true);
  const [showRetention, setShowRetention] = useState(false);
  const [retentionResult, setRetentionResult] = useState<string | null>(null);
  const [retentionSuccessSavings, setRetentionSuccessSavings] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    if (isLocalNegotiationId(id)) {
      const data = getLocalNegotiation(id);
      setNeg(data);
      if (data?.user_provider_id) {
        setUp(getLocalProviderById(data.user_provider_id));
      }
      setOffers(getLocalOffers(id));
      setSwitchGuide(getLocalSwitchGuide(id));
      setSentEmail(data?.action_type === "switch_guide" ? null : getLocalNegotiationEmail(id));
      setLoading(false);
      return;
    }

    try {
      const guideRaw = sessionStorage.getItem(`neg-guide-${id}`);
      if (guideRaw) {
        setSwitchGuide(JSON.parse(guideRaw) as SwitchGuide);
        setSentEmail(null);
      } else {
        setSwitchGuide(null);
      }
    } catch {
      setSwitchGuide(null);
    }

    const { data } = await supabase.from("negotiations").select("*").eq("id", id).maybeSingle();
    setNeg(data);
    if (data?.user_provider_id) {
      const { data: u } = await supabase.from("user_providers").select("*").eq("id", data.user_provider_id).maybeSingle();
      setUp(u);
    }
    const { data: o } = await supabase.from("offers").select("*").eq("negotiation_id", id).order("monthly_price");
    setOffers(o || []);
    const { data: emailRow } = await supabase
      .from("negotiation_emails")
      .select("subject, body")
      .eq("negotiation_id", id)
      .order("sent_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    setSentEmail(emailRow);
    setLoading(false);
  };
  useEffect(() => { load(); }, [id]);

  const current = Number(up?.monthly_price || 0);
  const cheapest = offers[0];
  const competitorName = cheapest?.plan_name || "ספק מתחרה";
  const competitorPrice = cheapest ? Number(cheapest.monthly_price) : 0;

  const { triggered, reason } = useMemo(() => {
    if (!neg) return { triggered: false, reason: "" };
    const startedHours = (Date.now() - new Date(neg.started_at).getTime()) / 3600000;
    const noResponse = startedHours >= 48 && neg.status === "active";
    const cheaper = current > 0 && competitorPrice > 0 && (current - competitorPrice) / current > 0.15;
    return { triggered: noResponse || cheaper, reason: noResponse ? "ללא תגובה מהספק מעל 48 שעות" : "המתחרה זול במעל 15%" };
  }, [neg, current, competitorPrice]);

  const retentionTriggered = neg?.status === "retention_contact" || neg?.retention_call_status === "called";
  const competitiveOutcome = neg?.status === "no_better_offer";
  const hasOffers = offers.length > 0 && !competitiveOutcome;
  const step2State: "done" | "active" | "pending" =
    !neg ? "pending" : neg.status === "completed" || hasOffers || retentionTriggered ? "done" : "active";
  const step3State: "done" | "active" | "pending" =
    !neg ? "pending" : neg.status === "completed" || competitiveOutcome ? "done" : hasOffers || retentionTriggered ? "active" : "pending";

  const recheckDate = useMemo(() => {
    if (!neg?.started_at) return null;
    const d = new Date(neg.started_at);
    d.setDate(d.getDate() + 90);
    return formatDateIL(d.toISOString());
  }, [neg?.started_at]);

  const completeRetentionStayed = async (offerAmount: number) => {
    const annualSave = Math.max(0, (current - offerAmount) * 12);
    if (isLocalNegotiationId(id) && up) {
      updateLocalProvider(up.id, { monthly_price: offerAmount });
      updateLocalNegotiation(id, {
        status: "completed",
        retention_call_status: "offer_received",
        retention_offer_amount: offerAmount,
        script_used: true,
      });
      addLocalSavings(annualSave / 4);
      setRetentionResult(`נשארת עם ${up.provider_name} · ${formatCurrency(offerAmount)}/חודש`);
      setRetentionSuccessSavings(annualSave);
      setShowRetention(false);
      return;
    }

    const user = await getAuthUserOrLocal();
    const { error: upErr } = await supabase
      .from("user_providers")
      .update({ monthly_price: offerAmount })
      .eq("id", up.id);
    if (upErr) throw upErr;
    const { error: nErr } = await supabase
      .from("negotiations")
      .update({
        status: "completed",
        retention_call_status: "offer_received",
        retention_offer_amount: offerAmount,
        script_used: true,
      })
      .eq("id", id);
    if (nErr) throw nErr;
    const now = new Date();
    const q = Math.floor(now.getMonth() / 3) + 1;
    const quarterShare = annualSave / 4;
    const { data: existing } = await supabase
      .from("savings")
      .select("*")
      .eq("user_id", user.id)
      .eq("year", now.getFullYear())
      .eq("quarter", q)
      .maybeSingle();
    if (existing) {
      await supabase
        .from("savings")
        .update({ amount: Number(existing.amount) + quarterShare })
        .eq("id", existing.id);
    } else {
      await supabase.from("savings").insert({
        user_id: user.id,
        year: now.getFullYear(),
        quarter: q,
        amount: quarterShare,
      });
    }
    setRetentionResult(`נשארת עם ${up?.provider_name} · ${formatCurrency(offerAmount)}/חודש`);
    setRetentionSuccessSavings(annualSave);
    setShowRetention(false);
    load();
  };

  const setRecommendation = async (type: "switch_strategy" | "direct_negotiation") => {
    if (isLocalNegotiationId(id)) {
      updateLocalNegotiation(id, {
        recommendation_type: type,
        ...(type === "switch_strategy"
          ? { status: "retention_contact", retention_call_status: "pending" }
          : {}),
      });
      if (type === "switch_strategy") {
        toast.success("הסוכן יזם תהליך מעבר. נעדכן כשמחלקת השימור תיצור קשר.");
      } else {
        toast.success("ממשיכים במו״מ ישיר");
      }
      load();
      return;
    }

    await supabase.from("negotiations").update({ recommendation_type: type }).eq("id", id);
    if (type === "switch_strategy") {
      toast.success("הסוכן יזם תהליך מעבר. נעדכן כשמחלקת השימור תיצור קשר.");
      await supabase.from("negotiations").update({ status: "retention_contact", retention_call_status: "pending" }).eq("id", id);
    } else {
      toast.success("ממשיכים במו״מ ישיר");
    }
    load();
  };

  const markCompetitiveOutcome = async () => {
    if (isLocalNegotiationId(id)) {
      updateLocalNegotiation(id, { status: "no_better_offer" });
      toast.success("הסוכן סיים את הבדיקה — המחיר שלך תחרותי");
      load();
      return;
    }
    await supabase.from("negotiations").update({ status: "no_better_offer" }).eq("id", id);
    toast.success("הסוכן סיים את הבדיקה — המחיר שלך תחרותי");
    load();
  };

  if (loading) {
    return (
      <AppShell showBottomNav={false}>
        <div className="page-loading">
          <Loader2 className="size-8 animate-spin" style={{ color: "var(--primary)" }} />
          <p className="text-sm">הסוכן טוען את המו״מ…</p>
        </div>
      </AppShell>
    );
  }

  if (!neg) {
    return (
      <AppShell showBottomNav={false}>
        <div className="empty-state mt-10">
          <p className="font-semibold text-foreground">המו״מ לא נמצא</p>
          <p className="mt-2">ייתכן שהנתונים נמחקו. התחל מו״מ חדש מהדף הראשי.</p>
          <button type="button" onClick={() => navigate({ to: "/dashboard" })} className="mt-4 btn-primary px-6 py-3">
            חזרה לדף הבית
          </button>
        </div>
      </AppShell>
    );
  }

  if (retentionSuccessSavings != null) {
    return (
      <AppShell showBottomNav={false}>
        <SavingsSuccessPanel
          annualSavings={retentionSuccessSavings}
          headline="כל הכבוד! 🎉"
          subtitle="נשארת עם הספק והחיסכון מהשימור נרשם."
          onContinue={() => {
            setRecentSaving(retentionSuccessSavings);
            navigate({ to: "/dashboard" });
          }}
          continueLabel="המשך ללוח הבקרה"
        />
      </AppShell>
    );
  }

  const deadline = neg.deadline ? new Date(neg.deadline) : null;
  const hoursLeft = deadline ? Math.max(0, Math.round((deadline.getTime() - Date.now()) / 3600000)) : 0;

  return (
    <AppShell showBottomNav={false}>
      <button onClick={() => navigate({ to: "/dashboard" })} className="nav-back btn-inline mt-2 flex items-center gap-1 text-sm text-muted-foreground">
        <ChevronRight className="size-4" /> חזרה
      </button>

      <div className="mt-4 glass-card p-5">
        <div className="flex items-center gap-3">
          <div className="size-12 rounded-xl flex items-center justify-center text-2xl" style={{ background: "rgba(255,255,255,0.06)" }}>{up?.logo_emoji}</div>
          <div className="flex-1">
            <p className="font-bold text-lg">{up?.provider_name}</p>
            <p className="text-xs text-muted-foreground">{up?.category}</p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold" style={{ background: "rgba(0,194,168,0.15)", color: "var(--primary)" }}>
            <span className="relative inline-flex size-2"><span className="absolute inset-0 rounded-full pulse-ring" style={{ background: "var(--primary)" }} /><span className="relative size-2 rounded-full" style={{ background: "var(--primary)" }} /></span>
            {competitiveOutcome ? "הבדיקה הושלמה" : retentionTriggered ? "מחלקת שימור יצרה קשר" : "מו״מ פעיל"}
          </span>
        </div>
      </div>

      <div className="mt-3 glass-card p-4">
        <p className="text-xs text-muted-foreground">החבילה הנוכחית</p>
        <div className="mt-1.5 flex justify-between items-baseline">
          <p className="font-semibold">{up?.plan_name || "—"}</p>
          <p className="text-lg font-bold">{formatCurrency(current)} <span className="text-xs text-muted-foreground font-normal">/חודש</span></p>
        </div>
        {up?.expiry_date && <p className="text-xs text-muted-foreground mt-1">פג תוקף: {formatDateIL(up.expiry_date)}</p>}
      </div>

      {retentionTriggered && (
        <button onClick={() => setShowRetention(true)} className="mt-4 w-full glass-card p-4 text-right flex items-center gap-3" style={{ borderColor: "var(--primary)", background: "rgba(0,194,168,0.06)" }}>
          <div className="size-10 rounded-full flex items-center justify-center" style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>
            <Phone className="size-5" />
          </div>
          <div className="flex-1">
            <p className="font-bold">שיחת שימור נכנסת 📞</p>
            <p className="text-xs text-muted-foreground mt-0.5">מחלקת השימור של {up?.provider_name} — Live Assist</p>
          </div>
          <ChevronLeft className="size-4 text-muted-foreground" />
        </button>
      )}

      {retentionResult && (
        <div className="mt-3 glass-card p-3 text-sm" style={{ borderColor: "rgba(0,194,168,0.35)" }}>
          <p className="font-semibold" style={{ color: "var(--primary)" }}>תוצאת שיחת השימור</p>
          <p className="text-muted-foreground mt-1">{retentionResult}</p>
        </div>
      )}

      {competitiveOutcome && (
        <div className="mt-3 glass-card p-4" style={{ borderColor: "rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.03)" }}>
          <p className="font-semibold">✓ המחיר שלך תחרותי</p>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
            הסוכן פנה לספק ובדק את השוק — לא נמצאה הצעה טובה יותר, או שהספק לא הגיב. המחיר הנוכחי שלך כבר במסגרת התחרותית.
          </p>
          {recheckDate && (
            <p className="text-xs text-muted-foreground mt-3">בדיקה חוזרת אוטומטית: {recheckDate}</p>
          )}
        </div>
      )}

      {triggered && !neg.recommendation_type && !retentionTriggered && (
        <div className="mt-4 glass-card p-4" style={{ borderRightWidth: 0, borderLeftWidth: 4, borderLeftColor: "var(--primary)" }}>
          <p className="font-bold">המלצת הסוכן 🧠</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">{reason}</p>
          <p className="text-sm mt-2 leading-relaxed">
            כדאי לעבור ל{competitorName} לתקופה קצרה. ספקים רבים מציעים את המחיר הטוב ביותר רק לאחר שהלקוח עוזב בפועל. הסוכן יעקוב ויודיע כשמחלקת השימור תיצור קשר.
          </p>
          <div className="mt-4 flex flex-col gap-2">
            <button onClick={() => setRecommendation("switch_strategy")} className="w-full rounded-[14px] bg-primary text-primary-foreground font-bold py-3 teal-glow">
              התחל תהליך מעבר
            </button>
            <button onClick={() => setRecommendation("direct_negotiation")} className="w-full rounded-[14px] border border-border font-semibold py-3 text-foreground">
              המשך מו״מ ישיר
            </button>
          </div>
        </div>
      )}

      <div className="mt-5 flex flex-col gap-0">
        <Step idx={1} state="done" icon={<Check className="size-4" />} title={switchGuide ? "הסוכן מצא הצעה" : "פנייה נשלחה לספק"} subtitle={switchGuide ? "מדריך מעבר מוכן" : "הסוכן יזם מו״מ"} />
        <Step idx={2} state={step2State} icon={<Clock className="size-4" />} title="ממתינים לתגובה" subtitle={`דדליין: ${hoursLeft} שעות`} />
        <Step idx={3} state={step3State} icon={<FileSearch className="size-4" />} title="ניתוח הצעת נגד" subtitle={step3State === "active" ? (retentionTriggered ? "מחלקת שימור פעילה" : "הצעות מתחרות זמינות") : step3State === "done" ? "המו״מ הושלם" : "בקרוב"} />
      </div>

      {switchGuide && (
        <div className="mt-5">
          <SwitchGuidePanel guide={switchGuide} savingsAmount={competitorPrice > 0 ? current - competitorPrice : null} />
        </div>
      )}

      {sentEmail && !switchGuide && (
        <div className="mt-5 glass-card p-4 text-right">
          <p className="text-xs text-muted-foreground">אימייל מו״מ שנשלח לספק</p>
          <p className="mt-1 text-sm font-semibold">{sentEmail.subject}</p>
          <pre
            className="mt-3 whitespace-pre-wrap text-[13px] leading-relaxed text-foreground/90 font-sans"
            style={{ transition: "none" }}
          >
            {sentEmail.body}
          </pre>
        </div>
      )}

      {!competitiveOutcome && (
      <button
        type="button"
        onClick={() => {
          loadingOverlay.show("הסוכן סורק את השוק הישראלי");
          navigate({ to: "/negotiation/$id/offers", params: { id } });
        }}
        className="mt-6 w-full rounded-[20px] bg-primary text-primary-foreground font-bold py-4 flex items-center justify-center gap-2 teal-glow"
      >
        ראה הצעות שהסוכן מצא <ChevronLeft className="size-4" />
      </button>
      )}

      {!competitiveOutcome && !retentionTriggered && (
        <button
          type="button"
          onClick={markCompetitiveOutcome}
          className="mt-3 w-full rounded-[20px] border border-border font-semibold py-3.5 text-muted-foreground"
        >
          הסוכן סיים — המחיר תחרותי
        </button>
      )}

      {showRetention && (
        <RetentionLiveAssist
          context={{
            providerName: up?.provider_name || "",
            competitorName: cheapest?.provider_name || competitorName,
            competitorPrice,
            currentPrice: current,
          }}
          markCalled={async () => {
            if (isLocalNegotiationId(id)) {
              updateLocalNegotiation(id, { retention_call_status: "called", script_used: true });
              return;
            }
            await supabase
              .from("negotiations")
              .update({ retention_call_status: "called", script_used: true })
              .eq("id", id);
          }}
          onClose={() => {
            setShowRetention(false);
            load();
          }}
          onComplete={async (result: RetentionCallResult) => {
            try {
              if (result.outcome === "stayed" && result.offerAmount) {
                await completeRetentionStayed(result.offerAmount);
                toast.success("החיסכון מהשימור נרשם");
                return;
              }
              if (result.outcome === "switch") {
                if (isLocalNegotiationId(id)) {
                  updateLocalNegotiation(id, {
                    retention_call_status: "no_deal",
                    script_used: true,
                  });
                } else {
                  await supabase
                    .from("negotiations")
                    .update({
                      retention_call_status: "no_deal",
                      script_used: true,
                    })
                    .eq("id", id);
                }
                setShowRetention(false);
                loadingOverlay.show("ממשיך לתהליך המעבר");
                navigate({
                  to: "/negotiation/$id/offers",
                  params: { id },
                  search: { handoff: "1" },
                });
              }
            } catch (e: any) {
              toast.error(e?.message || "שגיאה בשמירת תוצאת השיחה");
            }
          }}
        />
      )}
    </AppShell>
  );
}

function Step({ idx, state, icon, title, subtitle }: { idx: number; state: "done" | "active" | "pending"; icon: React.ReactNode; title: string; subtitle: string }) {
  const colors = state === "done" ? "var(--primary)" : state === "active" ? "var(--warning)" : "var(--muted-foreground)";
  return (
    <div className="flex gap-3 items-start">
      <div className="flex flex-col items-center">
        <div className="size-9 rounded-full flex items-center justify-center relative" style={{ background: state === "pending" ? "rgba(255,255,255,0.04)" : `color-mix(in oklab, ${colors} 18%, transparent)`, color: colors, border: `1px solid ${colors}` }}>
          {state === "active" && <span className="absolute inset-0 rounded-full pulse-ring" style={{ background: colors }} />}
          <span className="relative">{icon}</span>
        </div>
        {idx < 3 && <div className="w-px flex-1 my-1" style={{ background: "var(--border)" }} />}
      </div>
      <div className="pb-6 pt-1">
        <p className="text-sm font-semibold" style={{ color: colors }}>{title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
      </div>
    </div>
  );
}
