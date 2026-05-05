/**
 * POST público: solicitud para sumarse a Xplora → fila en `public.candidatos`.
 * Usa service role (no expone tabla al cliente).
 */
import type { RequestHandler } from 'express';
import type { AppConfig } from '../../config/env.js';
import { createServiceSupabase } from '../../infra/supabase-clients.js';
import { BadRequestError, InternalError } from '../errors/http-error.js';
import { asyncHandler } from '../middleware/async-handler.js';
import { uploadCvBufferToCloudinary } from '../../services/cv-storage.service.js';

const MAX_LEN = 240;
const MAX_BIG = 4000;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function cleanText(v: unknown): string {
  return typeof v === 'string' ? v.trim() : '';
}

export function createPublicCandidatosHandler(config: AppConfig): RequestHandler {
  return asyncHandler(async (req, res) => {
    const sb = createServiceSupabase(config);
    if (!sb) {
      throw new InternalError(
        'El servidor no tiene configurada la escritura a la base (SUPABASE_SERVICE_ROLE_KEY).',
      );
    }

    const body = req.body as Record<string, unknown>;
    const nombre = cleanText(body.nombre);
    const apellido = cleanText(body.apellido);
    const carrera = cleanText(body.carrera);
    const emailRaw = cleanText(body.email);
    const telefono = cleanText(body.telefono);
    const linkedin = cleanText(body.linkedin_url);
    const motivacion = cleanText(body.motivacion);
    const equipo_interes = cleanText(body.equipo_interes);
    const asistioRaw = cleanText(body.asistio_evento);

    if (!nombre || nombre.length > MAX_LEN) throw new BadRequestError('Nombre inválido.');
    if (!apellido || apellido.length > MAX_LEN) throw new BadRequestError('Apellido inválido.');
    if (!carrera || carrera.length > MAX_LEN) throw new BadRequestError('Carrera inválida.');
    if (!emailRaw || !EMAIL_RE.test(emailRaw) || emailRaw.length > MAX_LEN) {
      throw new BadRequestError('Email inválido.');
    }
    if (!telefono || telefono.length > MAX_LEN) throw new BadRequestError('Número de teléfono inválido.');
    if (!equipo_interes || equipo_interes.length > MAX_LEN) {
      throw new BadRequestError('Elegí un equipo de interés.');
    }
    if (!motivacion || motivacion.length > MAX_BIG) {
      throw new BadRequestError('Contanos por qué querés unirte (máx. 4000 caracteres).');
    }
    if (motivacion.length < 10) {
      throw new BadRequestError('Contanos un poco más por qué querés unirte.');
    }
    const asistio_evento = asistioRaw === 'Sí' ? true : asistioRaw === 'No' ? false : null;
    if (asistio_evento === null) {
      throw new BadRequestError('Indicá si ya asististe a algún evento de Xplora.');
    }
    if (!linkedin || linkedin.length > MAX_LEN) {
      throw new BadRequestError('Link de LinkedIn inválido.');
    }
    if (!/^https?:\/\//i.test(linkedin)) {
      throw new BadRequestError('El link de LinkedIn debe empezar con http:// o https://');
    }

    const email = emailRaw.toLowerCase();

    const file = req.file as Express.Multer.File | undefined;
    if (!file?.buffer?.length) {
      throw new BadRequestError('Subí tu CV (PDF o Word).');
    }
    const cvUrl = await uploadCvBufferToCloudinary(config, {
      buffer: file.buffer,
      filename: file.originalname || 'cv',
    });

    const { error } = await sb.from('candidatos').insert({
      nombre,
      apellido,
      carrera,
      email,
      telefono,
      asistio_evento,
      linkedin_url: linkedin,
      cv_url: cvUrl,
      motivacion,
      equipo_interes,
    });
    if (error) throw new BadRequestError(error.message);

    res.status(201).json({ ok: true });
  });
}

