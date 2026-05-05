/**
 * GET /api/auth/me — email + permisos CRM para la sesión actual (tras bootstrap opcional).
 */
import type { RequestHandler } from 'express';
import type { AppConfig } from '../../config/env.js';
import { UnauthorizedError, ForbiddenError, BadRequestError } from '../errors/http-error.js';
import { asyncHandler } from '../middleware/async-handler.js';
import { createUserSupabase } from '../../infra/supabase-clients.js';
import { ensureBootstrapCrmStaff } from '../../services/crm-bootstrap.service.js';
import { normalizePermissionList } from '../../permissions/crm-permissions.js';

export function createAuthMeHandler(config: AppConfig): RequestHandler {
  return asyncHandler(async (req, res) => {
    const uid = req.authUser?.id;
    if (!uid) throw new UnauthorizedError('Sesión requerida.');
    const sb = createUserSupabase(config, req.headers.authorization);
    const { data: udata, error: uerr } = await sb.auth.getUser();
    if (uerr || !udata.user) throw new UnauthorizedError('Sesión inválida.');
    const email = udata.user.email ?? '';
    await ensureBootstrapCrmStaff(config, uid, email);

    const { data, error } = await sb
      .from('crm_staff')
      .select('email, permissions, nombre, apellido, equipo')
      .eq('auth_user_id', uid)
      .maybeSingle();
    if (error) throw new BadRequestError(error.message);
    if (!data) {
      const hasServiceKey = Boolean(config.supabaseServiceRoleKey?.trim());
      let detail =
        'Tu cuenta no tiene acceso al panel CRM.';
      if (!hasServiceKey) {
        detail +=
          ' En el servidor falta SUPABASE_SERVICE_ROLE_KEY en .env: sin esa clave no se puede dar de alta automática tu cuenta ni usar «Equipo».';
      } else {
        detail +=
          ' Pedí a un administrador que te asigne permisos desde la pestaña Equipo, o verificá que CRM_BOOTSTRAP_EMAIL sea tu correo y que la migración crm_staff esté aplicada.';
      }
      throw new ForbiddenError(detail, 'NO_CRM_ACCESS');
    }

    res.json({
      email: typeof data.email === 'string' ? data.email : email,
      permissions: normalizePermissionList(data.permissions),
      nombre: typeof data.nombre === 'string' ? data.nombre : '',
      apellido: typeof data.apellido === 'string' ? data.apellido : '',
      equipo: typeof data.equipo === 'string' ? data.equipo : '',
    });
  });
}
