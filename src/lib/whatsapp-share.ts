export const SAVINGS_SHARE_MESSAGE =
  "חסכתי ₪[X] עם Fixx 🏆 הסוכן שמנהל מו״מ בשבילי. רוצה לחסוך גם? fixx.ai";

export function buildSavingsShareMessage(annualSavings: number): string {
  const amount = Math.round(annualSavings).toLocaleString("he-IL");
  return SAVINGS_SHARE_MESSAGE.replace("[X]", amount);
}

export function buildWhatsAppShareUrl(annualSavings: number): string {
  return `https://wa.me/?text=${encodeURIComponent(buildSavingsShareMessage(annualSavings))}`;
}

export function openWhatsAppShare(annualSavings: number): void {
  window.open(buildWhatsAppShareUrl(annualSavings), "_blank", "noopener,noreferrer");
}

export function formatSavedAmount(amount: number): string {
  return Math.round(amount).toLocaleString("he-IL");
}

export function buildViralBannerHeadline(amount: number): string {
  return `!חסכת ₪${formatSavedAmount(amount)} 🎉`;
}

export const VIRAL_BANNER_SUBTITLE = "עזור לחברים ובני משפחה לחסוך גם הם";
