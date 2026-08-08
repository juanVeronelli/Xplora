/**
 * POST público: lead de sponsor → fila en `public.sponsor_leads` + mail al equipo.
 * Usa service role (no expone tabla al cliente).
 */
import type { RequestHandler } from 'express';
import type { AppConfig } from '../../config/env.js';
import { createServiceSupabase } from '../../infra/supabase-clients.js';
import { BadRequestError, InternalError } from '../errors/http-error.js';
import { asyncHandler } from '../middleware/async-handler.js';
import { sendOneResendEmail } from '../../services/resend-send.service.js';
import {
  buildSponsorLeadNotifyHtml,
  SPONSOR_LEAD_NOTIFY_TO,
} from '../../services/sponsor-lead-email.service.js';

const MAX_LEN = 6000;
const MAX_SMALL = 240;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function cleanText(v: unknown, max: number): string {
  if (typeof v !== 'string') return '';
  // Quita controles / newlines peligrosos en headers y storage
  return v
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .trim()
    .slice(0, max);
}

/** Evita inyección de headers en el subject del mail. */
function cleanSubjectPart(v: string, max = 80): string {
  return v.replace(/[\r\n\u0000-\u001F\u007F]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
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

    if (empresa.length < 2) throw new BadRequestError('Empresa inválida.');
    if (nombre_contacto.length < 2) throw new BadRequestError('Nombre de contacto inválido.');
    if (!emailRaw || !EMAIL_RE.test(emailRaw)) throw new BadRequestError('Email inválido.');
    if (interes.length < 2) throw new BadRequestError('Elegí un interés.');

    const email = emailRaw.toLowerCase();
    const telefonoOrNull = telefono || null;
    const mensajeOrNull = mensaje || null;

    const { error } = await sb.from('sponsor_leads').insert({
      empresa,
      nombre_contacto,
      email,
      telefono: telefonoOrNull,
      interes,
      mensaje: mensajeOrNull,
    });
    if (error) {
      console.warn('[sponsors] insert falló:', error.message);
      throw new BadRequestError('No se pudo guardar el lead. Probá de nuevo.');
    }

    let emailSent = false;
    if (config.resend) {
      const html = buildSponsorLeadNotifyHtml({
        empresa,
        nombreContacto: nombre_contacto,
        email,
        telefono: telefonoOrNull,
        interes,
        mensaje: mensajeOrNull,
      });
      const subject = `[Xplora Sponsors] ${cleanSubjectPart(empresa)} — ${cleanSubjectPart(interes)}`;
      const err = await sendOneResendEmail(config.resend, {
        to: SPONSOR_LEAD_NOTIFY_TO,
        subject,
        html,
        replyTo: email,
      });
      if (err) {
        console.warn(`[sponsors] Resend falló para lead ${email}:`, err);
      } else {
        emailSent = true;
      }
    } else {
      console.warn('[sponsors] Resend no configurado; lead guardado sin mail al equipo.');
    }

    res.status(201).json({ ok: true, emailSent });
  });
}
