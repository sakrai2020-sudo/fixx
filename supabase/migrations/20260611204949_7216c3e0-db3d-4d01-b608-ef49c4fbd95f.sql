
-- profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  phone TEXT,
  onboarding_complete BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile" ON public.profiles FOR ALL USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- user_categories
CREATE TABLE public.user_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_name TEXT NOT NULL,
  price_range TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, category_name)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_categories TO authenticated;
GRANT ALL ON public.user_categories TO service_role;
ALTER TABLE public.user_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own cats" ON public.user_categories FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- providers (catalog)
CREATE TABLE public.providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  logo_emoji TEXT
);
GRANT SELECT ON public.providers TO authenticated, anon;
GRANT ALL ON public.providers TO service_role;
ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read providers" ON public.providers FOR SELECT USING (true);

-- user_providers
CREATE TABLE public.user_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider_id UUID REFERENCES public.providers(id) ON DELETE SET NULL,
  provider_name TEXT NOT NULL,
  category TEXT NOT NULL,
  logo_emoji TEXT,
  plan_name TEXT,
  monthly_price NUMERIC,
  expiry_date DATE,
  savings_score INT DEFAULT 5,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_providers TO authenticated;
GRANT ALL ON public.user_providers TO service_role;
ALTER TABLE public.user_providers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own up" ON public.user_providers FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- negotiations
CREATE TABLE public.negotiations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_provider_id UUID REFERENCES public.user_providers(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active',
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deadline TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.negotiations TO authenticated;
GRANT ALL ON public.negotiations TO service_role;
ALTER TABLE public.negotiations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own neg" ON public.negotiations FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- offers
CREATE TABLE public.offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  negotiation_id UUID NOT NULL REFERENCES public.negotiations(id) ON DELETE CASCADE,
  offer_type TEXT NOT NULL,
  plan_name TEXT NOT NULL,
  features JSONB NOT NULL DEFAULT '[]'::jsonb,
  monthly_price NUMERIC NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.offers TO authenticated;
GRANT ALL ON public.offers TO service_role;
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read offers via neg" ON public.offers FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.negotiations n WHERE n.id = offers.negotiation_id AND n.user_id = auth.uid())
);
CREATE POLICY "modify offers via neg" ON public.offers FOR ALL USING (
  EXISTS (SELECT 1 FROM public.negotiations n WHERE n.id = offers.negotiation_id AND n.user_id = auth.uid())
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.negotiations n WHERE n.id = offers.negotiation_id AND n.user_id = auth.uid())
);

-- savings
CREATE TABLE public.savings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL DEFAULT 0,
  quarter INT NOT NULL,
  year INT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, quarter, year)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.savings TO authenticated;
GRANT ALL ON public.savings TO service_role;
ALTER TABLE public.savings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own savings" ON public.savings FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- auto create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, name, phone)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email,'@',1)), NEW.phone);
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- seed providers catalog
INSERT INTO public.providers (name, category, logo_emoji) VALUES
('פלאפון','סלולר','📱'),
('סלקום','סלולר','📱'),
('פרטנר','סלולר','📱'),
('HOT','טלוויזיה ואינטרנט','📺'),
('YES','טלוויזיה ואינטרנט','📺'),
('בזק','טלוויזיה ואינטרנט','📺'),
('חברת חשמל','חברת חשמל','⚡'),
('כללית','קופת חולים','🏥'),
('מכבי','קופת חולים','🏥'),
('הראל','ביטוח רכב','🚗'),
('מגדל','ביטוח חיים/בריאות','❤️'),
('הפניקס','ביטוח דירה/תכולה','🏠'),
('הולמס פלייס','מועדון כושר','💪'),
('Netflix','סטרימינג','🎬'),
('Spotify','סטרימינג','🎬');
