/**
 * Estado de sesión Supabase + login contra **`POST /api/auth/login`** (el server valida y devuelve tokens).
 * El panel CRM usa `user`; si es `null`, en la ruta del panel solo se muestra el login.
 */
import { useState, useEffect } from 'react';
import { supabaseStaff } from '../lib/supabase';
import { apiUrl } from '../lib/apiBase';
import type { User } from '@supabase/supabase-js';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabaseStaff.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabaseStaff.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const res = await fetch(apiUrl('/api/auth/login'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const json = (await res.json().catch(() => ({}))) as {
      session?: { access_token: string; refresh_token: string };
      error?: string;
    };

    if (!res.ok || !json.session) {
      const msg = typeof json.error === 'string' ? json.error : 'Credenciales incorrectas';
      return {
        error: { message: msg, name: 'AuthApiError', status: 401 } as import('@supabase/supabase-js').AuthError,
      };
    }

    const { error } = await supabaseStaff.auth.setSession({
      access_token: json.session.access_token,
      refresh_token: json.session.refresh_token,
    });

    return { error };
  };

  const signOut = async () => {
    const { data: { session } } = await supabaseStaff.auth.getSession();
    if (session?.access_token) {
      await fetch(apiUrl('/api/auth/logout'), {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` },
      }).catch(() => {});
    }
    await supabaseStaff.auth.signOut();
  };

  return { user, loading, signIn, signOut };
}
