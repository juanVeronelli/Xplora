-- Partners auth (custom, NO Supabase Auth)
-- Run in Supabase SQL Editor.

CREATE TABLE IF NOT EXISTS partner_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES partner_companies(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ NULL
);

CREATE INDEX IF NOT EXISTS partner_accounts_company_id_idx ON partner_accounts(company_id);

ALTER TABLE partner_accounts ENABLE ROW LEVEL SECURITY;
-- No direct access from client. Only server (service role) should read/write.
CREATE POLICY "No direct read partner_accounts" ON partner_accounts FOR SELECT USING (false);
CREATE POLICY "No direct write partner_accounts" ON partner_accounts FOR ALL USING (false) WITH CHECK (false);

