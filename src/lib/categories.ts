export type Category = {
  name: string;
  emoji: string;
  ranges: string[];
  full?: boolean;
  annual?: boolean;
  needsCompany?: boolean;
  companyLabel?: string;
  companyPlaceholder?: string;
};

export const CATEGORIES: Category[] = [
  { name: "סלולר", emoji: "📱", ranges: ["עד ₪50","₪50-100","₪100-150","מעל ₪150"] },
  { name: "טלוויזיה ואינטרנט", emoji: "📺", ranges: ["עד ₪100","₪100-200","₪200-300","מעל ₪300"] },
  { name: "חברת חשמל", emoji: "⚡", ranges: ["עד ₪200","₪200-400","₪400-600","מעל ₪600"] },
  { name: "קופת חולים", emoji: "🏥", ranges: ["זהב","כסף","ארד","בסיסי"] },
  {
    name: "ביטוח רכב", emoji: "🚗",
    ranges: ["עד ₪3,000","₪3,000-5,000","₪5,000-8,000","₪8,000-12,000","מעל ₪12,000"],
    annual: true,
  },
  {
    name: "ביטוח חיים/בריאות", emoji: "❤️",
    ranges: ["עד ₪200","₪200-500","₪500-1,000","₪1,000-2,000","מעל ₪2,000"],
    needsCompany: true, companyLabel: "חברת הביטוח",
    companyPlaceholder: "לדוגמא: הראל, כלל, מגדל",
  },
  {
    name: "ביטוח דירה/תכולה", emoji: "🏠",
    ranges: ["עד ₪100","₪100-200","₪200-400","מעל ₪400"],
    needsCompany: true, companyLabel: "חברת הביטוח",
    companyPlaceholder: "לדוגמא: הפניקס, AIG, מנורה",
  },
  { name: "מועדון כושר", emoji: "💪", ranges: ["עד ₪100","₪100-200","₪200-300","מעל ₪300"] },
  { name: "סטרימינג", emoji: "🎬", ranges: ["עד ₪50","₪50-100","₪100-150","מעל ₪150"] },
  { name: "חוגי ילדים", emoji: "👶", ranges: ["עד ₪200","₪200-400","₪400-700","מעל ₪700"] },
  {
    name: "אבטחה ומיגון", emoji: "🔒",
    ranges: ["עד ₪80","₪80-150","₪150-250","מעל ₪250"],
    needsCompany: true, companyLabel: "שם החברה",
    companyPlaceholder: "לדוגמא: שחל, ביטחונית",
  },
  { name: "ניקיון וגינון", emoji: "🧹", ranges: ["עד ₪150","₪150-300","₪300-500","מעל ₪500"] },
  { name: "ועד בניין", emoji: "🏢", ranges: ["עד ₪150","₪150-300","₪300-500","מעל ₪500"] },
  {
    name: "ברי מים", emoji: "💧",
    ranges: ["עד ₪60","₪60-100","₪100-150","מעל ₪150"],
    needsCompany: true, companyLabel: "שם החברה",
    companyPlaceholder: "לדוגמא: תמי4, סודהסטרים, מי עדן",
  },
  { name: "חיובים קבועים אחרים", emoji: "➕", ranges: ["עד ₪100","₪100-300","₪300-500","מעל ₪500"], full: true },
];

/** Canonical price-range labels per category (demo PRICE_RANGES parity). */
export const PRICE_RANGES: Record<string, string[]> = Object.fromEntries(
  CATEGORIES.map((c) => [c.name, c.ranges]),
);

export function getRangesForCategory(name: string): string[] {
  return PRICE_RANGES[name] ?? [];
}

export function categoryHasNumericRanges(name: string): boolean {
  return getRangesForCategory(name).some((r) => /\d/.test(r));
}

export function parsePriceRange(range: string): { min: number; max: number } {
  const nums = (range.match(/[\d,]+/g) || []).map((s) => Number(s.replace(/,/g, "")));
  if (nums.length === 0) return { min: 50, max: 100 };
  if (range.includes("עד") && nums.length >= 1) return { min: 0, max: nums[0] };
  if (range.startsWith("מעל") && nums.length >= 1) {
    return { min: nums[0], max: Math.round(nums[0] * 1.5) };
  }
  if (nums.length >= 2) return { min: nums[0], max: nums[1] };
  return { min: nums[0], max: Math.round(nums[0] * 1.4) };
}

export function categoryMaxFromRanges(name: string): number {
  const ranges = getRangesForCategory(name);
  const nums = ranges.flatMap((r) => (r.match(/[\d,]+/g) || []).map((s) => Number(s.replace(/,/g, ""))));
  if (nums.length === 0) return 500;
  const peak = Math.max(...nums);
  const step = peak >= 5000 ? 500 : 50;
  return Math.max(100, Math.ceil((peak * 1.5) / step) * step);
}

// rough midpoint estimate from selected range string, for seeding monthly_price
export function estimatePrice(range: string | null | undefined): number {
  if (!range) return 100;
  const nums = (range.match(/[\d,]+/g) || []).map((s) => Number(s.replace(/,/g, "")));
  if (nums.length === 0) return 100;
  if (nums.length === 1) return range.includes("עד") ? nums[0] * 0.75 : nums[0] * 1.2;
  return (nums[0] + nums[1]) / 2;
}
