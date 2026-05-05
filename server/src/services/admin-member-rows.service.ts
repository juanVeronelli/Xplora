/**
 * Listado de miembros para el panel admin: datos de `usuarios` + inscripciones reales
 * (`inscripciones_evento` + títulos de `eventos`). Conteos y % se derivan solo de esas filas
 * para coincidir con el detalle mostrado (sin depender de la vista agregada).
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import { BadRequestError } from '../http/errors/http-error.js';

type UsuarioRow = {
  id: string;
  nombre: string | null;
  email: string | null;
  carrera: string | null;
  es_alumno_cema: boolean | null;
  eventos_anotado: number | null;
  eventos_asistio: number | null;
  created_at: string | null;
  updated_at: string | null;
};

type InsRow = {
  usuario_id: string;
  evento_id: string;
  asistio: boolean;
  registered_at: string;
};

type EventoMini = {
  id: string;
  title: string | null;
};

const FETCH_PAGE = 1000;

export type AdminMemberInscripcionDTO = {
  evento_id: string;
  title: string;
  asistio: boolean;
  registered_at: string;
};

export type AdminMemberRowDTO = {
  id: string;
  nombre: string;
  email: string;
  carrera: string;
  pct_asistencia: number | null;
  eventos_inscripto: number;
  eventos_asistio: number;
  inscripciones: AdminMemberInscripcionDTO[];
  es_alumno_cema: boolean;
  created_at: string | null;
  updated_at: string | null;
  usuario_eventos_anotado: number | null;
  usuario_eventos_asistio: number | null;
};

async function fetchAllUsuarios(sb: SupabaseClient): Promise<UsuarioRow[]> {
  const out: UsuarioRow[] = [];
  let offset = 0;
  for (;;) {
    const { data, error } = await sb
      .from('usuarios')
      .select(
        'id, nombre, email, carrera, es_alumno_cema, eventos_anotado, eventos_asistio, created_at, updated_at',
      )
      .order('nombre', { ascending: true })
      .range(offset, offset + FETCH_PAGE - 1);
    if (error) throw new BadRequestError(error.message);
    const chunk = (data as UsuarioRow[] | null) ?? [];
    out.push(...chunk);
    if (chunk.length < FETCH_PAGE) break;
    offset += FETCH_PAGE;
  }
  return out;
}

async function fetchAllInscripciones(sb: SupabaseClient): Promise<InsRow[]> {
  const out: InsRow[] = [];
  let offset = 0;
  for (;;) {
    const { data, error } = await sb
      .from('inscripciones_evento')
      .select('usuario_id, evento_id, asistio, registered_at')
      .order('registered_at', { ascending: true })
      .range(offset, offset + FETCH_PAGE - 1);
    if (error) throw new BadRequestError(error.message);
    const chunk = (data as InsRow[] | null) ?? [];
    out.push(...chunk);
    if (chunk.length < FETCH_PAGE) break;
    offset += FETCH_PAGE;
  }
  return out;
}

async function fetchEventosTitles(sb: SupabaseClient, ids: string[]): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  const unique = [...new Set(ids)];
  const chunkSize = 200;
  for (let i = 0; i < unique.length; i += chunkSize) {
    const slice = unique.slice(i, i + chunkSize);
    const { data, error } = await sb.from('eventos').select('id, title').in('id', slice);
    if (error) throw new BadRequestError(error.message);
    const rows = (data as EventoMini[] | null) ?? [];
    for (const r of rows) {
      map.set(r.id, (r.title ?? '').trim() || 'Sin título');
    }
  }
  return map;
}

function pctFromCounts(inscripto: number, asistio: number): number | null {
  if (inscripto === 0) return null;
  return Math.round((1000 * asistio) / inscripto) / 10;
}

/** Agrupa inscripciones por usuario; orden: más reciente por `registered_at` primero. */
function groupInscripciones(
  raw: InsRow[],
  titles: Map<string, string>,
): Map<string, AdminMemberInscripcionDTO[]> {
  type RowWithTs = InsRow & { _ts: number };
  const byUser = new Map<string, RowWithTs[]>();
  for (const r of raw) {
    const ts = Date.parse(r.registered_at);
    const row: RowWithTs = {
      ...r,
      _ts: Number.isFinite(ts) ? ts : 0,
    };
    const list = byUser.get(r.usuario_id);
    if (list) list.push(row);
    else byUser.set(r.usuario_id, [row]);
  }

  const result = new Map<string, AdminMemberInscripcionDTO[]>();
  for (const [uid, list] of byUser) {
    list.sort((a, b) => b._ts - a._ts);
    result.set(
      uid,
      list.map(r => ({
        evento_id: r.evento_id,
        title: titles.get(r.evento_id) ?? 'Sin título',
        asistio: r.asistio,
        registered_at: r.registered_at,
      })),
    );
  }
  return result;
}

export async function fetchAllMemberRows(sb: SupabaseClient): Promise<AdminMemberRowDTO[]> {
  const [users, rawIns] = await Promise.all([fetchAllUsuarios(sb), fetchAllInscripciones(sb)]);
  const eventoIds = [...new Set(rawIns.map(r => r.evento_id))];
  const titles = await fetchEventosTitles(sb, eventoIds);
  const byUser = groupInscripciones(rawIns, titles);

  return users.map(u => {
    const ins = byUser.get(u.id) ?? [];
    const n = ins.length;
    const asistio = ins.filter(r => r.asistio).length;
    return {
      id: u.id,
      nombre: u.nombre ?? '',
      email: u.email ?? '',
      carrera: u.carrera ?? '',
      eventos_inscripto: n,
      eventos_asistio: asistio,
      pct_asistencia: pctFromCounts(n, asistio),
      inscripciones: ins,
      es_alumno_cema: Boolean(u.es_alumno_cema),
      created_at: u.created_at,
      updated_at: u.updated_at,
      usuario_eventos_anotado: u.eventos_anotado,
      usuario_eventos_asistio: u.eventos_asistio,
    };
  });
}
