import type { RequestHandler } from 'express';
import type { AppConfig } from '../../config/env.js';
import { createAnonSupabase } from '../../infra/supabase-clients.js';
import { asyncHandler } from '../middleware/async-handler.js';

export function createPublicListHandler(config: AppConfig, table: 'eventos' | 'charlas' | 'empleos'): RequestHandler {
  return asyncHandler(async (_req, res) => {
    const sb = createAnonSupabase(config);
    let q = sb.from(table).select('*').order('created_at', { ascending: false });
    if (table === 'eventos') {
      q = q.eq('realizado', false);
    }
    const { data, error } = await q;
    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }
    res.json(data ?? []);
  });
}

export function createPublicSiteMediaHandler(config: AppConfig): RequestHandler {
  return asyncHandler(async (_req, res) => {
    const sb = createAnonSupabase(config);
    const { data, error } = await sb.from('site_media').select('*').eq('id', 'main').maybeSingle();
    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }
    res.json(data);
  });
}
