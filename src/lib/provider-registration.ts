export type ProviderConversion = {
  negotiationId: string;
  fromProvider: string;
  toProvider: string;
  planName: string;
  completedAt: string;
};

const CONVERSIONS_KEY = "nego_provider_conversions";

const REGISTRATION_URLS: Record<string, string> = {
  "HOT Mobile": "https://www.hotmobile.co.il/",
  "גולן טלקום": "https://www.golantele.co.il/",
  "Golan Telecom": "https://www.golantele.co.il/",
  "סלקום": "https://www.cellcom.co.il/",
  "פרטנר": "https://www.partner.co.il/",
  "012": "https://www.012mobile.co.il/",
  "HOT": "https://www.hot.net.il/",
  "Yes": "https://www.yes.co.il/",
  "בזק": "https://www.bezeq.co.il/",
};

export function requiresProviderSwitch(currentProvider: string, offerProvider: string): boolean {
  return currentProvider.trim() !== offerProvider.trim();
}

export function getProviderRegistrationUrl(providerName: string): string {
  const direct = REGISTRATION_URLS[providerName.trim()];
  if (direct) return direct;
  return `https://www.google.com/search?q=${encodeURIComponent(`${providerName} הרשמה`)}`;
}

export function getRegistrationSteps(fromProvider: string, toProvider: string, planName: string): [string, string, string] {
  return [
    `לחץ על הכפתור למטה ועבור לאתר ${toProvider} להרשמה`,
    `בחר את החבילה "${planName}" והשלם את טופס ההצטרפות`,
    `לאחר סיום — חזור ל-Fixx וסמן "סיימתי את ההרשמה" (מ-${fromProvider})`,
  ];
}

function loadConversions(): ProviderConversion[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CONVERSIONS_KEY);
    return raw ? (JSON.parse(raw) as ProviderConversion[]) : [];
  } catch {
    return [];
  }
}

export function recordProviderConversion(entry: Omit<ProviderConversion, "completedAt">): void {
  if (typeof window === "undefined") return;
  const conversions = loadConversions();
  conversions.push({ ...entry, completedAt: new Date().toISOString() });
  localStorage.setItem(CONVERSIONS_KEY, JSON.stringify(conversions));
  window.dispatchEvent(new Event("nego-provider-conversion"));
}

export function getProviderConversions(): ProviderConversion[] {
  return loadConversions();
}
