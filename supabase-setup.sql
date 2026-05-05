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

-- 4. RLS
ALTER TABLE eventos ENABLE ROW LEVEL SECURITY;
ALTER TABLE charlas ENABLE ROW LEVEL SECURITY;
ALTER TABLE empleos ENABLE ROW LEVEL SECURITY;

-- Public read
CREATE POLICY "Public read eventos" ON eventos FOR SELECT USING (true);
CREATE POLICY "Public read charlas" ON charlas FOR SELECT USING (true);
CREATE POLICY "Public read empleos" ON empleos FOR SELECT USING (true);

-- Authenticated write
CREATE POLICY "Auth all eventos" ON eventos FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth all charlas" ON charlas FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth all empleos" ON empleos FOR ALL TO authenticated USING (true) WITH CHECK (true);
