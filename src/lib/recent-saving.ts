const STORAGE_KEY = "nego-recent-saving";

export function setRecentSaving(amount: number): void {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.setItem(STORAGE_KEY, String(Math.round(amount)));
}

export function peekRecentSaving(): number | null {
  if (typeof sessionStorage === "undefined") return null;
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  const amount = Number(raw);
  return amount > 0 ? amount : null;
}

export function clearRecentSaving(): void {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.removeItem(STORAGE_KEY);
}
