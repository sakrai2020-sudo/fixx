-- Leaderboard: top 40 by total savings (all time), privacy-safe fields only
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
  GROUP BY p.id, p.name, p.city
  HAVING SUM(s.amount) > 0
  ORDER BY total_saved DESC
  LIMIT 40;
$$;
