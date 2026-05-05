/**
 * Crea fila `crm_staff` con `access_total` si:
 * - el usuario todavía no tiene fila, y
 * - (`CRM_BOOTSTRAP_EMAIL` coincide con el mail) **o** la tabla está vacía (primer arranque).
 *
 * Requiere `SUPABASE_SERVICE_ROLE_KEY` y migración `crm_staff` aplicada.
 */
import type { AppConfig } from '../config/env.js';
import { createServiceSupabase } from '../infra/supabase-clients.js';
import { normalizePermissionList } from '../permissions/crm-permissions.js';

export async function ensureBootstrapCrmStaff(
  config: AppConfig,
  userId: string,
  email: string,
): Promise<void> {
  const sb = createServiceSupabase(config);
  if (!sb) return;

  const { data: existing, error: exErr } = await sb
    .from('crm_staff')
    .select('auth_user_id')
    .eq('auth_user_id', userId)
    .maybeSingle();
  if (exErr) return;
  if (existing) return;

  const bootstrap = process.env.CRM_BOOTSTRAP_EMAIL?.trim().toLowerCase();
  const emailMatchesBootstrap =
    Boolean(bootstrap) && email.trim().toLowerCase() === bootstrap;

  const { count, error: countErr } = await sb
    .from('crm_staff')
    .select('*', { count: 'exact', head: true });
  if (countErr) return;

  const tableEmpty = (count ?? 0) === 0;
  if (!emailMatchesBootstrap && !tableEmpty) return;

  await sb.from('crm_staff').insert({
    auth_user_id: userId,
    email: email.trim(),
    permissions: normalizePermissionList(['access_total']),
  });
}
