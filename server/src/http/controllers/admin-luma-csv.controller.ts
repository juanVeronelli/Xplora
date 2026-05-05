/**
 * POST multipart `csv` + evento id en URL: importa invitados desde CSV de Luma.
 * Crea usuarios faltantes, upsert `inscripciones_evento`, actualiza totales en `eventos`.
 */
import type { RequestHandler } from 'express';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { AppConfig } from '../../config/env.js';
import { createUserSupabase } from '../../infra/supabase-clients.js';
import { BadRequestError } from '../errors/http-error.js';
import { asyncHandler } from '../middleware/async-handler.js';
import {
  mergeGuestsByEmail,
  parseLumaCsvFile,
  type ParsedLumaGuest,
} from '../../services/luma-csv-import.service.js';

function defaultNombreFromEmail(email: string): string {
  const local = email.split('@')[0] ?? 'Usuario';
  return local.replace(/[._-]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

async function ensureUsuarioId(
  sb: SupabaseClient,
  row: ParsedLumaGuest,
): Promise<{ id: string; created: boolean }> {
  const email = row.email.toLowerCase();
  const { data: existing, error: qErr } = await sb
    .from('usuarios')
    .select('id')
    .eq('email', email)
    .maybeSingle();
  if (qErr) throw new BadRequestError(qErr.message);
  if (existing?.id) return { id: existing.id as string, created: false };

  const nombre = row.nombre.trim() || defaultNombreFromEmail(email);
  const { data: inserted, error: insErr } = await sb
    .from('usuarios')
    .insert({
      nombre,
      email,
      es_alumno_cema: false,
      carrera: null,
      suscrito_newsletter: true,
    })
    .select('id')
    .single();
  if (insErr) throw new BadRequestError(insErr.message);
  return { id: inserted!.id as string, created: true };
}

async function upsertInscripcion(
  sb: SupabaseClient,
  usuarioId: string,
  eventoId: string,
  asistio: boolean,
): Promise<void> {
  const { data: prev } = await sb
    .from('inscripciones_evento')
    .select('id, asistio, asistio_at, registered_at')
    .eq('usuario_id', usuarioId)
    .eq('evento_id', eventoId)
    .maybeSingle();

  const nowIso = new Date().toISOString();
  const effectiveAsistio = Boolean(prev?.asistio) || asistio;
  let asistioAt: string | null = prev?.asistio_at ?? null;
  if (effectiveAsistio && !asistioAt) asistioAt = nowIso;
  if (!effectiveAsistio) asistioAt = null;

  const registeredAt = prev?.registered_at ?? nowIso;

  const payload = {
    usuario_id: usuarioId,
    evento_id: eventoId,
    registered_at: registeredAt,
    asistio: effectiveAsistio,
    asistio_at: asistioAt,
  };

  if (prev?.id) {
    const { error } = await sb.from('inscripciones_evento').update(payload).eq('id', prev.id);
    if (error) throw new BadRequestError(error.message);
  } else {
    const { error } = await sb.from('inscripciones_evento').insert(payload);
    if (error) throw new BadRequestError(error.message);
  }
}

export function createAdminLumaCsvImportHandler(config: AppConfig): RequestHandler {
  return asyncHandler(async (req, res) => {
    const rawId = req.params.eventoId;
    const eventoId = Array.isArray(rawId) ? rawId[0] : rawId;
    if (!eventoId) throw new BadRequestError('Falta evento id.');

    const file = req.file;
    if (!file?.buffer?.length) {
      throw new BadRequestError('Subí un archivo CSV exportado desde Luma.');
    }

    const sb = createUserSupabase(config, req.headers.authorization);

    const { data: evento, error: evErr } = await sb
      .from('eventos')
      .select('id')
      .eq('id', eventoId)
      .maybeSingle();
    if (evErr) throw new BadRequestError(evErr.message);
    if (!evento) throw new BadRequestError('No existe ese evento.');

    const parsed = parseLumaCsvFile(file.buffer);
    if (parsed.guests.length === 0) {
      res.status(200).json({
        ok: true,
        filas_leidas: 0,
        emails_procesados: 0,
        usuarios_nuevos: 0,
        usuarios_existentes: 0,
        inscripciones_actualizadas: 0,
        asistieron_marcados: 0,
        total_inscriptos_evento: 0,
        total_asistieron_evento: 0,
        warnings: parsed.warnings,
      });
      return;
    }

    const merged = mergeGuestsByEmail(parsed.guests);
    let nuevos = 0;
    let existentes = 0;

    for (const row of merged.values()) {
      const { id: uid, created } = await ensureUsuarioId(sb, row);
      if (created) nuevos += 1;
      else existentes += 1;
      const asistio = row.kind === 'checked_in';
      await upsertInscripcion(sb, uid, eventoId, asistio);
    }

    const totalInscriptos = merged.size;
    const totalAsistieron = [...merged.values()].filter(r => r.kind === 'checked_in').length;

    const importedAt = new Date().toISOString();
    const { error: upEvErr } = await sb
      .from('eventos')
      .update({
        total_inscriptos: totalInscriptos,
        total_asistieron: totalAsistieron,
        luma_csv_imported_at: importedAt,
      })
      .eq('id', eventoId);
    if (upEvErr) throw new BadRequestError(upEvErr.message);

    res.status(200).json({
      ok: true,
      filas_leidas: parsed.guests.length,
      emails_procesados: merged.size,
      usuarios_nuevos: nuevos,
      usuarios_existentes: existentes,
      inscripciones_actualizadas: merged.size,
      asistieron_marcados: totalAsistieron,
      total_inscriptos_evento: totalInscriptos,
      total_asistieron_evento: totalAsistieron,
      warnings: parsed.warnings,
    });
  });
}
