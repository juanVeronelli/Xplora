import type { RequestHandler } from 'express';
import type { AppConfig } from '../../config/env.js';
import { createUserSupabase } from '../../infra/supabase-clients.js';
import { BadRequestError } from '../errors/http-error.js';
import { asyncHandler } from '../middleware/async-handler.js';

/** Estados permitidos para el pipeline de selección (partner). Deben coincidir con el front Partner Hub. */
const ALLOWED_STATUSES = new Set([
  'new',
  'contactado',
  'entrevista',
  'waitlist',
  'descartado',
  'contratado',
]);

export function createPartnerApplicationPatchHandler(config: AppConfig): RequestHandler {
  return asyncHandler(async (req, res) => {
    const id = req.params.id;
    if (!id) throw new BadRequestError('Falta id.');
    const sb = createUserSupabase(config, req.headers.authorization);
    const body = (req.body ?? {}) as { status?: string; notes?: string | null };
    const patch: Record<string, unknown> = {};
    if (body.status !== undefined) {
      const s = String(body.status).trim().toLowerCase();
      if (!ALLOWED_STATUSES.has(s)) throw new BadRequestError('Estado no válido.');
      patch.status = s;
    }
    if (body.notes !== undefined) {
      patch.notes = typeof body.notes === 'string' ? body.notes : '';
    }
    if (Object.keys(patch).length === 0) throw new BadRequestError('Nada para actualizar.');
    const { data, error } = await sb.from('job_applications').update(patch).eq('id', id).select('*').maybeSingle();
    if (error) throw new BadRequestError(error.message);
    if (!data) throw new BadRequestError('No se encontró la postulación o no tenés permiso.');
    res.json(data);
  });
}
