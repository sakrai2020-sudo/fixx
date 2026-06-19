-- City for leaderboard display (first name + city only — no payment data exposed)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS city text;

-- Monthly savings leaderboard: top 40 users, current calendar month (Asia/Jerusalem), savings totals only
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
  FROM public.profiles p
  INNER JOIN public.savings s ON s.user_id = p.id
  WHERE s.created_at >= date_trunc('month', timezone('Asia/Jerusalem', now()))
    AND s.created_at < date_trunc('month', timezone('Asia/Jerusalem', now())) + interval '1 month'
  GROUP BY p.id, p.name, p.city
  HAVING SUM(s.amount) > 0
  ORDER BY total_saved DESC
  LIMIT 40;
$$;

REVOKE ALL ON FUNCTION public.get_monthly_savings_leaderboard() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_monthly_savings_leaderboard() TO authenticated;
