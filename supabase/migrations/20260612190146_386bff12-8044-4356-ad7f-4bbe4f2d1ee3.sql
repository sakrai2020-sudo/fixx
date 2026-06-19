-- Biometric / passkey credentials for WebAuthn
CREATE TABLE public.user_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  credential_id text NOT NULL UNIQUE,
  public_key text NOT NULL,
  counter bigint NOT NULL DEFAULT 0,
  transports text[] NOT NULL DEFAULT '{}',
  device_label text,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_used_at timestamptz
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_credentials TO authenticated;
GRANT ALL ON public.user_credentials TO service_role;
ALTER TABLE public.user_credentials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own creds" ON public.user_credentials FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Short-lived WebAuthn challenges (server-side state for browser ceremony)
CREATE TABLE public.webauthn_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge text NOT NULL UNIQUE,
  user_id uuid,
  email text,
  kind text NOT NULL CHECK (kind IN ('registration','authentication')),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.webauthn_challenges TO service_role;
ALTER TABLE public.webauthn_challenges ENABLE ROW LEVEL SECURITY;
-- no policies: service role only

-- Biometric preference on profile
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS biometric_enabled boolean NOT NULL DEFAULT false;
