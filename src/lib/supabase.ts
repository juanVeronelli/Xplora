/**
 * Cliente Supabase browser (anon key en `VITE_SUPABASE_KEY`).
 * Sirve para **Auth** (login del admin) y, si hiciera falta, queries directas.
 * El catálogo público de contenido preferentemente pasa por **`publicFetch`** → API Node.
 */
import { createClient } from '@supabase/supabase-js';

const URL = import.meta.env.VITE_SUPABASE_URL as string;
const KEY = import.meta.env.VITE_SUPABASE_KEY as string;

export const supabase = createClient(URL, KEY);
