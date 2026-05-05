/**
 * Plantilla **Verdana / lavanda**: titular grande con nombre del speaker, tarjeta blanca, bloque oscuro fecha/hora/lugar.
 */
import { escapeHtml } from './emailHtmlEscape';
import type { EmailTemplateBuildInput } from './emailTemplateInput';
import { eventTitleFrom, fechaCortaYLarga, splitOrador } from './emailTemplateInput';
import { labelForEstado } from './emailCampaignTypes';

const LOGO_URL =
  'https://res.cloudinary.com/doe1cks3v/image/upload/v1774141496/logo_sin_fondo_nlqlse.png';
const FOOTER_IMAGE_URL =
  'https://res.cloudinary.com/doe1cks3v/image/upload/v1774141495/WhatsApp_Image_2026-03-07_at_20.38.17_g1oisv.jpg';

const FF = "'Verdana',Geneva,sans-serif";

function bodyHtml(text: string): string {
  const t = text.trim();
  if (!t) return '<span style="color:#aaaaaa;">…</span>';
  return escapeHtml(t).replace(/\r?\n/g, '<br>');
}

export function buildVerdanaInviteHtml(input: EmailTemplateBuildInput): string {
  const { name: orName, role: orRole } = splitOrador(input.orador);
  const title = eventTitleFrom(input);
  const tipoPill = escapeHtml(labelForEstado(input.estado).toUpperCase());
  const { corta: fechaCorta } = fechaCortaYLarga(input.fecha);
  const horaE = escapeHtml(input.hora.trim() || '—');
  const lugarE = escapeHtml(input.lugar.trim() || '—');
  const fechaCortaE = escapeHtml(fechaCorta);

  const nameHeadline = orName.trim() ? escapeHtml(orName.trim()) : '—';
  const nameCard = orName.trim() ? escapeHtml(orName.trim()) : '—';
  const roleCard = orRole.trim()
    ? `<p style="margin:0;font-family:${FF};font-size:12px;color:#603ef9;">${escapeHtml(orRole.trim())}</p>`
    : '';

  const flyerBlock = input.flyerUrl.trim()
    ? `<tr><td style="padding:0;border-radius:16px;overflow:hidden;box-shadow:0 20px 60px rgba(96,62,249,0.18);">
        <img src="${escapeHtml(input.flyerUrl.trim())}" alt="${escapeHtml(title)}" width="600" style="display:block;width:100%;border-radius:16px;">
      </td></tr>`
    : `<tr><td style="padding:0;border-radius:16px;overflow:hidden;box-shadow:0 12px 40px rgba(96,62,249,0.12);background:#e4dff9;min-height:200px;">
        <div style="padding:64px 24px;text-align:center;font-family:${FF};font-size:14px;color:#9988cc;">Flyer / imagen del evento</div>
      </td></tr>`;

  const ctaHref = escapeHtml(input.ctaUrl.trim() || '#');
  const unsubHref = '#';

  const subject = escapeHtml(input.asunto.trim() || 'Xplora UCEMA');

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:#ede9fe;font-family:${FF};">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#ede9fe;">
  <tr><td align="center" style="padding:32px 16px 48px;">
    <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">

      <tr><td style="padding:0 0 24px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td>
              <img src="${LOGO_URL}" alt="Xplora UCEMA" width="40" style="display:block;">
            </td>
            <td align="right" style="vertical-align:middle;">
              <span style="display:inline-block;background:#603ef9;color:#ffffff;font-family:${FF};font-size:9px;font-weight:700;letter-spacing:2px;text-transform:uppercase;padding:7px 16px;border-radius:100px;">${tipoPill}</span>
            </td>
          </tr>
        </table>
      </td></tr>

      <tr><td style="padding:0 0 4px;">
        <p style="margin:0;font-family:${FF};font-size:11px;color:#603ef9;letter-spacing:3px;text-transform:uppercase;">Ecosistema Emprendedor UCEMA</p>
      </td></tr>
      <tr><td style="padding:0 0 28px;">
        <p style="margin:0;font-family:${FF};font-size:42px;font-weight:700;color:#0d0b1e;line-height:1.1;letter-spacing:-0.5px;">Te invitamos<br>a escuchar<br><span style="color:#603ef9;">${nameHeadline}</span></p>
      </td></tr>

      ${flyerBlock}

      <tr><td style="padding:0 16px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff;border-radius:16px;margin-top:-24px;box-shadow:0 8px 32px rgba(96,62,249,0.1);">

          <tr><td style="padding:32px 36px 20px;">
            <p style="margin:0 0 8px;font-family:${FF};font-size:13px;color:#888888;line-height:1.7;">Hola:</p>
            <p style="margin:0;font-family:${FF};font-size:14px;color:#333344;line-height:1.9;">${bodyHtml(input.textoPrincipal)}</p>
          </td></tr>

          <tr><td style="padding:0 36px 24px;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f5f3ff;border-radius:12px;">
              <tr><td style="padding:20px 24px;">
                <p style="margin:0 0 2px;font-family:${FF};font-size:19px;font-weight:700;color:#0d0b1e;">${nameCard}</p>
                ${roleCard}
              </td></tr>
            </table>
          </td></tr>

          <tr><td style="padding:0 36px 32px;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#0d0b1e;border-radius:12px;">
              <tr><td style="padding:24px 24px 8px;">
                <p style="margin:0 0 20px;font-family:${FF};font-size:28px;font-weight:700;color:#ffffff;line-height:1.1;">${fechaCortaE}</p>
              </td></tr>
              <tr><td style="padding:0 24px 24px;">
                <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid rgba(255,255,255,0.08);">
                  <tr>
                    <td width="50%" style="padding:16px 16px 0 0;border-right:1px solid rgba(255,255,255,0.08);">
                      <p style="margin:0 0 4px;font-size:9px;color:rgba(255,255,255,0.4);letter-spacing:2px;text-transform:uppercase;font-family:${FF};">Hora</p>
                      <p style="margin:0;font-size:14px;color:#ffffff;font-weight:700;font-family:${FF};">${horaE}</p>
                    </td>
                    <td width="50%" style="padding:16px 0 0 16px;">
                      <p style="margin:0 0 4px;font-size:9px;color:rgba(255,255,255,0.4);letter-spacing:2px;text-transform:uppercase;font-family:${FF};">Lugar</p>
                      <p style="margin:0;font-size:14px;color:#ffffff;font-weight:700;font-family:${FF};">${lugarE}</p>
                    </td>
                  </tr>
                </table>
              </td></tr>
            </table>
          </td></tr>

          <tr><td align="center" style="padding:0 36px 8px;">
            <a href="${ctaHref}" style="display:block;background:#603ef9;color:#ffffff;text-decoration:none;font-family:${FF};font-size:15px;font-weight:700;padding:20px 40px;border-radius:100px;text-align:center;">Reservá tu lugar</a>
          </td></tr>

          <tr><td style="padding:24px 36px 32px;border-top:1px solid #f0eeff;margin-top:8px;">
            <p style="margin:0;font-family:${FF};font-size:13px;color:#888888;line-height:1.7;">Nos vemos ahí,<br><strong style="color:#0d0b1e;">El equipo de Xplora UCEMA</strong></p>
          </td></tr>

        </table>
      </td></tr>

      <tr><td style="padding:28px 0 0;">
        <img src="${FOOTER_IMAGE_URL}" alt="Xplora UCEMA" width="600" style="display:block;width:100%;border-radius:12px;">
      </td></tr>

      <tr><td align="center" style="padding:20px 0 0;">
        <p style="margin:0;font-size:11px;color:#9988cc;font-family:${FF};">¿No querés recibir más emails? <a href="${unsubHref}" style="color:#603ef9;text-decoration:none;">Desuscribite acá</a></p>
      </td></tr>

    </table>
  </td></tr>
</table>
</body>
</html>`;
}
