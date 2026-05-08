import type { RequestHandler } from 'express';
import type { AppConfig } from '../../config/env.js';
import { createUserSupabase } from '../../infra/supabase-clients.js';
import { BadRequestError } from '../errors/http-error.js';
import { asyncHandler } from '../middleware/async-handler.js';

export function createTalentProfileGetHandler(config: AppConfig): RequestHandler {
  return asyncHandler(async (req, res) => {
    const sb = createUserSupabase(config, req.headers.authorization);
    const userId = req.authUser?.id;
    if (!userId) throw new BadRequestError('Falta usuario.');
    const { data, error } = await sb.from('talent_profiles').select('*').eq('user_id', userId).maybeSingle();
    if (error) throw new BadRequestError(error.message);
    res.json(data ?? null);
  });
}

export function createTalentProfileUpsertHandler(config: AppConfig): RequestHandler {
  return asyncHandler(async (req, res) => {
    const sb = createUserSupabase(config, req.headers.authorization);
    const userId = req.authUser?.id;
    if (!userId) throw new BadRequestError('Falta usuario.');
    const body = (req.body ?? {}) as Record<string, unknown>;
    const payload = { ...body, user_id: userId, updated_at: new Date().toISOString() };
    const { data, error } = await sb.from('talent_profiles').upsert(payload).select('*').single();
    if (error) throw new BadRequestError(error.message);
    res.json(data);
  });
}

