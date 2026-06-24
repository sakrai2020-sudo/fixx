export type AccountType = "personal" | "business";

export const BUSINESS_TYPES = [
  "מסעדה",
  "קמעונאות",
  "שירותים",
  "אחר",
] as const;

export type BusinessType = (typeof BUSINESS_TYPES)[number];

export const BUSINESS_EXPENSE_OPTIONS = [
  "אינטרנט",
  "טלפוניה",
  "חשמל",
  "ביטוח",
  "עמלות סליקה",
  "ענן",
  "תוכנה",
  "אחר",
] as const;

export type BusinessExpenseCategory = (typeof BUSINESS_EXPENSE_OPTIONS)[number];

export const BUSINESS_EXPENSE_META: Record<
  BusinessExpenseCategory,
  { emoji: string; hint: string }
> = {
  אינטרנט: { emoji: "🌐", hint: "ספק אינטרנט ורשתות" },
  טלפוניה: { emoji: "📞", hint: "קווים, סלולר ומרכזיות" },
  חשמל: { emoji: "⚡", hint: "חשמל ואנרגיה" },
  ביטוח: { emoji: "🛡️", hint: "ביטוח עסקי ואחריות" },
  "עמלות סליקה": { emoji: "💳", hint: "סליקה ותשלומים" },
  ענן: { emoji: "☁️", hint: "שרתים ואחסון" },
  תוכנה: { emoji: "💻", hint: "מנויים ורישיונות" },
  אחר: { emoji: "📋", hint: "הוצאות קבועות נוספות" },
};

export type BusinessProfile = {
  id?: string;
  user_id: string;
  business_name: string;
  business_type: BusinessType | string;
  employee_count: number | null;
  fixed_expenses: BusinessExpenseCategory[];
  onboarding_complete: boolean;
  created_at?: string;
};
