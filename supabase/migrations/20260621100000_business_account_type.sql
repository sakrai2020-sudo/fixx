-- Business account type on user_profiles (also visible via public.profiles view)
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS account_type text NOT NULL DEFAULT 'personal'
  CHECK (account_type IN ('personal', 'business'));

COMMENT ON COLUMN public.user_profiles.account_type IS 'personal | business';

CREATE TABLE IF NOT EXISTS public.business_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name text NOT NULL,
  business_type text NOT NULL,
  employee_count integer,
  fixed_expenses text[] NOT NULL DEFAULT '{}',
  onboarding_complete boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS business_profiles_user_id_idx ON public.business_profiles (user_id);

ALTER TABLE public.business_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own business profile" ON public.business_profiles;
CREATE POLICY "own business profile" ON public.business_profiles
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

COMMENT ON TABLE public.business_profiles IS 'Fixx business client onboarding and expense categories';
