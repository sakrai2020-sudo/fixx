import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const rpName = "Fixx";

function rpIDFromOrigin(origin: string): string {
  try {
    return new URL(origin).hostname;
  } catch {
    return "localhost";
  }
}

// ---------- REGISTER (authenticated) ----------

export const startBiometricRegistration = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ origin: z.string().url() }).parse(d))
  .handler(async ({ data, context }) => {
    const { generateRegistrationOptions } = await import("@simplewebauthn/server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const rpID = rpIDFromOrigin(data.origin);

    // exclude already-registered credentials
    const { data: existing } = await context.supabase
      .from("user_credentials")
      .select("credential_id, transports")
      .eq("user_id", context.userId);

    const options = await generateRegistrationOptions({
      rpName,
      rpID,
      userName: context.claims?.email || context.userId,
      userID: new TextEncoder().encode(context.userId) as Uint8Array<ArrayBuffer>,
      attestationType: "none",
      authenticatorSelection: {
        residentKey: "preferred",
        userVerification: "preferred",
        authenticatorAttachment: "platform",
      },
      excludeCredentials: (existing || []).map((c) => ({
        id: c.credential_id,
        transports: (c.transports as any) || undefined,
      })),
    });

    await supabaseAdmin.from("webauthn_challenges").insert({
      challenge: options.challenge,
      user_id: context.userId,
      kind: "registration",
    });

    return options;
  });

export const finishBiometricRegistration = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ origin: z.string().url(), response: z.any() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { verifyRegistrationResponse } = await import("@simplewebauthn/server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const rpID = rpIDFromOrigin(data.origin);

    const challenge = data.response?.response?.clientDataJSON
      ? JSON.parse(
          new TextDecoder().decode(
            Uint8Array.from(atob(toB64(data.response.response.clientDataJSON)), (c) =>
              c.charCodeAt(0),
            ),
          ),
        ).challenge
      : null;
    if (!challenge) throw new Error("Missing challenge");

    const { data: row } = await supabaseAdmin
      .from("webauthn_challenges")
      .select("*")
      .eq("challenge", challenge)
      .eq("kind", "registration")
      .maybeSingle();
    if (!row || row.user_id !== context.userId) throw new Error("Challenge invalid");

    const verification = await verifyRegistrationResponse({
      response: data.response,
      expectedChallenge: challenge,
      expectedOrigin: data.origin,
      expectedRPID: rpID,
    });

    if (!verification.verified || !verification.registrationInfo) {
      throw new Error("Verification failed");
    }
    const { credential } = verification.registrationInfo;

    await supabaseAdmin.from("user_credentials").insert({
      user_id: context.userId,
      credential_id: credential.id,
      public_key: bufToB64Url(credential.publicKey),
      counter: credential.counter,
      transports: (data.response?.response?.transports as string[]) || [],
      device_label: "Biometric device",
    });

    await context.supabase
      .from("user_profiles")
      .update({ biometric_enabled: true })
      .eq("id", context.userId);

    await supabaseAdmin.from("webauthn_challenges").delete().eq("challenge", challenge);

    return { ok: true };
  });

// ---------- LOGIN (anonymous) ----------

export const startBiometricLogin = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z.object({ origin: z.string().url(), email: z.string().email() }).parse(d),
  )
  .handler(async ({ data }) => {
    const { generateAuthenticationOptions } = await import("@simplewebauthn/server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const rpID = rpIDFromOrigin(data.origin);

    // resolve user by email
    const { data: list } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
    const user = list?.users.find((u) => u.email?.toLowerCase() === data.email.toLowerCase());
    if (!user) throw new Error("לא נמצא משתמש רשום");

    const { data: creds } = await supabaseAdmin
      .from("user_credentials")
      .select("credential_id, transports")
      .eq("user_id", user.id);

    if (!creds || creds.length === 0) {
      throw new Error("לא הוגדרה כניסה ביומטרית למשתמש זה");
    }

    const options = await generateAuthenticationOptions({
      rpID,
      userVerification: "preferred",
      allowCredentials: creds.map((c) => ({
        id: c.credential_id,
        transports: (c.transports as any) || undefined,
      })),
    });

    await supabaseAdmin.from("webauthn_challenges").insert({
      challenge: options.challenge,
      user_id: user.id,
      email: data.email,
      kind: "authentication",
    });

    return options;
  });

export const finishBiometricLogin = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z.object({ origin: z.string().url(), response: z.any() }).parse(d),
  )
  .handler(async ({ data }) => {
    const { verifyAuthenticationResponse } = await import("@simplewebauthn/server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const rpID = rpIDFromOrigin(data.origin);

    const clientData = JSON.parse(
      new TextDecoder().decode(
        Uint8Array.from(atob(toB64(data.response.response.clientDataJSON)), (c) =>
          c.charCodeAt(0),
        ),
      ),
    );
    const challenge = clientData.challenge;

    const { data: row } = await supabaseAdmin
      .from("webauthn_challenges")
      .select("*")
      .eq("challenge", challenge)
      .eq("kind", "authentication")
      .maybeSingle();
    if (!row) throw new Error("Challenge invalid");

    const { data: cred } = await supabaseAdmin
      .from("user_credentials")
      .select("*")
      .eq("credential_id", data.response.id)
      .maybeSingle();
    if (!cred || cred.user_id !== row.user_id) throw new Error("Credential not found");

    const verification = await verifyAuthenticationResponse({
      response: data.response,
      expectedChallenge: challenge,
      expectedOrigin: data.origin,
      expectedRPID: rpID,
      credential: {
        id: cred.credential_id,
        publicKey: b64UrlToBuf(cred.public_key) as Uint8Array<ArrayBuffer>,
        counter: Number(cred.counter),
        transports: cred.transports as any,
      },
    });

    if (!verification.verified) throw new Error("Verification failed");

    await supabaseAdmin
      .from("user_credentials")
      .update({
        counter: verification.authenticationInfo.newCounter,
        last_used_at: new Date().toISOString(),
      })
      .eq("id", cred.id);

    await supabaseAdmin.from("webauthn_challenges").delete().eq("challenge", challenge);

    // Issue a one-time magic link the client can verify into a real session
    if (!row.email) throw new Error("Missing email");
    const { data: link, error: linkErr } = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email: row.email,
    });
    if (linkErr || !link?.properties?.hashed_token) {
      throw new Error(linkErr?.message || "Could not issue session");
    }

    return {
      email: row.email,
      token_hash: link.properties.hashed_token,
    };
  });

// ---------- helpers ----------

function bufToB64Url(buf: Uint8Array): string {
  let s = "";
  buf.forEach((b) => (s += String.fromCharCode(b)));
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function b64UrlToBuf(s: string): Uint8Array {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4);
  const bin = atob(b64);
  const buf = new ArrayBuffer(bin.length);
  const out = new Uint8Array(buf);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
function toB64(s: string): string {
  return s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4);
}
