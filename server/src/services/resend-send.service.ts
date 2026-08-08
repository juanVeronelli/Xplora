import type { AppConfig } from '../config/env.js';
import type { CampaignRecipient } from './email-campaign-audience.service.js';

/** Único proveedor de envío de campañas: API Resend (no configurable). */
export const RESEND_SEND_URL = 'https://api.resend.com/emails' as const;

export type SendCampaignEmailResult = {
  sentIds: string[];
  failed: { usuario_id: string; email: string; error: string }[];
};

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function buildFromHeader(resend: NonNullable<AppConfig['resend']>): string {
  return resend.fromName ? `"${resend.fromName}" <${resend.from}>` : resend.from;
}

/**
 * Un solo correo. Devuelve `null` si Resend aceptó el envío; si no, mensaje de error.
 */
export async function sendOneResendEmail(
  resend: NonNullable<AppConfig['resend']>,
  opts: { to: string; subject: string; html: string; replyTo?: string },
): Promise<string | null> {
  const text = stripHtml(opts.html).slice(0, 12_000);
  const fromHeader = buildFromHeader(resend);
  try {
    const res = await fetch(RESEND_SEND_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resend.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromHeader,
        to: [opts.to],
        subject: opts.subject,
        html: opts.html,
        text,
        ...(opts.replyTo ? { reply_to: opts.replyTo } : {}),
      }),
      signal: AbortSignal.timeout(120_000),
    });
    if (!res.ok) {
      const errText = await res.text();
      let msg = `HTTP ${res.status}`;
      try {
        const j = JSON.parse(errText) as { message?: string };
        if (typeof j.message === 'string' && j.message) msg = j.message;
      } catch {
        if (errText) msg = errText.slice(0, 500);
      }
      return msg;
    }
    return null;
  } catch (e) {
    return e instanceof Error ? e.message : String(e);
  }
}

/**
 * Envío secuencial (compat). Preferí cola + `sendOneResendEmail` por destinatario.
 */
export async function sendCampaignEmailsViaResend(
  resend: NonNullable<AppConfig['resend']>,
  opts: { to: CampaignRecipient[]; subject: string; html: string },
): Promise<SendCampaignEmailResult> {
  const sentIds: string[] = [];
  const failed: SendCampaignEmailResult['failed'] = [];

  for (const r of opts.to) {
    const err = await sendOneResendEmail(resend, { to: r.email, subject: opts.subject, html: opts.html });
    if (err) {
      console.warn(`[resend] fallo envío a ${r.email}:`, err);
      failed.push({ usuario_id: r.usuario_id, email: r.email, error: err });
    } else {
      sentIds.push(r.usuario_id);
    }
  }

  return { sentIds, failed };
}
