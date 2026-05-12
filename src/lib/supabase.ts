/**
 * Cliente Supabase browser (anon key en `VITE_SUPABASE_KEY`).
 * Sirve para **Auth** (login del admin) y, si hiciera falta, queries directas.
 * El catálogo público de contenido preferentemente pasa por **`publicFetch`** → API Node.
 */
import { createClient } from '@supabase/supabase-js';

const URL = import.meta.env.VITE_SUPABASE_URL as string;
const KEY = import.meta.env.VITE_SUPABASE_KEY as string;

/** Sesión “Talento / Mi perfil” (magic link) */
export const supabase = createClient(URL, KEY, {
  auth: {
    storageKey: 'sb-xplora-talent-auth',
  },
});

/** Sesión separada para CRM Admin (email+password) */
export const supabaseStaff = createClient(URL, KEY, {
  auth: {
    storageKey: 'sb-xplora-staff-auth',
  },
});

/** Portal Partner (email+password): no comparte sesión con admin ni Talento */
export const supabasePartner = createClient(URL, KEY, {
  auth: {
    storageKey: 'sb-xplora-partner-auth',
  },
});
