ALTER TABLE public.negotiations
  ADD COLUMN IF NOT EXISTS recommendation_type text,
  ADD COLUMN IF NOT EXISTS retention_call_status text,
  ADD COLUMN IF NOT EXISTS retention_offer_amount numeric,
  ADD COLUMN IF NOT EXISTS script_used boolean NOT NULL DEFAULT false;