/**
 * GET /api/admin/analytics — métricas agregadas (usuarios, eventos, inscripciones).
 */
import type { RequestHandler } from 'express';
import type { AppConfig } from '../../config/env.js';
import { createUserSupabase } from '../../infra/supabase-clients.js';
import { fetchAdminAnalytics } from '../../services/admin-analytics.service.js';
import { asyncHandler } from '../middleware/async-handler.js';

export function createAdminAnalyticsHandler(config: AppConfig): RequestHandler {
  return asyncHandler(async (req, res) => {
    const sb = createUserSupabase(config, req.headers.authorization);
    const payload = await fetchAdminAnalytics(sb);
    res.json(payload);
  });
}
