-- Fixx proactive agent activity log
CREATE TABLE IF NOT EXISTS public.agent_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type text NOT NULL CHECK (
    activity_type IN (
      'scheduled_scan',
      'better_offer_found',
      'expiry_alert',
      'promotion_alert'
    )
  ),
  user_provider_id uuid REFERENCES public.user_providers(id) ON DELETE SET NULL,
  summary text NOT NULL,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS agent_activity_user_created_idx
  ON public.agent_activity (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS agent_activity_user_type_idx
  ON public.agent_activity (user_id, activity_type, created_at DESC);

ALTER TABLE public.agent_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own agent activity"
  ON public.agent_activity FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own agent activity"
  ON public.agent_activity FOR INSERT
  WITH CHECK (auth.uid() = user_id);

COMMENT ON TABLE public.agent_activity IS 'Fixx proactive agent — log of background scans and alerts';
