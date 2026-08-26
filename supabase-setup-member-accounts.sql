-- Cuentas de miembros (auth por email + código / confirmación).
-- Ejecutar en el SQL Editor de Supabase (misma migración que
-- supabase/migrations/20260821160000_member_accounts_auth.sql).
-- RLS deny-all: solo service role desde el API Node.

CREATE TABLE IF NOT EXISTS member_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  email_confirmed_at TIMESTAMPTZ,
  usuario_id UUID,
  display_name TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  avatar_url TEXT DEFAULT '',
  studies JSONB NOT NULL DEFAULT '[]'::jsonb,
  jobs JSONB NOT NULL DEFAULT '[]'::jsonb,
  languages JSONB NOT NULL DEFAULT '[]'::jsonb,
  skills TEXT[] NOT NULL DEFAULT '{}',
  cv_url TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS member_accounts_email_idx ON member_accounts (email);
CREATE INDEX IF NOT EXISTS member_accounts_usuario_id_idx ON member_accounts (usuario_id);

CREATE TABLE IF NOT EXISTS member_auth_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  purpose TEXT NOT NULL CHECK (purpose IN ('register_confirm', 'login_code')),
  token_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS member_auth_challenges_email_purpose_idx
  ON member_auth_challenges (email, purpose, created_at DESC);
CREATE INDEX IF NOT EXISTS member_auth_challenges_token_hash_idx
  ON member_auth_challenges (token_hash);

ALTER TABLE member_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_auth_challenges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "member_accounts_deny_all" ON member_accounts;
CREATE POLICY "member_accounts_deny_all" ON member_accounts FOR ALL USING (false);

DROP POLICY IF EXISTS "member_auth_challenges_deny_all" ON member_auth_challenges;
CREATE POLICY "member_auth_challenges_deny_all" ON member_auth_challenges FOR ALL USING (false);

COMMENT ON TABLE member_accounts IS
  'Cuentas de la comunidad Xplora (perfil + acceso a bolsa). Auth vía API Node + JWT.';
COMMENT ON TABLE member_auth_challenges IS
  'Tokens de confirmación de registro y códigos OTP de login (hasheados).';
