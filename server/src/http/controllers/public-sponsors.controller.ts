/**
 * POST público: lead de sponsor → fila en `public.sponsor_leads`.
 * Usa service role (no expone tabla al cliente).
 */
import type { RequestHandler } from 'express';
import type { AppConfig } from '../../config/env.js';
import { createServiceSupabase } from '../../infra/supabase-clients.js';
import { BadRequestError, InternalError } from '../errors/http-error.js';
import { asyncHandler } from '../middleware/async-handler.js';

const MAX_LEN = 6000;
const MAX_SMALL = 240;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function cleanText(v: unknown, max: number): string {
  if (typeof v !== 'string') return '';
  return v.trim().slice(0, max);
}

export function createPublicSponsorsLeadHandler(config: AppConfig): RequestHandler {
  return asyncHandler(async (req, res) => {
    const sb = createServiceSupabase(config);
    if (!sb) {
      throw new InternalError(
        'El servidor no tiene configurada la escritura a la base (SUPABASE_SERVICE_ROLE_KEY).',
      );
    }

    const body = req.body as Record<string, unknown>;
    const empresa = cleanText(body.empresa, MAX_SMALL);
    const nombre_contacto = cleanText(body.nombre_contacto, MAX_SMALL);
    const emailRaw = cleanText(body.email, MAX_SMALL);
    const telefono = cleanText(body.telefono, MAX_SMALL);
    const interes = cleanText(body.interes, MAX_SMALL);
    const mensaje = cleanText(body.mensaje, MAX_LEN);

    if (!empresa) throw new BadRequestError('Empresa inválida.');
    if (!nombre_contacto) throw new BadRequestError('Nombre de contacto inválido.');
    if (!emailRaw || !EMAIL_RE.test(emailRaw)) throw new BadRequestError('Email inválido.');
    if (!interes) throw new BadRequestError('Elegí un interés.');

    const email = emailRaw.toLowerCase();

    const { error } = await sb.from('sponsor_leads').insert({
      empresa,
      nombre_contacto,
      email,
      telefono: telefono || null,
      interes,
      mensaje: mensaje || null,
    });
    if (error) throw new BadRequestError(error.message);

    res.status(201).json({ ok: true });
  });
}

