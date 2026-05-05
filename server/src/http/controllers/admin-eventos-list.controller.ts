/**
 * Lista completa de eventos para el panel admin (incluye `realizado`).
 */
import type { RequestHandler } from 'express';
import type { AppConfig } from '../../config/env.js';
import { createUserSupabase } from '../../infra/supabase-clients.js';
import { BadRequestError } from '../errors/http-error.js';
import { asyncHandler } from '../middleware/async-handler.js';

export function createAdminEventosListHandler(config: AppConfig): RequestHandler {
  return asyncHandler(async (req, res) => {
    const sb = createUserSupabase(config, req.headers.authorization);
    const { data, error } = await sb.from('eventos').select('*').order('created_at', { ascending: false });
    if (error) throw new BadRequestError(error.message);
    res.json(data ?? []);
  });
}
