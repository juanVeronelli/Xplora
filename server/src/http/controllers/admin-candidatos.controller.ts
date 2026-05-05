/**
 * Admin: listar candidatos para sumarse a Xplora.
 * Usa service role para leer `candidatos` (RLS cerrada) y permiso `postulaciones_manage` para autorizar.
 */
import type { RequestHandler } from 'express';
import type { AppConfig } from '../../config/env.js';
import { createServiceSupabase } from '../../infra/supabase-clients.js';
import { BadRequestError, InternalError } from '../errors/http-error.js';
import { asyncHandler } from '../middleware/async-handler.js';

export function createAdminCandidatosListHandler(config: AppConfig): RequestHandler {
  return asyncHandler(async (_req, res) => {
    const sb = createServiceSupabase(config);
    if (!sb) throw new InternalError('Falta SUPABASE_SERVICE_ROLE_KEY para listar candidatos.');

    const { data, error } = await sb
      .from('candidatos')
      .select('id, nombre, apellido, carrera, email, telefono, asistio_evento, linkedin_url, cv_url, motivacion, equipo_interes, estado, created_at')
      .order('created_at', { ascending: false })
      .limit(500);
    if (error) throw new BadRequestError(error.message);
    res.json({ rows: (data as unknown) ?? [] });
  });
}

export function createAdminCandidatosDeleteHandler(config: AppConfig): RequestHandler {
  return asyncHandler(async (req, res) => {
    const sb = createServiceSupabase(config);
    if (!sb) throw new InternalError('Falta SUPABASE_SERVICE_ROLE_KEY para borrar candidatos.');

    const id = String((req.params as { id?: string }).id || '').trim();
    if (!id) throw new BadRequestError('ID inválido.');

    const { error } = await sb.from('candidatos').delete().eq('id', id);
    if (error) throw new BadRequestError(error.message);

    res.status(204).send();
  });
}

