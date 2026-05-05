import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { AppConfig } from '../config/env.js';
import { UnauthorizedError } from '../http/errors/http-error.js';

/** Cliente Supabase con rol anónimo (lecturas públicas). */
export function createAnonSupabase(config: AppConfig): SupabaseClient {
  return createClient(config.supabaseUrl, config.supabaseAnonKey);
}

/** Cliente Supabase con el JWT del usuario (respeta RLS como el front). */
export function createUserSupabase(config: AppConfig, authorization: string | undefined): SupabaseClient {
  if (!authorization?.startsWith('Bearer ')) {
    throw new UnauthorizedError('Falta Authorization Bearer.');
  }
  return createClient(config.supabaseUrl, config.supabaseAnonKey, {
    global: { headers: { Authorization: authorization } },
  });
}

/** Cliente con service role: ignora RLS. Usar solo en rutas ya protegidas (requireAuth). */
export function createServiceSupabase(config: AppConfig): SupabaseClient | null {
  const key = config.supabaseServiceRoleKey;
  if (!key) return null;
  return createClient(config.supabaseUrl, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
