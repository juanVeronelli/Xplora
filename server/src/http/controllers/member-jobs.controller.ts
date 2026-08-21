/**
 * Bolsa de empleo: listado solo para miembros autenticados.
 */
import type { RequestHandler } from 'express';
import type { AppConfig } from '../../config/env.js';
import { createServiceSupabase } from '../../infra/supabase-clients.js';
import { InternalError, UnauthorizedError } from '../errors/http-error.js';
import { asyncHandler } from '../middleware/async-handler.js';

/** GET /api/member/jobs — requiere JWT de miembro. */
export function createMemberJobsListHandler(config: AppConfig): RequestHandler {
  return asyncHandler(async (req, res) => {
    if (!req.memberAuth) throw new UnauthorizedError('Necesitás una cuenta Xplora para ver la bolsa.');
    const sb = createServiceSupabase(config);
    if (!sb) throw new InternalError('Base de datos no configurada.');

    const { data, error } = await sb
      .from('empleos')
      .select(
        'id, title, company, location, emoji, type, type_tag, area, description, modality, application_link, created_at, category_id, status',
      )
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw new InternalError(error.message);
    res.json({ jobs: data ?? [] });
  });
}
