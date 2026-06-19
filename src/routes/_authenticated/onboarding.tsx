import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { AppShell } from "@/components/AppShell";
import { ScreenshotUpload } from "@/components/ScreenshotUpload";
import { CATEGORIES, type Category, PRICE_RANGES, categoryHasNumericRanges, categoryMaxFromRanges, estimatePrice, getRangesForCategory, parsePriceRange } from "@/lib/categories";
import { getProviderNamesForAppCategory } from "@/lib/providers-list";
import type { DetectedCharge } from "@/lib/scan-statement.functions";
import { buildProvidersFromOnboarding, getLocalProviderStore, markOnboardingSkipped, saveLocalProviders } from "@/lib/local-providers";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/onboarding")({
  component: Onboarding,
});

const ELECTRICITY = "חברת חשמל";
const CELLULAR = "סלולר";
const GYM = "מועדון כושר";
const CAR_INSURANCE = "ביטוח רכב";
const KIDS_ACTIVITIES = "חוגי ילדים";
const HEALTH_FUND = "קופת חולים";

const CELL_CARRIERS = [...getProviderNamesForAppCategory("סלולר"), "אחר"] as const;

const NO_CLAIMS_OPTIONS = ["כן — 3 שנים ומעלה", "כן — פחות מ-3 שנים", "לא"] as const;
const COVERAGE_OPTIONS = ["מקיף", "חובה בלבד", "שניהם"] as const;
const CHILDREN_COUNT_OPTIONS = ["1", "2", "3+"] as const;

const ELEC_PROVIDERS = [...getProviderNamesForAppCategory("חברת חשמל"), "אחר"];
const ELEC_METER = ["כן", "לא", "לא יודע"];
const ELEC_DISCOUNT = ["הנחה קבועה", "הנחת יום", "הנחת לילה", "הנחת סופ\"ש", "אין לי הנחה", "לא יודע"];

type PriceDetails = { min: number; max: number; exact: number | null; company?: string | null; selectedRange?: string | null };
type CellularDetails = PriceDetails & {
  carrier: (typeof CELL_CARRIERS)[number] | null;
  carrier_other: string | null;
};
type ElecDetails = { provider: string | null; smart_meter: string | null; discount_type: string | null; selectedRange?: string | null; min?: number; max?: number };
type GymDetails = { club_name: string | null; monthly: number | null; signup_fee: number | null; join_month: string | null; selectedRange?: string | null; min?: number; max?: number };
type CarInsuranceDetails = {
  insurance_company: string | null;
  annual_total: number | null;
  vehicle_type: string | null;
  year_on_road: number | null;
  no_claims: (typeof NO_CLAIMS_OPTIONS)[number] | null;
  coverage_type: (typeof COVERAGE_OPTIONS)[number] | null;
  selectedRange?: string | null;
  min?: number;
  max?: number;
};
type KidsActivityEntry = {
  activity_name: string | null;
  organization_name: string | null;
  child_age: number | null;
  monthly_price: number | null;
  registration_fee: number | null;
  children_registered: (typeof CHILDREN_COUNT_OPTIONS)[number] | null;
};
type KidsActivitiesDetails = { activities: KidsActivityEntry[]; selectedRange?: string | null; min?: number; max?: number };
type Details = PriceDetails | CellularDetails | ElecDetails | GymDetails | CarInsuranceDetails | KidsActivitiesDetails;

function resolvedCellularProvider(d: CellularDetails): string | null {
  if (!d.carrier) return null;
  if (d.carrier === "אחר") return d.carrier_other?.trim() || null;
  return d.carrier;
}

function isPriceComplete(p: PriceDetails, categoryName?: string): boolean {
  if (p.exact != null && p.exact >= 0) return true;
  if (categoryName === HEALTH_FUND) return !!p.selectedRange;
  if (p.selectedRange && categoryName && !categoryHasNumericRanges(categoryName)) return true;
  return p.min >= 0 && p.max > p.min;
}

function emptyKidsActivityEntry(): KidsActivityEntry {
  return {
    activity_name: null,
    organization_name: null,
    child_age: null,
    monthly_price: null,
    registration_fee: null,
    children_registered: null,
  };
}

function isKidsActivityEntryComplete(entry: KidsActivityEntry): boolean {
  return !!(
    entry.activity_name?.trim() &&
    entry.organization_name?.trim() &&
    entry.child_age != null &&
    entry.child_age > 0 &&
    entry.monthly_price != null &&
    entry.monthly_price > 0 &&
    entry.children_registered
  );
}

function normalizeLoadedDetails(name: string, raw: unknown): Details {
  if (name === CELLULAR) {
    const parsed = raw as Partial<CellularDetails> | null | undefined;
    const base = defaultDetails(name) as CellularDetails;
    if (!parsed || typeof parsed !== "object") return base;
    return {
      ...base,
      ...parsed,
      carrier: parsed.carrier ?? base.carrier,
      carrier_other: parsed.carrier_other ?? base.carrier_other,
    };
  }
  if (name === KIDS_ACTIVITIES) {
    const parsed = raw as Partial<KidsActivitiesDetails> | null | undefined;
    if (parsed?.activities?.length) {
      return {
        activities: parsed.activities.map((a) => ({
          ...emptyKidsActivityEntry(),
          ...a,
        })),
      };
    }
    return defaultDetails(name) as KidsActivitiesDetails;
  }
  if (raw && typeof raw === "object" && Object.keys(raw as object).length > 0) {
    return raw as Details;
  }
  return defaultDetails(name);
}

function categoryMax(name: string): number {
  return categoryMaxFromRanges(name);
}

function readRangeSlice(d: Details, categoryName: string): { min: number; max: number; selectedRange: string | null } {
  const any = d as PriceDetails & ElecDetails & GymDetails & CarInsuranceDetails & KidsActivitiesDetails;
  const peak = categoryMaxFromRanges(categoryName);
  return {
    min: any.min ?? Math.round(peak * 0.2),
    max: any.max ?? Math.round(peak * 0.5),
    selectedRange: any.selectedRange ?? null,
  };
}

function defaultDetails(name: string): Details {
  if (name === ELECTRICITY) return { provider: null, smart_meter: null, discount_type: null };
  if (name === GYM) return { club_name: null, monthly: null, signup_fee: null, join_month: null };
  if (name === CAR_INSURANCE) {
    return {
      insurance_company: null,
      annual_total: null,
      vehicle_type: null,
      year_on_road: null,
      no_claims: null,
      coverage_type: null,
    };
  }
  if (name === KIDS_ACTIVITIES) {
    return { activities: [emptyKidsActivityEntry()] };
  }
  if (name === CELLULAR) {
    const max = categoryMax(name);
    return { min: Math.round(max * 0.2), max: Math.round(max * 0.5), exact: null, carrier: null, carrier_other: null };
  }
  const max = categoryMax(name);
  const base: PriceDetails = { min: Math.round(max * 0.2), max: Math.round(max * 0.5), exact: null };
  const cat = CATEGORIES.find((c) => c.name === name);
  if (cat?.needsCompany) base.company = null;
  return base;
}

function summarize(name: string, d: Details): string | null {
  if (name === ELECTRICITY) {
    const e = d as ElecDetails;
    if (!e.provider && !e.smart_meter && !e.discount_type) return null;
    return [e.provider, e.smart_meter && `מונה חכם: ${e.smart_meter}`, e.discount_type]
      .filter(Boolean).join(" · ");
  }
  if (name === GYM) {
    const g = d as GymDetails;
    if (!g.monthly && !g.club_name) return null;
    return [g.club_name, g.monthly && `₪${g.monthly}/חודש`].filter(Boolean).join(" · ");
  }
  if (name === CAR_INSURANCE) {
    const c = d as CarInsuranceDetails;
    if (!c.insurance_company && c.annual_total == null) return null;
    return [
      c.insurance_company,
      c.annual_total != null && `₪${c.annual_total.toLocaleString("he-IL")}/שנה`,
      c.vehicle_type,
      c.year_on_road && String(c.year_on_road),
      c.coverage_type,
    ]
      .filter(Boolean)
      .join(" · ");
  }
  if (name === KIDS_ACTIVITIES) {
    const k = d as KidsActivitiesDetails;
    const parts = k.activities
      .filter((a) => a.activity_name || a.monthly_price != null)
      .map((a) =>
        [a.activity_name, a.organization_name, a.monthly_price != null && `₪${a.monthly_price}/חודש`]
          .filter(Boolean)
          .join(" · "),
      );
    return parts.length ? parts.join(" | ") : null;
  }
  if (name === HEALTH_FUND) {
    const p = d as PriceDetails;
    return p.selectedRange ? `מסלול ${p.selectedRange}` : null;
  }
  if (name === CELLULAR) {
    const c = d as CellularDetails;
    const carrier = resolvedCellularProvider(c);
    const prefix = carrier ? `${carrier} · ` : "";
    if (c.exact != null) return `${prefix}₪${c.exact}`;
    return carrier ? `${prefix}₪${c.min}-${c.max}` : null;
  }
  const p = d as PriceDetails;
  const cat = CATEGORIES.find((c) => c.name === name);
  const suffix = cat?.annual ? "/שנה" : "";
  const prefix = p.company ? `${p.company} · ` : "";
  if (p.exact != null) return `${prefix}₪${p.exact}${suffix}`;
  return `${prefix}₪${p.min}-${p.max}${suffix}`;
}

function monthlyFromCharge(charge: DetectedCharge): number {
  if (charge.frequency === "annual") return Math.round(charge.monthly_amount / 12);
  if (charge.frequency === "quarterly") return Math.round(charge.monthly_amount / 3);
  return charge.monthly_amount;
}

function matchCategoryForCharge(charge: DetectedCharge): string {
  const provider = charge.provider_name.trim().toLowerCase();
  const direct = CATEGORIES.find((c) => c.name.toLowerCase() === provider);
  if (direct) return direct.name;

  const fuzzy = CATEGORIES.find((c) => {
    const name = c.name.toLowerCase();
    return provider.includes(name) || name.includes(provider);
  });
  if (fuzzy) return fuzzy.name;

  return "חיובים קבועים אחרים";
}

function detailsFromCharge(categoryName: string, charge: DetectedCharge): Details {
  const monthly = monthlyFromCharge(charge);
  if (categoryName === ELECTRICITY) {
    return { provider: charge.provider_name, smart_meter: "לא יודע", discount_type: "לא יודע" };
  }
  if (categoryName === GYM) {
    return { club_name: charge.provider_name, monthly, signup_fee: null, join_month: null };
  }
  if (categoryName === CAR_INSURANCE) {
    const annual = charge.frequency === "annual" ? charge.monthly_amount : monthly * 12;
    return {
      insurance_company: charge.provider_name,
      annual_total: annual,
      vehicle_type: null,
      year_on_road: null,
      no_claims: null,
      coverage_type: null,
    };
  }
  const cat = CATEGORIES.find((c) => c.name === categoryName);
  const max = categoryMax(categoryName);
  const base: PriceDetails = { min: monthly, max: monthly, exact: monthly };
  if (categoryName === CELLULAR) {
    const carrier = CELL_CARRIERS.find((c) => charge.provider_name.includes(c)) ?? "אחר";
    return {
      min: monthly,
      max: monthly,
      exact: monthly,
      carrier,
      carrier_other: carrier === "אחר" ? charge.provider_name : null,
    } as CellularDetails;
  }
  if (cat?.needsCompany) base.company = charge.provider_name;
  else if (categoryName === "חיובים קבועים אחרים") base.company = charge.provider_name;
  return base;
}

function isComplete(name: string, d: Details): boolean {
  if (name === ELECTRICITY) {
    const e = d as ElecDetails;
    return !!(e.provider && e.smart_meter && e.discount_type);
  }
  if (name === GYM) {
    const g = d as GymDetails;
    return !!(g.club_name && g.monthly != null && g.monthly > 0);
  }
  if (name === CAR_INSURANCE) {
    const c = d as CarInsuranceDetails;
    return !!(
      c.insurance_company?.trim() &&
      c.annual_total != null &&
      c.annual_total > 0 &&
      c.vehicle_type?.trim() &&
      c.year_on_road != null &&
      c.year_on_road >= 1980 &&
      c.no_claims &&
      c.coverage_type
    );
  }
  if (name === KIDS_ACTIVITIES) {
    const k = d as KidsActivitiesDetails;
    return k.activities.some(isKidsActivityEntryComplete);
  }
  if (name === CELLULAR) {
    const c = d as CellularDetails;
    return !!resolvedCellularProvider(c) && isPriceComplete(c, CELLULAR);
  }
  const p = d as PriceDetails;
  return isPriceComplete(p, name);
}

function Pill({ on, children, onClick }: { on: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <button onClick={onClick} data-inline="true"
      className="btn-inline rounded-full px-3 py-2 text-sm border transition-colors min-h-[36px]"
      style={on
        ? { background: "var(--primary)", color: "var(--primary-foreground)", borderColor: "var(--primary)" }
        : { borderColor: "var(--border)", color: "var(--muted-foreground)" }}>
      {children}
    </button>
  );
}

function RangeSlider({ value, max, onChange }: { value: [number, number]; max: number; onChange: (v: [number, number]) => void }) {
  const step = max >= 5000 ? 100 : 10;
  const safeMax = Math.max(value[0] + step, value[1]);
  const safeValue: [number, number] = [value[0], safeMax];
  return (
    <SliderPrimitive.Root
      dir="ltr"
      min={0}
      max={max}
      step={step}
      value={safeValue}
      onValueChange={(v) => {
        const mn = v[0] ?? 0;
        const mx = Math.max(mn + step, v[1] ?? mn + step);
        onChange([mn, mx]);
      }}
      className="relative flex w-full touch-none select-none items-center h-5"
    >
      <SliderPrimitive.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-primary/20">
        <SliderPrimitive.Range className="absolute h-full bg-primary" />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb className="block h-4 w-4 rounded-full border border-primary bg-background shadow focus-visible:outline-none" />
      <SliderPrimitive.Thumb className="block h-4 w-4 rounded-full border border-primary bg-background shadow focus-visible:outline-none" />
    </SliderPrimitive.Root>
  );
}

/** Demo buildPriceRanges parity — range pills + slider per category. */
function CategoryRangePicker({
  category,
  min,
  max,
  selectedRange,
  onSelectRange,
  onSliderChange,
}: {
  category: Category;
  min: number;
  max: number;
  selectedRange: string | null;
  onSelectRange: (range: string) => void;
  onSliderChange: (min: number, max: number) => void;
}) {
  const ranges = PRICE_RANGES[category.name] ?? getRangesForCategory(category.name);
  const numeric = categoryHasNumericRanges(category.name);
  const sliderMax = categoryMaxFromRanges(category.name);
  const rangeLabel = category.annual ? "סכום שנתי כולל" : "טווח חודשי משוער";

  if (!ranges.length) return null;

  return (
    <div className="flex flex-col gap-3 mb-4 pb-4 border-b border-border">
      <p className="text-xs font-semibold">{category.emoji} {category.name} — בחר טווח</p>
      <div className="flex flex-wrap gap-2">
        {ranges.map((r) => (
          <Pill key={r} on={selectedRange === r} onClick={() => onSelectRange(r)}>
            {r}
          </Pill>
        ))}
      </div>
      {numeric && (
        <>
          <p className="text-xs font-semibold">{rangeLabel}</p>
          <div className="flex items-center justify-between text-xs text-muted-foreground" dir="ltr">
            <span>₪{min.toLocaleString("he-IL")}</span>
            <span>טווח משוער</span>
            <span>₪{max.toLocaleString("he-IL")}+</span>
          </div>
          <RangeSlider
            value={[min, max]}
            max={sliderMax}
            onChange={([mn, mx]) => onSliderChange(mn, mx)}
          />
        </>
      )}
    </div>
  );
}

function Onboarding() {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [details, setDetails] = useState<Record<string, Details>>({});
  const [regFees, setRegFees] = useState<Record<string, number | null>>({});

  useEffect(() => {
    const store = getLocalProviderStore();
    if (!store?.draft) return;

    const sel = new Set<string>();
    const dt: Record<string, Details> = {};
    const fees: Record<string, number | null> = {};
    store.draft.selected.forEach((name) => {
      sel.add(name);
      dt[name] = normalizeLoadedDetails(name, store.draft.details[name]);
      fees[name] = store.draft.regFees[name] ?? null;
    });
    setSelected(sel);
    setDetails(dt);
    setRegFees(fees);
  }, []);

  const toggle = (name: string) => {
    const ns = new Set(selected);
    const nd = { ...details };
    const nf = { ...regFees };
    if (ns.has(name)) { ns.delete(name); delete nd[name]; delete nf[name]; }
    else { ns.add(name); nd[name] = defaultDetails(name); nf[name] = null; }
    setSelected(ns); setDetails(nd); setRegFees(nf);
  };

  const updateDetails = (name: string, patch: Partial<Details>) => {
    setDetails((prev) => ({ ...prev, [name]: { ...(prev[name] || defaultDetails(name)), ...patch } as Details }));
  };

  const applyRangeSelection = (categoryName: string, range: string) => {
    const cat = CATEGORIES.find((c) => c.name === categoryName);
    if (!cat) return;

    if (categoryHasNumericRanges(categoryName)) {
      const { min, max } = parsePriceRange(range);
      const est = estimatePrice(range);
      const base: Record<string, unknown> = { selectedRange: range, min, max, exact: null };

      if (categoryName === GYM) {
        updateDetails(categoryName, { ...base, monthly: est } as Partial<GymDetails>);
        return;
      }
      if (categoryName === CAR_INSURANCE) {
        updateDetails(categoryName, { ...base, annual_total: Math.round(est) } as Partial<CarInsuranceDetails>);
        return;
      }
      if (categoryName === KIDS_ACTIVITIES) {
        const current = (details[categoryName] as KidsActivitiesDetails) || (defaultDetails(categoryName) as KidsActivitiesDetails);
        const activities = current.activities.map((a, i) =>
          i === 0 ? { ...a, monthly_price: est } : a,
        );
        updateDetails(categoryName, { ...base, activities } as Partial<KidsActivitiesDetails>);
        return;
      }
      updateDetails(categoryName, base as Partial<Details>);
      return;
    }

    if (categoryName === HEALTH_FUND) {
      updateDetails(categoryName, { selectedRange: range } as Partial<PriceDetails>);
      return;
    }

    updateDetails(categoryName, { selectedRange: range } as Partial<Details>);
  };

  const applySliderRange = (categoryName: string, min: number, max: number) => {
    updateDetails(categoryName, { min, max, exact: null, selectedRange: null } as Partial<Details>);
  };

  const applyScannedCharges = (charges: DetectedCharge[]) => {
    const ns = new Set(selected);
    const nd = { ...details };
    for (const charge of charges) {
      const cat = matchCategoryForCharge(charge);
      ns.add(cat);
      nd[cat] = detailsFromCharge(cat, charge);
    }
    setSelected(ns);
    setDetails(nd);
    toast.success(`נמצאו ${charges.length} חיובים — בדוק את הפרטים למטה`);
  };

  const progress = useMemo(() => {
    const step1 = Math.min(50, (selected.size / 5) * 50);
    const completed = Array.from(selected).filter((n) => isComplete(n, details[n] || defaultDetails(n))).length;
    const step2 = selected.size === 0 ? 0 : (completed / selected.size) * 50;
    return Math.round(step1 + step2);
  }, [selected, details]);

  const submit = () => {
    if (selected.size === 0) {
      toast.error("בחר לפחות קטגוריה אחת");
      return;
    }

    const incomplete = Array.from(selected).filter(
      (name) => !isComplete(name, details[name] || defaultDetails(name)),
    );
    if (incomplete.length > 0) {
      toast.error(`יש להשלים פרטים עבור: ${incomplete.slice(0, 2).join(", ")}${incomplete.length > 2 ? "…" : ""}`);
      return;
    }

    const providers = buildProvidersFromOnboarding(selected, details);
    saveLocalProviders(providers, {
      selected: Array.from(selected),
      details,
      regFees,
      providerNames: Object.fromEntries(
        Array.from(selected).map((cat) => [
          cat,
          cat === CELLULAR ? resolvedCellularProvider(details[cat] as CellularDetails) : null,
        ]),
      ),
    });
    window.location.href = "/dashboard";
  };

  return (
    <AppShell showBottomNav={false}>
      <h1 className="text-2xl font-bold mt-2">ספר לנו על החבילות שלך</h1>
      <p className="text-sm text-muted-foreground mt-1">בחר קטגוריה ← ענה על הפרטים. אפשר לדלג ולהשלים אחר כך.</p>

      <div className="mt-4 h-1.5 rounded-full bg-muted overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, background: "var(--primary)" }} />
      </div>

      <p className="mt-6 text-sm font-semibold">שלב 1 — בחר את הקטגוריות שלך</p>
      <div className="mt-3 grid grid-cols-2 gap-2.5">
        {CATEGORIES.map((c) => {
          const on = selected.has(c.name);
          return (
            <button key={c.name} onClick={() => toggle(c.name)}
              className={"glass-card text-right p-3 flex items-center gap-2 transition-all " + (c.full ? "col-span-2 " : "") + (on ? "ring-2 teal-glow" : "")}
              style={on ? { borderColor: "var(--primary)", boxShadow: "0 0 0 1px var(--primary), 0 0 24px -8px var(--primary)" } : undefined}>
              <span className="text-xl">{c.emoji}</span>
              <span className="text-[13px] font-medium leading-tight">{c.name}</span>
            </button>
          );
        })}
      </div>

      {selected.size > 0 && (
        <>
          <p className="mt-7 text-sm font-semibold">שלב 2 — פרטים</p>
          <div className="mt-3 flex flex-col gap-3">
            {CATEGORIES.filter((c) => selected.has(c.name)).map((c) => {
              const d = details[c.name] || defaultDetails(c.name);
              const rangeSlice = readRangeSlice(d, c.name);
              return (
                <div key={c.name} className="glass-card p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-lg">{c.emoji}</span>
                    <span className="font-semibold text-sm">{c.name}</span>
                  </div>

                  <CategoryRangePicker
                    category={c}
                    min={rangeSlice.min}
                    max={rangeSlice.max}
                    selectedRange={rangeSlice.selectedRange}
                    onSelectRange={(range) => applyRangeSelection(c.name, range)}
                    onSliderChange={(min, max) => applySliderRange(c.name, min, max)}
                  />

                  {c.name === ELECTRICITY ? (
                    <ElectricityForm
                      value={d as ElecDetails}
                      onChange={(patch) => updateDetails(c.name, patch)}
                    />
                  ) : c.name === GYM ? (
                    <GymForm
                      value={d as GymDetails}
                      onChange={(patch) => updateDetails(c.name, patch)}
                    />
                  ) : c.name === CAR_INSURANCE ? (
                    <CarInsuranceForm
                      value={d as CarInsuranceDetails}
                      onChange={(patch) => updateDetails(c.name, patch)}
                    />
                  ) : c.name === KIDS_ACTIVITIES ? (
                    <KidsActivitiesForm
                      value={d as KidsActivitiesDetails}
                      onChange={(patch) => updateDetails(c.name, patch)}
                    />
                  ) : c.name === CELLULAR ? (
                    <CellularForm
                      value={d as CellularDetails}
                      max={categoryMax(c.name)}
                      onChange={(patch) => updateDetails(c.name, patch)}
                    />
                  ) : (
                    <PriceForm
                      category={c}
                      value={d as PriceDetails}
                      max={categoryMax(c.name)}
                      onChange={(patch) => updateDetails(c.name, patch)}
                    />
                  )}

                  {(["מועדון כושר","ברי מים","אבטחה ומיגון","ניקיון וגינון","טלוויזיה ואינטרנט"].includes(c.name)) && (
                    <div className="mt-4 pt-3 border-t border-border">
                      <NumberField
                        label={c.name === "טלוויזיה ואינטרנט" ? "דמי התקנה/חיבור (אם שילמת)" : "דמי הרשמה/התחברות (אם יש)"}
                        value={regFees[c.name] ?? null}
                        onChange={(v) => setRegFees((p) => ({ ...p, [c.name]: v }))}
                        hint="חד-פעמי — הסוכן יכלול אותם בחישוב הכדאיות"
                        placeholder="₪"
                        optional
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      <ScreenshotUpload
        className="mt-5 rounded-2xl p-4 text-center"
        onResults={applyScannedCharges}
      />

      <div className="sticky bottom-0 -mx-4 px-4 py-4 mt-6 bg-background/95 backdrop-blur border-t border-border flex flex-col sm:flex-row gap-2 max-w-full overflow-x-hidden">
        <button type="button" onClick={submit} className="w-full sm:flex-[2] rounded-[20px] bg-primary text-primary-foreground font-bold py-4 flex items-center justify-center gap-2 teal-glow">
          הסוכן מתחיל לעבוד
          <ArrowLeft className="size-4" />
        </button>
        <Link
          to="/dashboard"
          data-inline="true"
          onClick={() => markOnboardingSkipped()}
          className="btn-inline w-full sm:flex-1 rounded-[20px] border border-border font-semibold py-4 flex items-center justify-center text-sm text-muted-foreground min-h-[52px]"
        >
          דלג, אשלים אחר כך
        </Link>
      </div>
    </AppShell>
  );
}

const HINT = "הזן סכום מדויק לתוצאות טובות יותר";

function TextField({ label, value, placeholder, onChange, hint }: {
  label: string; value: string | null; placeholder?: string;
  onChange: (v: string | null) => void; hint?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold">{label}</label>
      <input
        type="text"
        placeholder={placeholder}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value || null)}
        className="min-h-11 h-11 rounded-md border border-border bg-transparent px-3 text-sm text-right focus:outline-none focus:border-primary w-full max-w-full"
      />
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

function NumberField({ label, value, placeholder, onChange, hint, optional }: {
  label: string; value: number | null; placeholder?: string;
  onChange: (v: number | null) => void; hint?: string; optional?: boolean;
}) {
  const [s, setS] = useState(value != null ? String(value) : "");
  useEffect(() => { setS(value != null ? String(value) : ""); }, [value]);
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold">{label} {optional && <span className="text-muted-foreground font-normal">(אופציונלי)</span>}</label>
      <input
        type="number" inputMode="numeric" min={0} dir="ltr"
        placeholder={placeholder ?? "—"}
        value={s}
        onChange={(e) => {
          const v = e.target.value;
          setS(v);
          onChange(v === "" ? null : Math.max(0, parseInt(v, 10) || 0));
        }}
        className="min-h-11 h-11 rounded-md border border-border bg-transparent px-3 text-sm text-right focus:outline-none focus:border-primary w-full max-w-full"
      />
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

function CellularForm({ value, max, onChange }: {
  value: CellularDetails; max: number;
  onChange: (patch: Partial<CellularDetails>) => void;
}) {
  const category = CATEGORIES.find((c) => c.name === CELLULAR)!;
  return (
    <div className="flex flex-col gap-4">
      <Question
        label="חברת הסלולר"
        options={[...CELL_CARRIERS]}
        value={value.carrier}
        onSelect={(v) =>
          onChange({
            carrier: v as (typeof CELL_CARRIERS)[number],
            carrier_other: v === "אחר" ? value.carrier_other : null,
          })
        }
      />
      {value.carrier === "אחר" && (
        <TextField
          label="שם החברה"
          placeholder="הקלד שם חברה"
          value={value.carrier_other}
          onChange={(v) => onChange({ carrier_other: v })}
        />
      )}
      <PriceForm category={category} value={value} max={max} onChange={onChange} />
    </div>
  );
}

function PriceForm({ category, value, onChange }: {
  category: Category; value: PriceDetails; max?: number;
  onChange: (patch: Partial<PriceDetails>) => void;
}) {
  const [exactStr, setExactStr] = useState(value.exact != null ? String(value.exact) : "");
  useEffect(() => { setExactStr(value.exact != null ? String(value.exact) : ""); }, [value.exact]);

  const amountLabel = category.annual
    ? "סכום מדויק שנתי (₪)"
    : "סכום חודשי מדויק (₪)";

  return (
    <div className="flex flex-col gap-3">
      {category.needsCompany && (
        <TextField
          label={category.companyLabel ?? "שם החברה"}
          placeholder={category.companyPlaceholder}
          value={(value.company as string | null | undefined) ?? null}
          onChange={(v) => onChange({ company: v })}
        />
      )}
      {category.name === HEALTH_FUND && value.selectedRange && (
        <p className="text-xs text-muted-foreground">מסלול נבחר: <strong>{value.selectedRange}</strong></p>
      )}
      <div className="flex flex-col gap-1 mt-1">
        <label className="text-xs font-semibold">{amountLabel}</label>
        <input
          type="number" inputMode="numeric" min={0} dir="ltr" placeholder="—"
          value={exactStr}
          onChange={(e) => {
            const s = e.target.value;
            setExactStr(s);
            onChange({ exact: s === "" ? null : Math.max(0, parseInt(s, 10) || 0) });
          }}
          className="min-h-11 h-11 rounded-md border border-border bg-transparent px-3 text-sm text-right focus:outline-none focus:border-primary w-full max-w-full"
        />
        <p className="text-[11px] text-muted-foreground">{HINT}</p>
      </div>
    </div>
  );
}

function GymForm({ value, onChange }: {
  value: GymDetails; onChange: (patch: Partial<GymDetails>) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <TextField
        label="שם המועדון"
        placeholder="לדוגמא: אייקון, הולמס פלייס, ספייס"
        value={value.club_name}
        onChange={(v) => onChange({ club_name: v })}
      />
      <NumberField
        label="דמי מנוי חודשיים (₪)"
        value={value.monthly}
        onChange={(v) => onChange({ monthly: v })}
        hint={HINT}
      />
      <MonthYearField
        label="מתי הצטרפת"
        value={value.join_month}
        onChange={(v) => onChange({ join_month: v })}
      />
    </div>
  );
}

function CarInsuranceForm({ value, onChange }: {
  value: CarInsuranceDetails; onChange: (patch: Partial<CarInsuranceDetails>) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <TextField
        label="חברת הביטוח הנוכחית"
        placeholder="לדוגמא: הראל, מנורה, איילון"
        value={value.insurance_company}
        onChange={(v) => onChange({ insurance_company: v })}
      />
      <NumberField
        label="סכום שנתי כולל"
        placeholder="₪"
        value={value.annual_total}
        onChange={(v) => onChange({ annual_total: v })}
        hint={HINT}
      />
      <TextField
        label="סוג הרכב"
        placeholder="לדוגמא: טויוטה קורולה"
        value={value.vehicle_type}
        onChange={(v) => onChange({ vehicle_type: v })}
      />
      <NumberField
        label="שנת עלייה לכביש"
        placeholder="2019"
        value={value.year_on_road}
        onChange={(v) => onChange({ year_on_road: v })}
      />
      <Question
        label="העדר תביעות?"
        options={[...NO_CLAIMS_OPTIONS]}
        value={value.no_claims}
        onSelect={(v) => onChange({ no_claims: v as CarInsuranceDetails["no_claims"] })}
      />
      <Question
        label="ביטוח חובה בלבד או מקיף?"
        options={[...COVERAGE_OPTIONS]}
        value={value.coverage_type}
        onSelect={(v) => onChange({ coverage_type: v as CarInsuranceDetails["coverage_type"] })}
      />
    </div>
  );
}

function KidsActivitiesForm({ value, onChange }: {
  value: KidsActivitiesDetails; onChange: (patch: Partial<KidsActivitiesDetails>) => void;
}) {
  const updateEntry = (index: number, patch: Partial<KidsActivityEntry>) => {
    onChange({
      activities: value.activities.map((entry, i) =>
        i === index ? { ...entry, ...patch } : entry,
      ),
    });
  };

  const addEntry = () => {
    onChange({ activities: [...value.activities, emptyKidsActivityEntry()] });
  };

  const removeEntry = (index: number) => {
    if (value.activities.length <= 1) return;
    onChange({ activities: value.activities.filter((_, i) => i !== index) });
  };

  return (
    <div className="flex flex-col gap-5">
      {value.activities.map((entry, index) => (
        <div
          key={index}
          className="flex flex-col gap-3 rounded-xl p-3"
          style={{ border: "1px solid var(--border)", background: "rgba(255,255,255,0.02)" }}
        >
          {value.activities.length > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-muted-foreground">חוג {index + 1}</p>
              <button
                type="button"
                onClick={() => removeEntry(index)}
                className="text-[11px] text-muted-foreground hover:text-foreground"
              >
                הסר
              </button>
            </div>
          )}
          <TextField
            label="שם החוג"
            placeholder="לדוגמא: כדורגל, ציור, בלט"
            value={entry.activity_name}
            onChange={(v) => updateEntry(index, { activity_name: v })}
          />
          <TextField
            label="שם המסגרת/מועדון"
            placeholder="לדוגמא: מכבי, הבית הירוק"
            value={entry.organization_name}
            onChange={(v) => updateEntry(index, { organization_name: v })}
          />
          <NumberField
            label="גיל הילד"
            value={entry.child_age}
            onChange={(v) => updateEntry(index, { child_age: v })}
          />
          <NumberField
            label="מחיר חודשי"
            placeholder="₪"
            value={entry.monthly_price}
            onChange={(v) => updateEntry(index, { monthly_price: v })}
            hint={HINT}
          />
          <NumberField
            label="דמי הרשמה ששילמת"
            placeholder="₪"
            value={entry.registration_fee}
            onChange={(v) => updateEntry(index, { registration_fee: v })}
            optional
          />
          <Question
            label="כמה ילדים רשומים?"
            options={[...CHILDREN_COUNT_OPTIONS]}
            value={entry.children_registered}
            onSelect={(v) =>
              updateEntry(index, {
                children_registered: v as KidsActivityEntry["children_registered"],
              })
            }
          />
        </div>
      ))}
      <button
        type="button"
        onClick={addEntry}
        className="w-full rounded-xl border border-dashed py-3 text-sm font-semibold"
        style={{ borderColor: "rgba(0,194,168,0.45)", color: "var(--primary)" }}
      >
        + הוסף חוג נוסף
      </button>
    </div>
  );
}

function MonthYearField({ label, value, onChange }: {
  label: string; value: string | null; onChange: (v: string | null) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold">{label}</label>
      <input
        type="month"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value || null)}
        dir="ltr"
        className="min-h-11 h-11 rounded-md border border-border bg-transparent px-3 text-sm text-right focus:outline-none focus:border-primary w-full max-w-full"
      />
    </div>
  );
}

function ElectricityForm({ value, onChange }: {
  value: ElecDetails; onChange: (patch: Partial<ElecDetails>) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <Question label="עם איזה ספק אתה?" options={ELEC_PROVIDERS} value={value.provider}
        onSelect={(v) => onChange({ provider: v })} />
      <Question label="יש לך מונה חכם?" options={ELEC_METER} value={value.smart_meter}
        onSelect={(v) => onChange({ smart_meter: v })} />
      <Question label="סוג ההנחה הנוכחית?" options={ELEC_DISCOUNT} value={value.discount_type}
        onSelect={(v) => onChange({ discount_type: v })} />
    </div>
  );
}

function Question({ label, options, value, onSelect }: {
  label: string; options: string[]; value: string | null; onSelect: (v: string) => void;
}) {
  return (
    <div>
      <p className="text-xs font-semibold mb-2">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <Pill key={o} on={value === o} onClick={() => onSelect(o)}>{o}</Pill>
        ))}
      </div>
    </div>
  );
}
