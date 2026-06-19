import { CATEGORIES } from "@/lib/categories";

const STORAGE_KEY = "nego_local_providers";

const ELECTRICITY = "חברת חשמל";
const CELLULAR = "סלולר";
const GYM = "מועדון כושר";
const CAR_INSURANCE = "ביטוח רכב";
const KIDS_ACTIVITIES = "חוגי ילדים";

export type LocalProvider = {
  id: string;
  provider_name: string;
  category: string;
  logo_emoji: string;
  plan_name: string;
  monthly_price: number;
  savings_score: number;
  provider_id: string | null;
  created_at: string;
};

export type LocalOnboardingDraft = {
  selected: string[];
  details: Record<string, unknown>;
  regFees: Record<string, number | null>;
  providerNames?: Record<string, string | null>;
};

export type LocalProviderStore = {
  onboardingComplete: boolean;
  questionnaireSkipped?: boolean;
  providers: LocalProvider[];
  draft: LocalOnboardingDraft;
};

function newId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `local-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

type KidsActivityEntry = {
  activity_name: string | null;
  organization_name: string | null;
  child_age: number | null;
  monthly_price: number | null;
  registration_fee: number | null;
  children_registered: string | null;
};

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

export function buildProvidersFromOnboarding(
  selected: Iterable<string>,
  details: Record<string, unknown>,
): LocalProvider[] {
  const now = new Date().toISOString();

  return Array.from(selected).flatMap((cat) => {
    const meta = CATEGORIES.find((c) => c.name === cat);
    const d = details[cat] as Record<string, unknown> | undefined;
    let monthly: number;
    let providerName = cat;
    const planName = "חבילה נוכחית";

    if (cat === KIDS_ACTIVITIES) {
      const activities = ((d as { activities?: KidsActivityEntry[] })?.activities ?? []).filter(
        isKidsActivityEntryComplete,
      );
      return activities.map((a) => ({
        id: newId(),
        provider_id: null,
        provider_name: a.organization_name || a.activity_name || cat,
        category: cat,
        logo_emoji: meta?.emoji ?? "👶",
        plan_name: a.activity_name || "חוג",
        monthly_price: a.monthly_price ?? 200,
        savings_score: 5 + Math.floor(Math.random() * 5),
        created_at: now,
      }));
    }

    if (cat === ELECTRICITY) {
      monthly = 400;
      const provider = (d as { provider?: string | null })?.provider;
      if (provider) providerName = provider;
    } else if (cat === CELLULAR) {
      const c = d as {
        carrier?: string | null;
        carrier_other?: string | null;
        exact?: number | null;
        min?: number;
        max?: number;
      };
      if (c.carrier === "אחר") {
        providerName = c.carrier_other?.trim() || cat;
      } else if (c.carrier) {
        providerName = c.carrier;
      }
      const raw = c.exact ?? Math.round(((c.min ?? 0) + (c.max ?? 0)) / 2);
      monthly = raw;
    } else if (cat === GYM) {
      const g = d as { monthly?: number | null; club_name?: string | null };
      monthly = g?.monthly ?? 200;
      if (g?.club_name) providerName = g.club_name;
    } else if (cat === CAR_INSURANCE) {
      const c = d as { annual_total?: number | null; insurance_company?: string | null };
      monthly = c?.annual_total ? Math.round(c.annual_total / 12) : 400;
      if (c?.insurance_company) providerName = c.insurance_company;
    } else {
      const p = d as {
        exact?: number | null;
        min?: number;
        max?: number;
        company?: string | null;
        selectedRange?: string | null;
      };
      const raw = p?.exact ?? Math.round(((p?.min ?? 0) + (p?.max ?? 0)) / 2);
      monthly = meta?.annual ? Math.round(raw / 12) : raw;
      if (p?.company) providerName = p.company;
      if (cat === "קופת חולים" && p?.selectedRange) {
        providerName = "קופת חולים";
        return [
          {
            id: newId(),
            provider_id: null,
            provider_name: providerName,
            category: cat,
            logo_emoji: meta?.emoji ?? "🏥",
            plan_name: p.selectedRange,
            monthly_price: monthly!,
            savings_score: 5 + Math.floor(Math.random() * 5),
            created_at: now,
          },
        ];
      }
    }

    return [
      {
        id: newId(),
        provider_id: null,
        provider_name: providerName,
        category: cat,
        logo_emoji: meta?.emoji ?? "💼",
        plan_name: planName,
        monthly_price: monthly!,
        savings_score: 5 + Math.floor(Math.random() * 5),
        created_at: now,
      },
    ];
  });
}

export function saveLocalProviders(
  providers: LocalProvider[],
  draft: LocalOnboardingDraft,
  onboardingComplete = true,
): void {
  if (typeof window === "undefined") return;
  const store: LocalProviderStore = {
    onboardingComplete,
    providers,
    draft,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  window.dispatchEvent(new Event("nego-local-providers"));
}

export function markOnboardingSkipped(): void {
  if (typeof window === "undefined") return;
  const store: LocalProviderStore = {
    onboardingComplete: false,
    questionnaireSkipped: true,
    providers: [],
    draft: { selected: [], details: {}, regFees: {} },
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  sessionStorage.setItem("nego-questionnaire-skipped", "1");
  window.dispatchEvent(new Event("nego-local-providers"));
}

export function appendQuickAddCharge(category: string, range: string): LocalProvider | null {
  if (typeof window === "undefined") return null;
  const meta = CATEGORIES.find((c) => c.name === category);
  if (!meta) return null;

  const existing = getLocalProviderStore();
  const draft = existing?.draft ?? { selected: [], details: {}, regFees: {} };
  const selected = new Set(draft.selected);
  selected.add(category);

  const nums = (range.match(/[\d,]+/g) || []).map((s) => Number(s.replace(/,/g, "")));
  let min = nums[0] ?? 50;
  let max = nums.length > 1 ? nums[1] : min * 1.4;
  if (range.includes("עד") && nums.length === 1) max = nums[0];
  if (range.startsWith("מעל") && nums.length === 1) {
    min = nums[0];
    max = Math.round(nums[0] * 1.5);
  }

  const details = {
    ...draft.details,
    [category]: { min, max, exact: null, selectedRange: range },
  };

  const newProviders = buildProvidersFromOnboarding([category], details);
  if (newProviders.length === 0) return null;

  const providers = [...(existing?.providers ?? []), ...newProviders];
  saveLocalProviders(
    providers,
    {
      ...draft,
      selected: Array.from(selected),
      details,
      regFees: draft.regFees ?? {},
    },
    true,
  );

  return newProviders[0] ?? null;
}

export function getLocalProviderStore(): LocalProviderStore | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as LocalProviderStore;
  } catch {
    return null;
  }
}

export function getLocalProviders(): LocalProvider[] {
  return getLocalProviderStore()?.providers ?? [];
}

export function isLocalOnboardingComplete(): boolean {
  return getLocalProviderStore()?.onboardingComplete === true;
}

export function clearLocalProviders(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event("nego-local-providers"));
}
