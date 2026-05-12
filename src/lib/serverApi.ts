/**
 * Cliente HTTP hacia el API Node desde el browser.
 *
 * - **`authFetch`**: adjunta `Authorization: Bearer <access_token>` si hay sesión Supabase.
 *   Usar para `/api/admin/*` y cualquier ruta que exija usuario logueado.
 * - **`publicFetch`**: sin token; para `/api/public/*`.
 * - **`readApiError`**: parsea el JSON de error `{ error: string }` que devuelve el server.
 */
import { supabaseStaff as supabase } from './supabase';
import { apiUrl } from './apiBase';

/** POST/PATCH/DELETE u otros al API con JWT de la sesión actual (panel admin). */
export async function authFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const { data: { session } } = await supabase.auth.getSession();
  const headers = new Headers(init.headers);
  if (session?.access_token) {
    headers.set('Authorization', `Bearer ${session.access_token}`);
  }
  return fetch(apiUrl(path), { ...init, headers });
}

/** GET (u otros) sin autenticación; mismo origen que `authFetch` respecto a `apiUrl`. */
export function publicFetch(path: string, init: RequestInit = {}): Promise<Response> {
  return fetch(apiUrl(path), init);
}

/** Mensaje legible a partir de una respuesta 4xx/5xx del API propio. */
export async function readApiError(res: Response): Promise<string> {
  const j = (await res.json().catch(() => ({}))) as { error?: string };
  return typeof j.error === 'string' ? j.error : `Error ${res.status}`;
}
