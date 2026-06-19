export const LOCAL_TEST_USER = {
  email: "test@fixx.ai",
  password: "nego2025",
} as const;

const STORAGE_KEY = "nego_local_session";

export type LocalUser = {
  id: string;
  email: string;
};

export function getLocalUser(): LocalUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as LocalUser;
  } catch {
    return null;
  }
}

export function localLogin(email: string, password: string): boolean {
  const ok =
    email.trim().toLowerCase() === LOCAL_TEST_USER.email &&
    password === LOCAL_TEST_USER.password;

  if (!ok) return false;

  const user: LocalUser = {
    id: "00000000-0000-4000-8000-000000000001",
    email: LOCAL_TEST_USER.email,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  window.dispatchEvent(new Event("nego-local-auth"));
  return true;
}

export function isLocalTestUser(user?: { email?: string | null } | null): boolean {
  return user?.email?.toLowerCase() === LOCAL_TEST_USER.email;
}

export function localLogout(): void {
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event("nego-local-auth"));
}
