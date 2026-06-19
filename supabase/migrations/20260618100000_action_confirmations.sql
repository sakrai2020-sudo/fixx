-- Post-action confirmation protocol
CREATE TABLE IF NOT EXISTS public.action_confirmations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  negotiation_id uuid REFERENCES public.negotiations(id) ON DELETE SET NULL,
  action_type text NOT NULL CHECK (action_type IN ('registration', 'switch', 'disconnect')),
  provider_name text NOT NULL,
  plan_name text NOT NULL,
  monthly_price numeric NOT NULL DEFAULT 0,
  contact_email text,
  contact_phone text,
  rollback jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'expired')),
  expires_at timestamptz NOT NULL,
  protocol_sent_at timestamptz,
  reminder_sent_at timestamptz,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.action_confirmation_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  confirmation_id uuid NOT NULL REFERENCES public.action_confirmations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  channel text NOT NULL CHECK (channel IN ('sms', 'email')),
  subject text,
  body text NOT NULL,
  status text NOT NULL DEFAULT 'sent',
  sent_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS action_confirmations_user_status_idx
  ON public.action_confirmations (user_id, status);

CREATE INDEX IF NOT EXISTS action_confirmations_expires_idx
  ON public.action_confirmations (status, expires_at)
  WHERE status = 'pending';

GRANT SELECT, INSERT, UPDATE ON public.action_confirmations TO authenticated;
GRANT SELECT, INSERT ON public.action_confirmation_messages TO authenticated;
GRANT ALL ON public.action_confirmations TO service_role;
GRANT ALL ON public.action_confirmation_messages TO service_role;

ALTER TABLE public.action_confirmations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.action_confirmation_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own action confirmations" ON public.action_confirmations;
CREATE POLICY "own action confirmations"
  ON public.action_confirmations FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "own action confirmation messages" ON public.action_confirmation_messages;
CREATE POLICY "own action confirmation messages"
  ON public.action_confirmation_messages FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
