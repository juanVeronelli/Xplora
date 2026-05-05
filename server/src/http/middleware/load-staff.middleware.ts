import type { RequestHandler } from 'express';
import type { AppConfig } from '../../config/env.js';
import { UnauthorizedError, ForbiddenError, BadRequestError } from '../errors/http-error.js';
import { asyncHandler } from './async-handler.js';
import { createUserSupabase } from '../../infra/supabase-clients.js';
import type { CrmPermissionKey } from '../../permissions/crm-permissions.js';
import { normalizePermissionList } from '../../permissions/crm-permissions.js';

export interface StaffProfile {
  email: string;
  permissions: CrmPermissionKey[];
}

export function createLoadStaffProfileMiddleware(config: AppConfig): RequestHandler {
  return asyncHandler(async (req, _res, next) => {
    const uid = req.authUser?.id;
    if (!uid) throw new UnauthorizedError('Sesión requerida.');
    const sb = createUserSupabase(config, req.headers.authorization);
    const { data, error } = await sb
      .from('crm_staff')
      .select('email, permissions')
      .eq('auth_user_id', uid)
      .maybeSingle();
    if (error) throw new BadRequestError(error.message);
    if (!data) {
      throw new ForbiddenError('Tu cuenta no tiene acceso al panel CRM.', 'NO_CRM_ACCESS');
    }
    const email = typeof data.email === 'string' ? data.email : '';
    const permissions = normalizePermissionList(data.permissions);
    req.staffProfile = { email, permissions };
    next();
  });
}
