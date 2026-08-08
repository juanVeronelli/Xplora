/**
 * Alta desde el formulario público «Newsletter / Comunidad» → `public.usuarios`.
 * Requiere `SUPABASE_SERVICE_ROLE_KEY` en el servidor.
 */
import type { RequestHandler } from 'express';
import type { AppConfig } from '../../config/env.js';
import {
  isCarreraOpcion,
  isUniversidadOpcion,
  UCEMA_UNIVERSIDAD,
} from '../../data/academic-catalog.js';
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
    const apellido = typeof body.apellido === 'string' ? body.apellido.trim() : '';
    const emailRaw = typeof body.email === 'string' ? body.email.trim() : '';
    const universidad = typeof body.universidad === 'string' ? body.universidad.trim() : '';
    const carrera = typeof body.carrera === 'string' ? body.carrera.trim() : '';

    // Compat: formularios viejos enviaban nombre completo + esCema
    const legacyNombre = !apellido && nombre ? nombre : '';
    const fullName = legacyNombre || [nombre, apellido].filter(Boolean).join(' ').trim();

    if (!fullName || fullName.length > MAX_LEN) {
      throw new BadRequestError('Completá nombre y apellido.');
    }
    if (!emailRaw || !EMAIL_RE.test(emailRaw) || emailRaw.length > MAX_LEN) {
      throw new BadRequestError('Email inválido.');
    }

    let uni = universidad;
    let car = carrera;
    let esCema: 'Sí' | 'No' | '' =
      body.esCema === 'Sí' || body.esCema === 'No' ? body.esCema : '';

    // Formulario nuevo (landing): universidad + carrera tipadas
    if (uni) {
      if (!isUniversidadOpcion(uni)) {
        throw new BadRequestError('Elegí una universidad de la lista.');
      }
      if (!isCarreraOpcion(car)) {
        throw new BadRequestError('Elegí una carrera de la lista.');
      }
      esCema = uni === UCEMA_UNIVERSIDAD ? 'Sí' : 'No';
      // Un solo campo en DB hoy: carrera · universidad (ambos tipados)
      car = `${car} · ${uni}`;
    } else {
      // Legacy Newsletter.tsx (nombre completo + esCema + carrera libre)
      if (!car || car.length > MAX_LEN) {
        throw new BadRequestError('Completá tu carrera.');
      }
      if (esCema !== 'Sí' && esCema !== 'No') {
        throw new BadRequestError('Indicá si sos estudiante del CEMA.');
      }
    }

    if (car.length > MAX_LEN) {
      throw new BadRequestError('Carrera inválida.');
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

    const row = {
      nombre: fullName,
      email,
      carrera: car,
      es_alumno_cema: esCema === 'Sí',
    };

    const { error: insErr } = await sb.from('usuarios').insert(row);
    if (insErr) {
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
