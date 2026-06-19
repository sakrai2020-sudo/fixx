import { getLocalUser } from "@/lib/local-auth";
import {
  getLocalProviderStore,
  saveLocalProviders,
  type LocalProvider,
} from "@/lib/local-providers";
import {
  buildNegotiationEmail,
  buildNegotiationEmailSubject,
  defaultCompetitorForCategory,
  resolveDisplayName as resolveEmailDisplayName,
} from "@/lib/negotiation-email";
import { getSwitchGuide, usesSwitchGuide, type SwitchGuide } from "@/lib/switch-guide";

const STORAGE_KEY = "nego_local_negotiations";

export type LocalNegotiation = {
  id: string;
  user_id: string;
  user_provider_id: string;
  status: string;
  deadline: string;
  started_at: string;
  recommendation_type: string | null;
  retention_call_status?: string | null;
  retention_offer_amount?: number | null;
  script_used?: boolean;
  action_type?: "email" | "switch_guide";
};

export type LocalSwitchGuide = SwitchGuide & {
  negotiation_id: string;
  sent_at: string;
};

export type LocalOffer = {
  id: string;
  negotiation_id: string;
  offer_type: "cheapest" | "value" | "premium";
  provider_name: string;
  plan_name: string;
  monthly_price: number;
  features: string[];
  registration_fee?: number | null;
};

export type LocalNegotiationEmail = {
  negotiation_id: string;
  subject: string;
  body: string;
  sent_at: string;
};

type LocalNegotiationStore = {
  negotiations: LocalNegotiation[];
  offers: LocalOffer[];
  emails: LocalNegotiationEmail[];
  switchGuides: LocalSwitchGuide[];
  totalSavings: number;
};

function newId(prefix: string): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `${prefix}${crypto.randomUUID()}`;
  }
  return `${prefix}${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function emptyStore(): LocalNegotiationStore {
  return { negotiations: [], offers: [], emails: [], switchGuides: [], totalSavings: 0 };
}

function loadStore(): LocalNegotiationStore {
  if (typeof window === "undefined") return emptyStore();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyStore();
    const parsed = JSON.parse(raw) as Partial<LocalNegotiationStore>;
    return { ...emptyStore(), ...parsed, switchGuides: parsed.switchGuides ?? [] };
  } catch {
    return emptyStore();
  }
}

function saveStore(store: LocalNegotiationStore): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  window.dispatchEvent(new Event("nego-local-negotiations"));
}

export function isLocalNegotiationId(id: string): boolean {
  return id.startsWith("local-neg-");
}

export function getLocalProviderById(id: string): LocalProvider | null {
  return getLocalProviderStore()?.providers.find((p) => p.id === id) ?? null;
}

export function updateLocalProvider(id: string, patch: Partial<LocalProvider>): void {
  const store = getLocalProviderStore();
  if (!store) return;
  const providers = store.providers.map((p) => (p.id === id ? { ...p, ...patch } : p));
  saveLocalProviders(providers, store.draft);
}

export function getLocalNegotiation(id: string): LocalNegotiation | null {
  return loadStore().negotiations.find((n) => n.id === id) ?? null;
}

export function getLocalOffers(negotiationId: string): LocalOffer[] {
  return loadStore()
    .offers.filter((o) => o.negotiation_id === negotiationId)
    .sort((a, b) => a.monthly_price - b.monthly_price);
}

export function getLocalSwitchGuide(negotiationId: string): LocalSwitchGuide | null {
  return loadStore().switchGuides.find((g) => g.negotiation_id === negotiationId) ?? null;
}

export function getLocalNegotiationEmail(negotiationId: string): LocalNegotiationEmail | null {
  const emails = loadStore().emails.filter((e) => e.negotiation_id === negotiationId);
  return emails.length ? emails[emails.length - 1] : null;
}

export function getLocalTotalSavings(): number {
  return loadStore().totalSavings;
}

export function updateLocalNegotiation(id: string, patch: Partial<LocalNegotiation>): void {
  const store = loadStore();
  store.negotiations = store.negotiations.map((n) => (n.id === id ? { ...n, ...patch } : n));
  saveStore(store);
}

export function addLocalSavings(amount: number): void {
  const store = loadStore();
  store.totalSavings = Math.max(0, store.totalSavings + amount);
  saveStore(store);
}

export function getLocalActiveNegotiations(): LocalNegotiation[] {
  return loadStore()
    .negotiations.filter((n) => n.status !== "completed")
    .sort((a, b) => b.started_at.localeCompare(a.started_at));
}

export function createLocalNegotiation(params: {
  userId: string;
  provider: {
    id: string;
    provider_name: string;
    monthly_price?: number | null;
    category?: string | null;
    plan_name?: string | null;
  };
  goal: string;
  note?: string;
}): LocalNegotiation {
  const store = loadStore();
  const now = new Date();
  const deadline = new Date(now.getTime() + 1000 * 60 * 60 * 48).toISOString();
  const negId = newId("local-neg-");
  const base = Number(params.provider.monthly_price || 100);
  const competitor = defaultCompetitorForCategory(params.provider.category);
  const cheapestPrice = Math.round(base * 0.7);
  const isSwitchGuide = usesSwitchGuide(params.provider.category);

  const negotiation: LocalNegotiation = {
    id: negId,
    user_id: params.userId,
    user_provider_id: params.provider.id,
    status: "active",
    deadline,
    started_at: now.toISOString(),
    recommendation_type: params.goal,
    action_type: isSwitchGuide ? "switch_guide" : "email",
  };

  const offers: LocalOffer[] = [
    {
      id: newId("local-offer-"),
      negotiation_id: negId,
      offer_type: "cheapest",
      provider_name: competitor,
      plan_name: "חבילה חסכונית",
      monthly_price: cheapestPrice,
      features: ["שיחות וטקסטים ללא הגבלה", "2GB גלישה"],
    },
    {
      id: newId("local-offer-"),
      negotiation_id: negId,
      offer_type: "value",
      provider_name: competitor,
      plan_name: "החבילה המומלצת",
      monthly_price: Math.round(base * 0.78),
      features: ["שיחות ללא הגבלה", "30GB גלישה", "שירות לקוחות VIP"],
    },
    {
      id: newId("local-offer-"),
      negotiation_id: negId,
      offer_type: "premium",
      provider_name: params.provider.provider_name,
      plan_name: "חבילה משודרגת",
      monthly_price: Math.round(base * 0.92),
      features: ["ללא הגבלה", "100GB+", "בונוסים נוספים", "שירות VIP 24/7"],
    },
  ];

  store.negotiations.push(negotiation);
  store.offers.push(...offers);

  if (isSwitchGuide) {
    store.switchGuides.push({
      negotiation_id: negId,
      sent_at: now.toISOString(),
      ...getSwitchGuide(
        params.provider.category || "",
        params.provider.provider_name,
        competitor,
      ),
    });
  } else {
    const localUser = getLocalUser();
    const subject = buildNegotiationEmailSubject(params.provider.provider_name);
    const body = buildNegotiationEmail({
      fullName: resolveEmailDisplayName(null, localUser?.email?.split("@")[0]),
      providerName: params.provider.provider_name,
      competitor,
      competitorPrice: cheapestPrice,
      planName: params.provider.plan_name || "חבילה נוכחית",
      userName: resolveEmailDisplayName(null, localUser?.email?.split("@")[0]),
    });
    store.emails.push({
      negotiation_id: negId,
      subject,
      body,
      sent_at: now.toISOString(),
    });
  }

  saveStore(store);

  if (params.note?.trim()) {
    try {
      sessionStorage.setItem(`neg-note-${negId}`, params.note.trim());
    } catch {}
  }

  return negotiation;
}
