/**
 * Audiencia por evento: filas de `inscripciones_evento` + datos de `usuarios`.
 */
import type { RequestHandler } from 'express';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { AppConfig } from '../../config/env.js';
import { createUserSupabase } from '../../infra/supabase-clients.js';
import { BadRequestError } from '../errors/http-error.js';
import { asyncHandler } from '../middleware/async-handler.js';

const FETCH_PAGE = 1000;

function parseEventoId(req: { params: { eventoId?: string | string[] } }): string {
  const raw = req.params.eventoId;
  const id = Array.isArray(raw) ? raw[0] : raw;
  if (!id || typeof id !== 'string') throw new BadRequestError('Falta evento id.');
  return id;
}

async function fetchAllInscripcionesRows(
  sb: SupabaseClient,
  eventoId: string,
): Promise<
  { usuario_id: string; registered_at: string; asistio: boolean; asistio_at: string | null }[]
> {
  const out: {
    usuario_id: string;
    registered_at: string;
    asistio: boolean;
    asistio_at: string | null;
  }[] = [];
  let offset = 0;
  for (;;) {
    const { data, error } = await sb
      .from('inscripciones_evento')
      .select('usuario_id, registered_at, asistio, asistio_at')
      .eq('evento_id', eventoId)
      .order('registered_at', { ascending: true })
      .range(offset, offset + FETCH_PAGE - 1);
    if (error) throw new BadRequestError(error.message);
    const chunk =
      (data as {
        usuario_id: string;
        registered_at: string;
        asistio: boolean;
        asistio_at: string | null;
      }[] | null) ?? [];
    out.push(...chunk);
    if (chunk.length < FETCH_PAGE) break;
    offset += FETCH_PAGE;
  }
  return out;
}

async function fetchUsuariosByIds(
  sb: SupabaseClient,
  ids: string[],
): Promise<Map<string, { nombre: string; email: string; carrera: string }>> {
  const map = new Map<string, { nombre: string; email: string; carrera: string }>();
  const unique = [...new Set(ids)];
  const chunkSize = 200;
  for (let i = 0; i < unique.length; i += chunkSize) {
    const slice = unique.slice(i, i + chunkSize);
    const { data, error } = await sb
      .from('usuarios')
      .select('id, nombre, email, carrera')
      .in('id', slice);
    if (error) throw new BadRequestError(error.message);
    const rows = (data as { id: string; nombre: string | null; email: string | null; carrera: string | null }[] | null) ?? [];
    for (const r of rows) {
      map.set(r.id, {
        nombre: r.nombre ?? '',
        email: r.email ?? '',
        carrera: r.carrera ?? '',
      });
    }
  }
  return map;
}

/** GET /api/admin/eventos/:eventoId/inscripciones */
export function createAdminEventoInscripcionesHandler(config: AppConfig): RequestHandler {
  return asyncHandler(async (req, res) => {
    const eventoId = parseEventoId(req);
    const sb = createUserSupabase(config, req.headers.authorization);

    const { data: ev, error: evErr } = await sb
      .from('eventos')
      .select('id, title, date_display, realizado')
      .eq('id', eventoId)
      .maybeSingle();
    if (evErr) throw new BadRequestError(evErr.message);
    if (!ev) throw new BadRequestError('No existe ese evento.');

    const insRows = await fetchAllInscripcionesRows(sb, eventoId);
    const usuarioIds = insRows.map(r => r.usuario_id);
    const usuarios = await fetchUsuariosByIds(sb, usuarioIds);

    const rows = insRows.map(r => {
      const u = usuarios.get(r.usuario_id);
      return {
        usuario_id: r.usuario_id,
        nombre: u?.nombre ?? '',
        email: u?.email ?? '',
        carrera: u?.carrera ?? '',
        asistio: r.asistio,
        registered_at: r.registered_at,
        asistio_at: r.asistio_at,
      };
    });

    res.json({
      evento: {
        id: ev.id as string,
        title: (ev.title as string) ?? '',
        date_display: (ev.date_display as string | null) ?? null,
        realizado: (ev.realizado as boolean | null) ?? null,
      },
      rows,
    });
  });
}
