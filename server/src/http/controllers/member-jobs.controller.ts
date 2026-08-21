/**
 * Bolsa de empleo: listado solo para miembros autenticados.
 * Select acotado a columnas base de `empleos` (sin modality/category) para no romper
 * si la migración v2 no está aplicada.
 */
import type { RequestHandler } from 'express';
import type { AppConfig } from '../../config/env.js';
import { createServiceSupabase } from '../../infra/supabase-clients.js';
import { InternalError, UnauthorizedError } from '../errors/http-error.js';
import { asyncHandler } from '../middleware/async-handler.js';

type EmpleoRow = {
  id: string;
  title: string | null;
  company: string | null;
  location: string | null;
  emoji: string | null;
  type: string | null;
  area: string | null;
  description: string | null;
  application_link: string | null;
  created_at: string | null;
  status?: string | null;
};

/** GET /api/member/jobs — requiere JWT de miembro. */
export function createMemberJobsListHandler(config: AppConfig): RequestHandler {
  return asyncHandler(async (req, res) => {
    if (!req.memberAuth) throw new UnauthorizedError('Necesitás una cuenta Xplora para ver la bolsa.');
    const sb = createServiceSupabase(config);
    if (!sb) throw new InternalError('Base de datos no configurada.');

    const withStatus = await sb
      .from('empleos')
      .select(
        'id, title, company, location, emoji, type, area, description, application_link, created_at, status',
      )
      .order('created_at', { ascending: false })
      .limit(100);

    let rows: EmpleoRow[] = [];
    if (withStatus.error) {
      const fallback = await sb
        .from('empleos')
        .select('id, title, company, location, emoji, type, area, description, application_link, created_at')
        .order('created_at', { ascending: false })
        .limit(100);
      if (fallback.error) throw new InternalError(fallback.error.message);
      rows = (fallback.data as EmpleoRow[]) ?? [];
    } else {
      rows = ((withStatus.data as EmpleoRow[]) ?? []).filter(
        (j) => !j.status || j.status === 'published',
      );
    }

    res.json({
      jobs: rows.map((j) => ({
        id: j.id,
        title: j.title || 'Oferta',
        company: j.company || '',
        location: j.location || '',
        emoji: j.emoji || '',
        type: j.type || '',
        area: j.area || '',
        description: j.description || '',
        application_link: j.application_link || '',
        created_at: j.created_at,
      })),
    });
  });
}
