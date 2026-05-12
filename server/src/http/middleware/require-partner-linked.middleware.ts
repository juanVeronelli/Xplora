import type { RequestHandler } from 'express';
import type { AppConfig } from '../../config/env.js';
import { createServiceSupabase } from '../../infra/supabase-clients.js';
import { BadRequestError, InternalError, UnauthorizedError } from '../errors/http-error.js';
import { asyncHandler } from './async-handler.js';

/**
 * Va **después** de `requireSession`: comprueba que el usuario Auth esté en `partner_users`
 * y guarda `company_id` en `req.partnerCompanyId`.
 */
export function createRequirePartnerLinkedMiddleware(config: AppConfig): RequestHandler {
  return asyncHandler(async (req, _res, next) => {
    const uid = req.authUser?.id;
    if (!uid) throw new UnauthorizedError('Tenés que iniciar sesión.');
    const sb = createServiceSupabase(config);
    if (!sb) throw new InternalError('Falta SUPABASE_SERVICE_ROLE_KEY para validar partner.');
    const { data, error } = await sb.from('partner_users').select('company_id').eq('user_id', uid).maybeSingle();
    if (error) throw new BadRequestError(error.message);
    if (!data?.company_id) throw new UnauthorizedError('Esta cuenta no tiene acceso al portal partner.');
    req.partnerCompanyId = String(data.company_id);
    next();
  });
}
