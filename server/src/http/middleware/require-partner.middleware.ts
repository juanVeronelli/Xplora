import type { RequestHandler } from 'express';
import type { AppConfig } from '../../config/env.js';
import { createUserSupabase } from '../../infra/supabase-clients.js';
import { UnauthorizedError } from '../errors/http-error.js';
import { asyncHandler } from './async-handler.js';

/**
 * Verifica que el usuario autenticado sea partner (existe fila en `partner_users`).
 * La tabla `partner_users` tiene RLS cerrada; este middleware asume que la ruta
 * se usa junto a `createServiceSupabase` o que la policy se abre más adelante.
 *
 * En este repo preferimos evitar service role en rutas partner; por eso, en el MVP,
 * validamos vía función SQL `partner_company_id()` (RLS) indirectamente al consultar `empleos`.
 *
 * Este middleware queda como hook futuro (si abrimos lectura de `partner_users` por auth.uid()).
 */
export function createRequirePartnerMiddleware(_config: AppConfig): RequestHandler {
  return asyncHandler(async (req, _res, next) => {
    // Si ya viene seteado por una capa anterior.
    if (req.partnerCompanyId) return next();

    // Intento “best-effort” sin service role: si RLS no permite, cae y seguimos.
    try {
      const sb = createUserSupabase(_config, req.headers.authorization);
      const { data, error } = await sb.from('partner_users').select('company_id').single();
      if (!error && data?.company_id) {
        req.partnerCompanyId = String(data.company_id);
        return next();
      }
    } catch {
      // ignore
    }
    throw new UnauthorizedError('Acceso solo para partners.');
  });
}

