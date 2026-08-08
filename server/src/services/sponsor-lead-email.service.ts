/** Aviso interno cuando llega un lead de sponsor / empresa. */

const EMAIL_LOGO_URL =
  'https://res.cloudinary.com/doe1cks3v/image/upload/v1774141496/logo_sin_fondo_nlqlse.png';

/** Inbox del equipo Xplora para leads de sponsors. */
export const SPONSOR_LEAD_NOTIFY_TO = 'xplora.ucema@gmail.com';

export type SponsorLeadEmailPayload = {
  empresa: string;
  nombreContacto: string;
  email: string;
  telefono: string | null;
  interes: string;
  mensaje: string | null;
};

export function buildSponsorLeadNotifyHtml(p: SponsorLeadEmailPayload): string {
  const rows: [string, string][] = [
    ['Empresa', p.empresa],
    ['Contacto', p.nombreContacto],
    ['Email', p.email],
    ['Teléfono', p.telefono || '—'],
    ['Interés', p.interes],
    ['Mensaje', p.mensaje || '—'],
  ];

  const details = rows
    .map(
      ([label, value]) => `
              <tr>
                <td style="padding:8px 0;font-size:13px;font-weight:700;color:#7A6E92;width:120px;vertical-align:top;">
                  ${escapeHtml(label)}
                </td>
                <td style="padding:8px 0;font-size:15px;line-height:1.45;color:#1A1028;vertical-align:top;">
                  ${escapeHtml(value).replace(/\n/g, '<br />')}
                </td>
              </tr>`,
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Nuevo lead sponsor</title>
</head>
<body style="margin:0;padding:0;background:#FAF8F5;font-family:Arial,Helvetica,sans-serif;color:#1A1028;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FAF8F5;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:560px;background:#ffffff;border:1px solid rgba(26,16,40,0.1);">
          <tr>
            <td style="padding:28px 28px 8px;background:#1A1028;">
              <img src="${EMAIL_LOGO_URL}" alt="Xplora" width="120" style="display:block;height:auto;" />
            </td>
          </tr>
          <tr>
            <td style="padding:28px;">
              <p style="margin:0 0 8px;font-size:13px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#603EF9;">
                Sponsors · Club
              </p>
              <h1 style="margin:0 0 16px;font-size:22px;line-height:1.25;">
                Nuevo lead de marca / empresa
              </h1>
              <p style="margin:0 0 20px;font-size:15px;line-height:1.55;color:#3d3060;">
                Quiere ser sponsor de Xplora (club, eventos o Startup Day). Respondé a este mail o escribile al contacto.
              </p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid rgba(26,16,40,0.1);">
                ${details}
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
