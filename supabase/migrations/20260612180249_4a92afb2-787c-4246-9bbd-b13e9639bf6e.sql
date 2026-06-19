ALTER TABLE public.user_categories ADD COLUMN IF NOT EXISTS registration_fee numeric;
ALTER TABLE public.offers ADD COLUMN IF NOT EXISTS registration_fee numeric NOT NULL DEFAULT 0;