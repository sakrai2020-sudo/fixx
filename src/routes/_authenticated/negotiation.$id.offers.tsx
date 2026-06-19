import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AppShell } from "@/components/AppShell";
import { PostActionConfirmationCard } from "@/components/PostActionConfirmationCard";
import { supabase } from "@/integrations/supabase/client";
import { getAuthUserOrLocal } from "@/lib/auth-session";
import { submitActionConfirmation } from "@/lib/action-confirmation.service";
import { createActionConfirmation } from "@/lib/post-action-confirmation.functions";
import type { ActionConfirmation } from "@/lib/post-action-confirmation";
import {
  addLocalSavings,
  getLocalNegotiation,
  getLocalOffers,
  getLocalProviderById,
  isLocalNegotiationId,
  updateLocalNegotiation,
  updateLocalProvider,
} from "@/lib/local-negotiations";
import { ChevronRight, Check } from "lucide-react";
import { toast } from "sonner";
import { searchMarketOffers } from "@/lib/search-offers.functions";
import { loadingOverlay } from "@/lib/loading-overlay";
import { SavingsSuccessPanel } from "@/components/ShareSavingsButton";
import { ProviderRegistrationPanel } from "@/components/ProviderRegistrationPanel";
import { recordProviderConversion, requiresProviderSwitch } from "@/lib/provider-registration";
import { setRecentSaving } from "@/lib/recent-saving";


export const Route = createFileRoute("/_authenticated/negotiation/$id/offers")({
  validateSearch: (search: Record<string, unknown>) => ({
    handoff: typeof search.handoff === "string" ? search.handoff : undefined,
  }),
  component: Offers,
});

function Offers() {
  const { id } = useParams({ from: "/_authenticated/negotiation/$id/offers" });
  const { handoff } = Route.useSearch();
  const navigate = useNavigate();
  const handoffStarted = useRef(false);
  const runSearch = useServerFn(searchMarketOffers);
  const runCreateConfirmation = useServerFn(createActionConfirmation);
  const [offers, setOffers] = useState<any[]>([]);
  const [up, setUp] = useState<any>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [successSavings, setSuccessSavings] = useState<number | null>(null);
  const [activeConfirmation, setActiveConfirmation] = useState<ActionConfirmation | null>(null);
  const [pendingRegistration, setPendingRegistration] = useState<{
    savings: number;
    fromProvider: string;
    toProvider: string;
    planName: string;
    monthlyPrice: number;
  } | null>(null);

  const loadOffersFromDb = async () => {
    if (isLocalNegotiationId(id)) {
      const o = getLocalOffers(id);
      setOffers(o);
      const value = o.find((x) => x.offer_type === "value");
      if (value) setSelected(value.id);
      return o;
    }

    const { data: o } = await supabase.from("offers").select("*").eq("negotiation_id", id).order("monthly_price");
    setOffers(o || []);
    const value = o?.find((x: any) => x.offer_type === "value");
    if (value) setSelected(value.id);
    return o || [];
  };

  const triggerSearch = async () => {
    if (isLocalNegotiationId(id)) {
      await loadOffersFromDb();
      return;
    }

    setSearchError(null);
    const token = loadingOverlay.show("הסוכן סורק את השוק הישראלי");
    try {
      await runSearch({ data: { negotiationId: id } });
      await loadOffersFromDb();
    } catch (e: any) {
      console.error("AI search failed:", e);
      setSearchError("הסוכן לא מצא הצעות כרגע — נסה שוב מאוחר יותר");
    } finally {
      window.requestAnimationFrame(() => window.requestAnimationFrame(() => loadingOverlay.hide(token)));
    }
  };

  useEffect(() => {
    let cancelled = false;
    const token = loadingOverlay.show("הסוכן סורק את השוק הישראלי");
    (async () => {
      try {
        if (isLocalNegotiationId(id)) {
          const n = getLocalNegotiation(id);
          if (cancelled) return;
          if (n?.user_provider_id) {
            setUp(getLocalProviderById(n.user_provider_id));
          }
          await loadOffersFromDb();
          return;
        }

        const { data: n } = await supabase.from("negotiations").select("*").eq("id", id).maybeSingle();
        if (cancelled) return;
        if (n?.user_provider_id) {
          const { data: u } = await supabase.from("user_providers").select("*").eq("id", n.user_provider_id).maybeSingle();
          if (cancelled) return;
          setUp(u);
        }
        const existing = await loadOffersFromDb();
        if (cancelled) return;
        if (existing.length === 0 && !searchError) {
          await triggerSearch();
        }
      } catch (e) {
        console.error("Failed to load negotiation:", e);
        setSearchError("הסוכן לא הצליח לסרוק כעת — נסה שוב");
      } finally {
        if (!cancelled) window.requestAnimationFrame(() => window.requestAnimationFrame(() => loadingOverlay.hide(token)));
      }
    })();
    return () => { cancelled = true; loadingOverlay.hide(token); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const current = Number(up?.monthly_price || 0);

  const compute = (price: number, regFee: number) => {
    const monthlySave = Math.max(0, current - price);
    const annualSave = monthlySave * 12;
    const net = annualSave - regFee;
    const payback = monthlySave > 0 && regFee > 0 ? Math.ceil(regFee / monthlySave) : 0;
    let verdict: "recommend" | "warn" | "skip" = "skip";
    if (net >= 500) verdict = "recommend";
    else if (net >= 200) verdict = "warn";
    return { monthlySave, annualSave, net, payback, regFee, verdict };
  };

  const bestOffer = offers.length > 0 ? offers.reduce((a, b) => Number(a.monthly_price) < Number(b.monthly_price) ? a : b) : null;
  const bestCalc = bestOffer ? compute(Number(bestOffer.monthly_price), Number(bestOffer.registration_fee || 0)) : null;

  const finishWithSavings = (
    net: number,
    offer: { provider_name: string; plan_name: string; monthly_price: number },
  ) => {
    const savings = Math.max(0, net);
    if (up && requiresProviderSwitch(up.provider_name, offer.provider_name)) {
      setPendingRegistration({
        savings,
        fromProvider: up.provider_name,
        toProvider: offer.provider_name,
        planName: offer.plan_name,
        monthlyPrice: Number(offer.monthly_price),
      });
      return;
    }
    setSuccessSavings(savings);
  };

  useEffect(() => {
    if (handoff !== "1" || handoffStarted.current || !up || offers.length === 0) return;
    const switchOffer = offers.find((o) => requiresProviderSwitch(up.provider_name, o.provider_name));
    if (!switchOffer) return;
    handoffStarted.current = true;
    setSelected(switchOffer.id);
    const calc = compute(Number(switchOffer.monthly_price), Number(switchOffer.registration_fee || 0));
    finishWithSavings(calc.net, switchOffer);
    navigate({ to: "/negotiation/$id/offers", params: { id }, search: {}, replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handoff, up, offers, id]);

  const completeRegistration = async () => {
    if (!pendingRegistration || !up) return;
    setBusy(true);
    try {
      const rollback = {
        user_provider_id: up.id,
        provider_name: pendingRegistration.fromProvider,
        plan_name: up.plan_name || "חבילה נוכחית",
        monthly_price: Number(up.monthly_price || 0),
        negotiation_id: id,
        savings_quarter_share: pendingRegistration.savings / 4,
      };

      recordProviderConversion({
        negotiationId: id,
        fromProvider: pendingRegistration.fromProvider,
        toProvider: pendingRegistration.toProvider,
        planName: pendingRegistration.planName,
      });

      if (isLocalNegotiationId(id)) {
        updateLocalProvider(up.id, {
          plan_name: pendingRegistration.planName,
          monthly_price: pendingRegistration.monthlyPrice,
          provider_name: pendingRegistration.toProvider,
        });
        updateLocalNegotiation(id, { status: "completed" });
        addLocalSavings(pendingRegistration.savings / 4);
      } else {
        const user = await getAuthUserOrLocal();
        const { error: upErr } = await supabase
          .from("user_providers")
          .update({
            plan_name: pendingRegistration.planName,
            monthly_price: pendingRegistration.monthlyPrice,
            provider_name: pendingRegistration.toProvider,
          })
          .eq("id", up.id);
        if (upErr) throw upErr;
        const { error: nErr } = await supabase
          .from("negotiations")
          .update({ status: "completed" })
          .eq("id", id);
        if (nErr) throw nErr;
        const now = new Date();
        const q = Math.floor(now.getMonth() / 3) + 1;
        const quarterShare = pendingRegistration.savings / 4;
        const { data: existing } = await supabase
          .from("savings")
          .select("*")
          .eq("user_id", user.id)
          .eq("year", now.getFullYear())
          .eq("quarter", q)
          .maybeSingle();
        if (existing) {
          const { error } = await supabase
            .from("savings")
            .update({ amount: Number(existing.amount) + quarterShare })
            .eq("id", existing.id);
          if (error) throw error;
        } else {
          const { error } = await supabase.from("savings").insert({
            user_id: user.id,
            year: now.getFullYear(),
            quarter: q,
            amount: quarterShare,
          });
          if (error) throw error;
        }
      }

      const conf = await submitActionConfirmation(
        {
          negotiationId: isLocalNegotiationId(id) ? undefined : id,
          actionType: "switch",
          providerName: pendingRegistration.toProvider,
          planName: pendingRegistration.planName,
          monthlyPrice: pendingRegistration.monthlyPrice,
          rollback,
        },
        { create: runCreateConfirmation },
      );
      toast.info("נשלח פרוטוקול אישור ב-SMS ובדוא״ל — 3 ימים לאישור");

      setActiveConfirmation(conf);
      setSuccessSavings(pendingRegistration.savings);
      setPendingRegistration(null);
    } catch (e: any) {
      toast.error(e?.message || "שגיאה בשמירת ההרשמה");
    } finally {
      setBusy(false);
    }
  };

  const confirm = async () => {
    if (!selected) return;
    const offer = offers.find((o) => o.id === selected);
    if (!offer || !up) return;
    setBusy(true);
    try {
      const calc = compute(Number(offer.monthly_price), Number(offer.registration_fee || 0));
      const user = await getAuthUserOrLocal();
      const needsSwitch = requiresProviderSwitch(up.provider_name, offer.provider_name);

      if (needsSwitch) {
        toast.success("ההצעה אושרה — השלם את ההרשמה אצל הספק החדש");
        finishWithSavings(calc.net, offer);
        return;
      }

      const rollback = {
        user_provider_id: up.id,
        provider_name: up.provider_name,
        plan_name: up.plan_name || "חבילה נוכחית",
        monthly_price: Number(up.monthly_price || 0),
        negotiation_id: id,
        savings_quarter_share: calc.net / 4,
      };

      if (isLocalNegotiationId(id)) {
        updateLocalProvider(up.id, {
          plan_name: offer.plan_name,
          monthly_price: offer.monthly_price,
          provider_name: offer.provider_name,
        });
        updateLocalNegotiation(id, { status: "completed" });
        addLocalSavings(calc.net / 4);
      } else {
        const { error: upErr } = await supabase
          .from("user_providers")
          .update({
            plan_name: offer.plan_name,
            monthly_price: offer.monthly_price,
            provider_name: offer.provider_name,
          })
          .eq("id", up.id);
        if (upErr) throw upErr;
        const { error: nErr } = await supabase
          .from("negotiations")
          .update({ status: "completed" })
          .eq("id", id);
        if (nErr) throw nErr;
        const now = new Date();
        const q = Math.floor(now.getMonth() / 3) + 1;
        const { data: existing } = await supabase
          .from("savings")
          .select("*")
          .eq("user_id", user.id)
          .eq("year", now.getFullYear())
          .eq("quarter", q)
          .maybeSingle();
        const quarterShare = calc.net / 4;
        if (existing) {
          const { error } = await supabase
            .from("savings")
            .update({ amount: Number(existing.amount) + quarterShare })
            .eq("id", existing.id);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from("savings")
            .insert({ user_id: user.id, year: now.getFullYear(), quarter: q, amount: quarterShare });
          if (error) throw error;
        }
      }

      const conf = await submitActionConfirmation(
        {
          negotiationId: isLocalNegotiationId(id) ? undefined : id,
          actionType: "registration",
          providerName: offer.provider_name,
          planName: offer.plan_name,
          monthlyPrice: Number(offer.monthly_price),
          rollback,
        },
        { create: runCreateConfirmation },
      );
      toast.success("ההצעה אושרה — חיסכון נטו ₪" + Math.round(calc.net).toLocaleString("he-IL") + " בשנה");
      toast.info("נשלח פרוטוקול אישור ב-SMS ובדוא״ל — 3 ימים לאישור");
      setActiveConfirmation(conf);
      setSuccessSavings(Math.max(0, calc.net));
    } catch (e: any) {
      toast.error(e?.message || "שגיאה באישור ההצעה");
    } finally {
      setBusy(false);
    }
  };

  const label = (t: string) => t === "cheapest" ? "הכי זולה" : t === "value" ? "הכי משתלמת" : "פרמיום";

  if (pendingRegistration) {
    return (
      <AppShell showBottomNav={false}>
        <h1 className="mt-3 text-xl font-bold">השלמת ההרשמה</h1>
        <p className="text-sm text-muted-foreground">
          מעבר מ-{pendingRegistration.fromProvider} ל-{pendingRegistration.toProvider}
        </p>
        <ProviderRegistrationPanel
          fromProvider={pendingRegistration.fromProvider}
          toProvider={pendingRegistration.toProvider}
          planName={pendingRegistration.planName}
          busy={busy}
          onComplete={completeRegistration}
        />
      </AppShell>
    );
  }

  if (successSavings != null) {
    return (
      <AppShell showBottomNav={false}>
        <SavingsSuccessPanel
          annualSavings={successSavings}
          headline="כל הכבוד! חסכת עם Fixx"
          subtitle="ההצעה אושרה והחיסכון נרשם בחשבון שלך."
          onContinue={() => {
            setRecentSaving(successSavings);
            navigate({ to: "/dashboard" });
          }}
          continueLabel="המשך ללוח הבקרה"
        />
        {activeConfirmation && (
          <PostActionConfirmationCard
            confirmation={activeConfirmation}
            compact
            onResolved={(updated) => {
              setActiveConfirmation(updated.status === "pending" ? updated : null);
            }}
          />
        )}
      </AppShell>
    );
  }

  return (
    <AppShell showBottomNav={false}>
      <button onClick={() => navigate({ to: "/negotiation/$id", params: { id } })} className="nav-back btn-inline mt-2 flex items-center gap-1 text-sm text-muted-foreground">
        <ChevronRight className="size-4" /> חזרה
      </button>

      <h1 className="mt-3 text-xl font-bold">הצעות {up?.provider_name}</h1>
      <p className="text-sm text-muted-foreground">הסוכן חישב כדאיות נטו (כולל דמי הרשמה).</p>

      {searchError && offers.length === 0 && (
        <div className="mt-10 flex flex-col items-center justify-center text-center">
          <p className="text-base font-semibold text-foreground">הסוכן לא הצליח לסרוק כעת — נסה שוב</p>
          <button onClick={triggerSearch} className="mt-6 rounded-[14px] bg-primary text-primary-foreground font-bold px-5 py-3">
            נסה שוב
          </button>
        </div>
      )}


      {bestCalc && (
        <div className="mt-4 glass-card p-4 text-center" style={{ borderColor: "rgba(0,194,168,0.4)", background: "rgba(0,194,168,0.06)" }}>
          <p className="text-xs text-muted-foreground">חיסכון שנתי נטו (מקסימלי)</p>
          <p className="text-2xl font-bold mt-1" style={{ color: "var(--primary)" }}>
            ₪{Math.round(bestCalc.net).toLocaleString("he-IL")}
          </p>
          {bestCalc.verdict === "skip" && (
            <p className="mt-2 text-[12px]" style={{ color: "var(--muted-foreground)" }}>
              החיסכון אינו מצדיק את דמי ההרשמה. הסוכן ימשיך במו״מ מול הספק הנוכחי.
            </p>
          )}
        </div>
      )}

      <div className="mt-4 flex flex-col gap-3">
        {offers.map((o) => {
          const calc = compute(Number(o.monthly_price), Number(o.registration_fee || 0));
          const isSel = selected === o.id;
          const isRec = calc.verdict === "recommend";
          return (
            <button key={o.id} onClick={() => setSelected(o.id)} className="glass-card p-4 text-right relative"
              style={isSel ? { borderColor: "var(--primary)", boxShadow: "0 0 0 1px var(--primary)" } : undefined}>
              {isRec && (
                <span className="absolute -top-2 right-4 rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>מומלץ</span>
              )}
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[11px] uppercase tracking-wider" style={{ color: "var(--primary)" }}>{label(o.offer_type)}</p>
                  <p className="mt-0.5 font-bold">{o.plan_name}</p>
                </div>
                <div className="text-left">
                  <p className="text-xl font-bold">₪{Math.round(Number(o.monthly_price))}</p>
                  <p className="text-[11px] text-muted-foreground">/חודש</p>
                </div>
              </div>
              <ul className="mt-3 space-y-1">
                {(Array.isArray(o.features) ? o.features : []).map((f: string, i: number) => (
                  <li key={i} className="text-[13px] text-muted-foreground flex items-center gap-2">
                    <span className="size-1.5 rounded-full" style={{ background: "var(--primary)" }} />{f}
                  </li>
                ))}
              </ul>

              <div className="mt-3 rounded-lg p-2.5 text-[12px] leading-relaxed"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)" }}>
                <p className="text-foreground">
                  חיסכון חודשי: <strong>₪{Math.round(calc.monthlySave).toLocaleString("he-IL")}</strong>
                  {" | "}דמי הרשמה: <strong>₪{Math.round(calc.regFee).toLocaleString("he-IL")}</strong>
                  {" | "}החזר השקעה תוך: <strong>{calc.payback > 0 ? `${calc.payback} חודשים` : "מיידי"}</strong>
                </p>
              </div>

              {calc.verdict === "recommend" && calc.payback > 0 && (
                <p className="mt-2 text-[12px] font-semibold" style={{ color: "var(--primary)" }}>
                  ✓ החזר השקעה תוך {calc.payback} חודשים · חיסכון נטו ₪{Math.round(calc.net).toLocaleString("he-IL")}/שנה
                </p>
              )}
              {calc.verdict === "warn" && (
                <div className="mt-2 rounded-lg p-2.5 text-[12px]"
                  style={{ background: "rgba(245,158,11,0.10)", border: "1px solid rgba(245,158,11,0.5)", color: "#F59E0B" }}>
                  ⚠ החיסכון מצדיק מעבר רק אם תישאר לפחות שנה בספק החדש.
                </div>
              )}
              {calc.verdict === "skip" && (
                <p className="mt-2 text-[12px] text-muted-foreground">
                  ✕ החיסכון אינו מצדיק את דמי ההרשמה.
                </p>
              )}

              {isSel && (
                <div className="absolute top-3 left-3 size-6 rounded-full flex items-center justify-center" style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>
                  <Check className="size-3.5" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      <button disabled={!selected || busy} onClick={confirm} className="mt-6 w-full rounded-[20px] bg-primary text-primary-foreground font-bold py-4 disabled:opacity-40 teal-glow">
        אשר את ההצעה הנבחרת
      </button>
      <p className="mt-2 text-center text-[11px] text-muted-foreground">המעבר לספק יבוצע רק לאחר אישור מפורש שלך</p>
    </AppShell>
  );
}
