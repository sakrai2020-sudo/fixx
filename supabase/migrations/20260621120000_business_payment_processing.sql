-- Business payment processing (clearing fee) analysis
CREATE TABLE IF NOT EXISTS public.business_payment_processing (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  processor_name text NOT NULL,
  current_rate numeric,
  monthly_volume numeric,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS business_payment_processing_user_created_idx
  ON public.business_payment_processing (user_id, created_at DESC);

ALTER TABLE public.business_payment_processing ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own payment processing" ON public.business_payment_processing;
CREATE POLICY "own payment processing" ON public.business_payment_processing
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

COMMENT ON TABLE public.business_payment_processing IS 'Fixx business — clearing fee analysis submissions';
