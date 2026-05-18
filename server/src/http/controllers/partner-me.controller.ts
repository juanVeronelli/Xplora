import type { RequestHandler } from 'express';
import type { AppConfig } from '../../config/env.js';
import { createServiceSupabase } from '../../infra/supabase-clients.js';
import { BadRequestError, InternalError, UnauthorizedError } from '../errors/http-error.js';
import { asyncHandler } from '../middleware/async-handler.js';

export function createPartnerMeHandler(config: AppConfig): RequestHandler {
  return asyncHandler(async (req, res) => {
    const companyId = req.partnerCompanyId;
    if (!companyId) throw new UnauthorizedError('Tu cuenta no está asociada a una empresa.');
    const sb = createServiceSupabase(config);
    if (!sb) throw new InternalError('Falta SUPABASE_SERVICE_ROLE_KEY para leer perfil partner.');
    const { data, error } = await sb.from('partner_companies').select('*').eq('id', companyId).maybeSingle();
    if (error) throw new BadRequestError(error.message);
    if (!data) throw new UnauthorizedError('Tu cuenta no está asociada a una empresa.');
    res.json({ company: data });
  });
}
