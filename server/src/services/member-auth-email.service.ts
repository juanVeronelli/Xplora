import type { AppConfig } from '../config/env.js';
import { sendOneResendEmail } from './resend-send.service.js';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function wrapEmail(body: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /></head>
<body style="margin:0;padding:0;background:#FAF8F5;font-family:Arial,Helvetica,sans-serif;color:#1A1028;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FAF8F5;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" style="max-width:560px;background:#ffffff;border:1px solid rgba(26,16,40,0.1);">
        <tr><td style="padding:22px 28px;background:#1A1028;color:#FAF8F5;font-size:18px;font-weight:700;letter-spacing:-0.02em;">Xplora</td></tr>
        <tr><td style="padding:28px;">${body}</td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function sendMemberRegisterConfirmEmail(
  config: AppConfig,
  opts: { to: string; confirmUrl: string },
): Promise<string | null> {
  if (!config.resend) return 'Resend no configurado';
  const url = escapeHtml(opts.confirmUrl);
  const html = wrapEmail(`
    <p style="margin:0 0 12px;font-size:15px;line-height:1.5;">Hola,</p>
    <p style="margin:0 0 18px;font-size:15px;line-height:1.55;">
      Confirmá tu email para crear tu cuenta en Xplora y acceder a la bolsa de empleo y tu perfil.
    </p>
    <p style="margin:0 0 22px;">
      <a href="${url}" style="display:inline-block;background:#603ef9;color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;padding:14px 28px;">
        Confirmar
      </a>
    </p>
    <p style="margin:0;font-size:13px;line-height:1.5;color:#7A6E92;">
      Si no pediste esto, ignorá este correo.
    </p>
  `);
  return sendOneResendEmail(config.resend, {
    to: opts.to,
    subject: 'Confirmá tu cuenta · Xplora',
    html,
  });
}

export async function sendMemberLoginCodeEmail(
  config: AppConfig,
  opts: { to: string; code: string },
): Promise<string | null> {
  if (!config.resend) return 'Resend no configurado';
  const code = escapeHtml(opts.code);
  const html = wrapEmail(`
    <p style="margin:0 0 12px;font-size:15px;line-height:1.5;">Hola,</p>
    <p style="margin:0 0 18px;font-size:15px;line-height:1.55;">
      Tu código para entrar a Xplora:
    </p>
    <p style="margin:0 0 22px;font-size:32px;font-weight:700;letter-spacing:0.28em;font-family:ui-monospace,Menlo,Consolas,monospace;color:#1A1028;">
      ${code}
    </p>
    <p style="margin:0;font-size:13px;line-height:1.5;color:#7A6E92;">
      Vence en 10 minutos. Si no pediste el código, ignorá este correo.
    </p>
  `);
  return sendOneResendEmail(config.resend, {
    to: opts.to,
    subject: `${opts.code} · Código de acceso Xplora`,
    html,
  });
}
