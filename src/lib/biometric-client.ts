import { startRegistration, startAuthentication, browserSupportsWebAuthn } from "@simplewebauthn/browser";
import { supabase } from "@/integrations/supabase/client";
import {
  startBiometricRegistration,
  finishBiometricRegistration,
  startBiometricLogin,
  finishBiometricLogin,
} from "@/lib/biometric.functions";

const LAST_EMAIL_KEY = "nego.lastEmail";
const BIO_HINT_KEY = "nego.bioEnabled";

export const biometricSupported = () => {
  if (typeof window === "undefined") return false;
  if (!browserSupportsWebAuthn()) return false;
  // In a cross-origin iframe (e.g. Lovable preview) WebAuthn is blocked
  // by Permissions Policy and surfaces a noisy "origin document" error.
  try {
    if (window.top !== window.self) {
      const fp: any = (document as any).featurePolicy || (document as any).permissionsPolicy;
      if (fp?.allowsFeature && !fp.allowsFeature("publickey-credentials-get")) return false;
      // If we can't introspect policy, assume disabled inside an iframe.
      if (!fp?.allowsFeature) return false;
    }
  } catch {
    return false;
  }
  return true;
};

export function rememberBiometric(email: string) {
  try {
    localStorage.setItem(LAST_EMAIL_KEY, email);
    localStorage.setItem(BIO_HINT_KEY, "1");
  } catch {}
}

export function getRememberedEmail(): string | null {
  try {
    return localStorage.getItem(LAST_EMAIL_KEY);
  } catch {
    return null;
  }
}

export function hasBiometricHint(): boolean {
  try {
    return localStorage.getItem(BIO_HINT_KEY) === "1";
  } catch {
    return false;
  }
}

export function clearBiometricHint() {
  try {
    localStorage.removeItem(BIO_HINT_KEY);
  } catch {}
}

export async function registerBiometric() {
  const origin = window.location.origin;
  const options = await startBiometricRegistration({ data: { origin } });
  const response = await startRegistration({ optionsJSON: options as any });
  await finishBiometricRegistration({ data: { origin, response } });
  const { data: { user } } = await supabase.auth.getUser();
  if (user?.email) rememberBiometric(user.email);
}

export async function loginWithBiometric(email: string) {
  const origin = window.location.origin;
  const options = await startBiometricLogin({ data: { origin, email } });
  const response = await startAuthentication({ optionsJSON: options as any });
  const { email: confirmed, token_hash } = await finishBiometricLogin({
    data: { origin, response },
  });
  const { error } = await supabase.auth.verifyOtp({
    type: "magiclink",
    token_hash,
    email: confirmed,
  });
  if (error) throw error;
  rememberBiometric(confirmed);
}
