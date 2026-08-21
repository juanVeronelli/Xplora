-- Propuestas / feedback de miembros Xplora.
-- Ejecutar en el SQL Editor de Supabase.
-- Escritura solo vía API con service role; RLS cerrado.

CREATE TABLE IF NOT EXISTS member_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_account_id UUID NOT NULL REFERENCES member_accounts (id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('feedback', 'event_idea', 'topic', 'other')),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS member_proposals_member_idx
  ON member_proposals (member_account_id, created_at DESC);

CREATE INDEX IF NOT EXISTS member_proposals_created_idx
  ON member_proposals (created_at DESC);

ALTER TABLE member_proposals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "member_proposals_deny_all" ON member_proposals;
CREATE POLICY "member_proposals_deny_all" ON member_proposals FOR ALL USING (false);

COMMENT ON TABLE member_proposals IS
  'Ideas, topics y feedback enviados desde /cuenta/propuestas.';
