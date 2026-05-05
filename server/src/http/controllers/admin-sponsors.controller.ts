/**
 * Admin: listar leads de sponsors (empresas/marcas).
 * Usa service role para leer `sponsor_leads` (RLS cerrada) y permiso `postulaciones_manage` para autorizar.
 */
import type { RequestHandler } from 'express';
import type { AppConfig } from '../../config/env.js';
import { createServiceSupabase } from '../../infra/supabase-clients.js';
import { BadRequestError, InternalError } from '../errors/http-error.js';
import { asyncHandler } from '../middleware/async-handler.js';

export function createAdminSponsorsLeadListHandler(config: AppConfig): RequestHandler {
  return asyncHandler(async (_req, res) => {
    const sb = createServiceSupabase(config);
    if (!sb) throw new InternalError('Falta SUPABASE_SERVICE_ROLE_KEY para listar sponsors.');

    const { data, error } = await sb
      .from('sponsor_leads')
      .select('id, empresa, nombre_contacto, email, telefono, interes, mensaje, created_at')
      .order('created_at', { ascending: false })
      .limit(500);
    if (error) throw new BadRequestError(error.message);
    res.json({ rows: (data as unknown) ?? [] });
  });
}

