import type { RequestHandler } from 'express';
import type { AppConfig } from '../../config/env.js';
import { createUserSupabase } from '../../infra/supabase-clients.js';
import { BadRequestError, UnauthorizedError } from '../errors/http-error.js';
import { asyncHandler } from '../middleware/async-handler.js';

export function createPartnerMeHandler(config: AppConfig): RequestHandler {
  return asyncHandler(async (req, res) => {
    const sb = createUserSupabase(config, req.headers.authorization);
    const { data, error } = await sb.rpc('partner_company_profile');
    if (error) throw new BadRequestError(error.message);
    const company = Array.isArray(data) ? data[0] : null;
    if (!company) throw new UnauthorizedError('Tu cuenta no está asociada a una empresa.');
    res.json({ company });
  });
}

