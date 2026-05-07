/**
 * GET /api/admin/instagram/reels?year=2026 — reels del año (Meta Graph API).
 */
import type { RequestHandler } from 'express';
import type { AppConfig } from '../../config/env.js';
import { asyncHandler } from '../middleware/async-handler.js';
import { BadRequestError } from '../errors/http-error.js';
import { fetchInstagramReelsForYear } from '../../services/meta-instagram.service.js';

function parseYear(raw: unknown): number {
  const y = Number(raw);
  if (!Number.isFinite(y)) return new Date().getFullYear();
  return Math.trunc(y);
}

export function createAdminInstagramReelsHandler(config: AppConfig): RequestHandler {
  return asyncHandler(async (req, res) => {
    if (!config.meta) throw new BadRequestError('Meta no configurado en el server. Seteá META_IG_USER_ID y META_ACCESS_TOKEN.');
    const year = parseYear(req.query.year);
    const reels = await fetchInstagramReelsForYear(config.meta, year);
    res.json({ generated_at: new Date().toISOString(), year, reels });
  });
}

