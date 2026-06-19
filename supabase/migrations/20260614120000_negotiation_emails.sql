-- Negotiation email engine: store outbound agent emails
CREATE TABLE IF NOT EXISTS public.negotiation_emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  negotiation_id uuid NOT NULL REFERENCES public.negotiations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_email text,
  subject text NOT NULL,
  body text NOT NULL,
  status text NOT NULL DEFAULT 'sent',
  sent_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.negotiation_emails TO authenticated;
GRANT ALL ON public.negotiation_emails TO service_role;
ALTER TABLE public.negotiation_emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own negotiation emails"
  ON public.negotiation_emails
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

ALTER TABLE public.offers ADD COLUMN IF NOT EXISTS provider_name text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS national_id text;
ALTER TABLE public.user_providers ADD COLUMN IF NOT EXISTS account_reference text;
