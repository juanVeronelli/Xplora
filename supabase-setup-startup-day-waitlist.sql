-- Waitlist exclusiva Startup Day (reservas de lugar).
-- Ejecutar en el SQL Editor de Supabase (o via migration).
-- Escritura solo vía API con service role; RLS cerrado a anon/authenticated.

CREATE TABLE IF NOT EXISTS public.startup_day_waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  nombre_completo TEXT,
  universidad TEXT,
  que_estan_creando TEXT,
  carrera TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS startup_day_waitlist_email_uidx
  ON public.startup_day_waitlist (lower(email));

ALTER TABLE public.startup_day_waitlist ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "No access startup_day_waitlist" ON public.startup_day_waitlist;
CREATE POLICY "No access startup_day_waitlist"
  ON public.startup_day_waitlist
  FOR ALL
  USING (false)
  WITH CHECK (false);

COMMENT ON TABLE public.startup_day_waitlist IS
  'Reservas de lugar Startup Day (9/9/2026). Exclusiva del funnel startupday.xploraucema.com.';
