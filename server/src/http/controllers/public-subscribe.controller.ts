/**
 * Alta desde el formulario público «Comunidad» → fila en `public.usuarios`.
 * Requiere `SUPABASE_SERVICE_ROLE_KEY` en el servidor (RLS no permite insert anon en usuarios).
 */
import type { RequestHandler } from 'express';
import type { AppConfig } from '../../config/env.js';
import { createServiceSupabase } from '../../infra/supabase-clients.js';
import { BadRequestError, InternalError } from '../errors/http-error.js';
import { asyncHandler } from '../middleware/async-handler.js';

const MAX_LEN = 240;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function createPublicSubscribeHandler(config: AppConfig): RequestHandler {
  return asyncHandler(async (req, res) => {
    const sb = createServiceSupabase(config);
    if (!sb) {
      throw new InternalError(
        'El servidor no tiene configurada la escritura a la base (SUPABASE_SERVICE_ROLE_KEY).',
      );
    }

    const body = req.body as Record<string, unknown>;
    const nombre = typeof body.nombre === 'string' ? body.nombre.trim() : '';
    const emailRaw = typeof body.email === 'string' ? body.email.trim() : '';
    const carrera = typeof body.carrera === 'string' ? body.carrera.trim() : '';
    const esCema = body.esCema === 'Sí' || body.esCema === 'No' ? body.esCema : '';

    if (!nombre || nombre.length > MAX_LEN) {
      throw new BadRequestError('Nombre inválido.');
    }
    if (!emailRaw || !EMAIL_RE.test(emailRaw) || emailRaw.length > MAX_LEN) {
      throw new BadRequestError('Email inválido.');
    }
    if (!carrera || carrera.length > MAX_LEN) {
      throw new BadRequestError('Completá tu carrera.');
    }
    if (esCema !== 'Sí' && esCema !== 'No') {
      throw new BadRequestError('Indicá si sos estudiante del CEMA.');
    }

    const email = emailRaw.toLowerCase();

    const { data: existing, error: qErr } = await sb
      .from('usuarios')
      .select('id')
      .eq('email', email)
      .maybeSingle();
    if (qErr) {
      throw new BadRequestError(qErr.message);
    }
    if (existing) {
      res.status(200).json({ ok: true, alreadyRegistered: true });
      return;
    }

    const esAlumnoCema = esCema === 'Sí';

    const row = {
      nombre,
      email,
      carrera,
      es_alumno_cema: esAlumnoCema,
    };

    const { error: insErr } = await sb.from('usuarios').insert(row);
    if (insErr) {
      // Carrera rara: dos envíos al mismo tiempo con el mismo email (índice único en email).
      const code = 'code' in insErr ? String((insErr as { code?: string }).code) : '';
      if (code === '23505' || /duplicate key/i.test(insErr.message)) {
        res.status(200).json({ ok: true, alreadyRegistered: true });
        return;
      }
      throw new BadRequestError(insErr.message);
    }

    res.status(201).json({ ok: true });
  });
}
