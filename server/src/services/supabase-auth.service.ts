import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { IAuthService, AuthUser } from './contracts/auth.interface.js';
import { InternalError } from '../http/errors/http-error.js';
import type { AppConfig } from '../config/env.js';

export class SupabaseJwtAuthService implements IAuthService {
  constructor(private readonly config: AppConfig) {}

  private createClientWithAuth(authHeader: string): SupabaseClient {
    const { supabaseUrl, supabaseAnonKey } = this.config;
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new InternalError(
        'Faltan SUPABASE_URL y anon key (o VITE_SUPABASE_URL / VITE_SUPABASE_KEY).',
      );
    }
    return createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
  }

  async getUserFromAuthorizationHeader(authHeader: string | undefined): Promise<AuthUser | null> {
    if (!authHeader?.startsWith('Bearer ')) {
      return null;
    }
    const supabase: SupabaseClient = this.createClientWithAuth(authHeader);
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (error || !user) {
      return null;
    }
    return { id: user.id, email: user.email ?? undefined };
  }
}
