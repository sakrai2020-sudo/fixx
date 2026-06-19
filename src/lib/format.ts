/** Israeli currency: ₪1,234 */
export function formatCurrency(amount: number): string {
  return `₪${Math.round(amount).toLocaleString("he-IL")}`;
}

/** Israeli date: DD/MM/YYYY */
export function formatDateIL(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("he-IL", { day: "2-digit", month: "2-digit", year: "numeric" });
}

/** Display name from profile or email — never "חבר" alone in greeting */
export function resolveDisplayName(profileName?: string | null, email?: string | null): string | null {
  const name = profileName?.trim();
  if (name) return name;
  const local = email?.split("@")[0]?.trim();
  if (local && local.length > 1 && !local.includes("test")) return local;
  return null;
}

export function formatGreeting(profileName?: string | null, email?: string | null): string {
  const name = resolveDisplayName(profileName, email);
  return name ? `שלום, ${name} 👋` : "שלום 👋";
}
