/**
 * Admin: listar waitlist Startup Day (`public.startup_day_waitlist`).
 */
import type { RequestHandler } from 'express';
import type { AppConfig } from '../../config/env.js';
import { createServiceSupabase } from '../../infra/supabase-clients.js';
import { BadRequestError, InternalError } from '../errors/http-error.js';
import { asyncHandler } from '../middleware/async-handler.js';

export function createAdminStartupDayWaitlistListHandler(config: AppConfig): RequestHandler {
  return asyncHandler(async (_req, res) => {
    const sb = createServiceSupabase(config);
    if (!sb) throw new InternalError('Falta SUPABASE_SERVICE_ROLE_KEY para listar waitlist.');

    const { data, error, count } = await sb
      .from('startup_day_waitlist')
      .select(
        'id, email, nombre_completo, universidad, carrera, que_estan_creando, created_at',
        { count: 'exact' },
      )
      .order('created_at', { ascending: false })
      .limit(1000);
    if (error) throw new BadRequestError(error.message);
    res.json({ rows: (data as unknown) ?? [], total: count ?? data?.length ?? 0 });
  });
}
