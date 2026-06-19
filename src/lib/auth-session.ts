import { getLocalUser } from "@/lib/local-auth";
import { supabase } from "@/integrations/supabase/client";

export type ResolvedUser = {
  id: string;
  email?: string | null;
  source: "local" | "supabase";
};

export async function resolveAuthUser(): Promise<ResolvedUser | null> {
  return getAuthUserOrLocal();
}

/** LocalStorage first, then Supabase — never blocks the agent flow. */
export async function getAuthUserOrLocal(): Promise<ResolvedUser> {
  const local = getLocalUser();
  if (local) {
    return { id: local.id, email: local.email, source: "local" };
  }

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      return { id: user.id, email: user.email, source: "supabase" };
    }
  } catch {
    /* fall through to local fallback */
  }

  return {
    id: "00000000-0000-4000-8000-000000000001",
    email: "test@fixx.ai",
    source: "local",
  };
}

export async function ensureAuthenticatedUser() {
  const local = getLocalUser();
  if (local) return local;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  return { id: user.id, email: user.email ?? "" };
}

export function isAuthCallbackPath(): boolean {
  return false;
}

export function hasOAuthCallbackParams(): boolean {
  return false;
}

export async function waitForAuthSession() {
  return null;
}

export async function completeOAuthCallback() {
  return null;
}

export function clearOAuthCallbackUrl(): void {}
