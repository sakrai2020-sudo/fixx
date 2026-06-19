-- Align schema with app table names: users, user_profiles, user_categories, providers,
-- user_providers, negotiations, offers, savings

-- Rename legacy profiles table
DO $$
BEGIN
  IF to_regclass('public.profiles') IS NOT NULL AND to_regclass('public.user_profiles') IS NULL THEN
    ALTER TABLE public.profiles RENAME TO user_profiles;
  END IF;
END $$;

-- Public users mirror (auth.users lives in auth schema)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.users TO authenticated;
GRANT ALL ON public.users TO service_role;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own user row" ON public.users;
CREATE POLICY "own user row" ON public.users FOR ALL USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Ensure user_profiles policies exist after rename
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own profile" ON public.user_profiles;
CREATE POLICY "own profile" ON public.user_profiles FOR ALL USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Drop sensitive columns — store provider names and amounts only
ALTER TABLE public.user_profiles DROP COLUMN IF EXISTS national_id;
ALTER TABLE public.user_providers DROP COLUMN IF EXISTS account_reference;

-- Sync trigger on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.users (id, email, phone)
  VALUES (NEW.id, NEW.email, NEW.phone)
  ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, phone = EXCLUDED.phone;

  INSERT INTO public.user_profiles (id, name, phone)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)), NEW.phone)
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Backfill users from auth
INSERT INTO public.users (id, email, phone)
SELECT id, email, phone FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- Leaderboard uses user_profiles
CREATE OR REPLACE FUNCTION public.get_monthly_savings_leaderboard()
RETURNS TABLE (
  rank bigint,
  first_name text,
  city text,
  total_saved numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    ROW_NUMBER() OVER (ORDER BY SUM(s.amount) DESC) AS rank,
    COALESCE(NULLIF(split_part(TRIM(p.name), ' ', 1), ''), 'משתמש') AS first_name,
    COALESCE(NULLIF(TRIM(p.city), ''), 'ישראל') AS city,
    ROUND(SUM(s.amount)::numeric, 0) AS total_saved
  FROM public.user_profiles p
  INNER JOIN public.savings s ON s.user_id = p.id
  GROUP BY p.id, p.name, p.city
  HAVING SUM(s.amount) > 0
  ORDER BY total_saved DESC
  LIMIT 40;
$$;

REVOKE ALL ON FUNCTION public.get_monthly_savings_leaderboard() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_monthly_savings_leaderboard() TO authenticated;

-- Compatibility view for any stale queries (optional, read-only)
DROP VIEW IF EXISTS public.profiles;
CREATE VIEW public.profiles AS SELECT * FROM public.user_profiles;
