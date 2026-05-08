-- Run this in your Supabase SQL Editor (https://app.supabase.com → SQL Editor)

-- 1. EVENTOS
CREATE TABLE IF NOT EXISTS eventos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  emoji TEXT DEFAULT '🎤',
  tag_type TEXT DEFAULT 'p',
  tag_label TEXT DEFAULT '',
  date_display TEXT DEFAULT '',
  day TEXT DEFAULT '',
  month TEXT DEFAULT '',
  location TEXT DEFAULT '',
  modality TEXT DEFAULT 'Presencial',
  capacity TEXT DEFAULT '',
  cost TEXT DEFAULT 'Gratuito',
  registration_link TEXT DEFAULT '',
  summary TEXT DEFAULT '',
  about TEXT DEFAULT '',
  speaker_name TEXT DEFAULT '',
  speaker_role TEXT DEFAULT '',
  speaker_initials TEXT DEFAULT '',
  speaker_bio TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. CHARLAS
CREATE TABLE IF NOT EXISTS charlas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  evento_id UUID REFERENCES eventos(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  emoji TEXT DEFAULT '🎤',
  speaker_name TEXT DEFAULT '',
  speaker_initials TEXT DEFAULT '',
  speaker_bio TEXT DEFAULT '',
  tag_type TEXT DEFAULT 'p',
  tag_label TEXT DEFAULT '',
  date_display TEXT DEFAULT '',
  about TEXT DEFAULT '',
  topics TEXT[] DEFAULT '{}',
  why_xplora TEXT DEFAULT '',
  duration TEXT DEFAULT '',
  attendees TEXT DEFAULT '',
  recording_link TEXT DEFAULT '',
  material_link TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. EMPLEOS
CREATE TABLE IF NOT EXISTS empleos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  -- Empresa propietaria (Partner Portal). Si es NULL, es una oferta “legacy” sin dueño.
  company_id UUID NULL,
  title TEXT NOT NULL,
  company TEXT DEFAULT '',
  location TEXT DEFAULT '',
  emoji TEXT DEFAULT '💼',
  type TEXT DEFAULT 'Full-time',
  type_tag TEXT DEFAULT 'g',
  area TEXT DEFAULT '',
  description TEXT DEFAULT '',
  requirements TEXT DEFAULT '',
  benefits TEXT DEFAULT '',
  application_link TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.b PARTNERS / TALENTO / APLICACIONES
CREATE TABLE IF NOT EXISTS partner_companies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  domain TEXT DEFAULT '',
  logo_url TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vincula usuarios Auth (email/password) a una empresa.
CREATE TABLE IF NOT EXISTS partner_users (
  user_id UUID PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES partner_companies(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Perfil del talento (magic link). Un registro por usuario.
CREATE TABLE IF NOT EXISTS talent_profiles (
  user_id UUID PRIMARY KEY,
  email TEXT DEFAULT '',
  full_name TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  career TEXT DEFAULT '',
  graduation_year TEXT DEFAULT '',
  linkedin_url TEXT DEFAULT '',
  portfolio_url TEXT DEFAULT '',
  cv_url TEXT DEFAULT '',
  about TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS job_applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES empleos(id) ON DELETE CASCADE,
  company_id UUID NULL REFERENCES partner_companies(id) ON DELETE SET NULL,
  talent_user_id UUID NOT NULL,
  status TEXT DEFAULT 'new',
  notes TEXT DEFAULT '',
  snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. RLS
ALTER TABLE eventos ENABLE ROW LEVEL SECURITY;
ALTER TABLE charlas ENABLE ROW LEVEL SECURITY;
ALTER TABLE empleos ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE talent_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;

-- Public read
CREATE POLICY "Public read eventos" ON eventos FOR SELECT USING (true);
CREATE POLICY "Public read charlas" ON charlas FOR SELECT USING (true);
CREATE POLICY "Public read empleos" ON empleos FOR SELECT USING (true);

-- Authenticated write
CREATE POLICY "Auth all eventos" ON eventos FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth all charlas" ON charlas FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth all empleos" ON empleos FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Helpers para RLS de partners (company_id por usuario)
CREATE OR REPLACE FUNCTION partner_company_id()
RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT pu.company_id FROM partner_users pu WHERE pu.user_id = auth.uid() LIMIT 1
$$;

-- PARTNER COMPANIES / USERS: solo service role o admin backend deberían tocar esto.
-- En el MVP: no exponemos lectura directa; mantenemos todo cerrado.
CREATE POLICY "No direct read partner_companies" ON partner_companies FOR SELECT USING (false);
CREATE POLICY "No direct read partner_users" ON partner_users FOR SELECT USING (false);

-- TALENTO: cada uno ve/edita su perfil.
CREATE POLICY "Talent read own profile" ON talent_profiles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "Talent upsert own profile" ON talent_profiles
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "Talent update own profile" ON talent_profiles
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- PARTNER: gestionar empleos propios (company_id = su company)
CREATE POLICY "Partner read own empleos" ON empleos
  FOR SELECT TO authenticated
  USING (company_id IS NULL OR company_id = partner_company_id());
CREATE POLICY "Partner insert own empleos" ON empleos
  FOR INSERT TO authenticated
  WITH CHECK (company_id = partner_company_id());
CREATE POLICY "Partner update own empleos" ON empleos
  FOR UPDATE TO authenticated
  USING (company_id = partner_company_id())
  WITH CHECK (company_id = partner_company_id());
CREATE POLICY "Partner delete own empleos" ON empleos
  FOR DELETE TO authenticated
  USING (company_id = partner_company_id());

-- PARTNER: ver aplicaciones de su empresa.
CREATE POLICY "Partner read applications" ON job_applications
  FOR SELECT TO authenticated
  USING (company_id = partner_company_id());

-- TALENTO: crear aplicación (company_id debe coincidir con job)
CREATE POLICY "Talent insert applications" ON job_applications
  FOR INSERT TO authenticated
  WITH CHECK (talent_user_id = auth.uid());
