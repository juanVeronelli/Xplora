/**
 * Plantilla **Palatino / fondo oscuro**: intro grande, flyer con sombra, speaker + cuándo/dónde, CTA lateral.
 */
import { escapeHtml } from './emailHtmlEscape';
import type { EmailTemplateBuildInput } from './emailTemplateInput';
import { eventTitleFrom, fechaCortaYLarga, splitOrador } from './emailTemplateInput';
import { labelForEstado } from './emailCampaignTypes';

const LOGO_URL =
  'https://res.cloudinary.com/doe1cks3v/image/upload/v1774141496/logo_sin_fondo_nlqlse.png';
const FOOTER_IMAGE_URL =
  'https://res.cloudinary.com/doe1cks3v/image/upload/v1774141495/WhatsApp_Image_2026-03-07_at_20.38.17_g1oisv.jpg';

const SERIF =
  "'Palatino Linotype','Book Antiqua',Palatino,Georgia,serif";

function bodyHtml(text: string): string {
  const t = text.trim();
  if (!t) return '<span style="color:rgba(255,255,255,0.35);">…</span>';
  return escapeHtml(t).replace(/\r?\n/g, '<br>');
}

export function buildPalatinoEventHtml(input: EmailTemplateBuildInput): string {
  const { name: orName, role: orRole } = splitOrador(input.orador);
  const title = eventTitleFrom(input);
  const tipoEvento = escapeHtml(labelForEstado(input.estado).toUpperCase());
  const { corta: fechaCorta, larga: fechaLarga } = fechaCortaYLarga(input.fecha);
  const horaE = escapeHtml(input.hora.trim() || '—');
  const lugarE = escapeHtml(input.lugar.trim() || '—');
  const fechaCortaE = escapeHtml(fechaCorta);
  const fechaLargaE = escapeHtml(fechaLarga);

  const speakerName = orName.trim() ? escapeHtml(orName.trim()) : '—';
  const speakerRoleBlock = orRole.trim()
    ? `<p style="margin:0;font-family:${SERIF};font-size:13px;color:rgba(255,255,255,0.45);font-style:italic;">${escapeHtml(orRole.trim())}</p>`
    : '';

  const flyerBlock = input.flyerUrl.trim()
    ? `<tr><td style="padding:0;border-radius:10px;overflow:hidden;box-shadow:0 0 0 1px rgba(96,62,249,0.4),0 24px 48px rgba(0,0,0,0.5);">
        <img src="${escapeHtml(input.flyerUrl.trim())}" alt="${escapeHtml(title)}" width="600" style="display:block;width:100%;border-radius:10px;">
      </td></tr>`
    : `<tr><td style="padding:0;border-radius:10px;overflow:hidden;box-shadow:0 0 0 1px rgba(96,62,249,0.25);background:rgba(255,255,255,0.04);min-height:180px;">
        <div style="padding:56px 24px;text-align:center;font-family:${SERIF};font-size:14px;color:rgba(255,255,255,0.25);">Flyer / imagen del evento</div>
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
<body style="margin:0;padding:0;background:#1a1535;font-family:${SERIF};">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#1a1535;">
  <tr><td align="center" style="padding:40px 16px 56px;">
    <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">

      <tr><td style="padding:0 0 28px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="vertical-align:middle;">
              <img src="${LOGO_URL}" alt="Xplora UCEMA" width="40" style="display:block;">
            </td>
            <td align="right" style="vertical-align:middle;">
              <span style="font-family:${SERIF};font-size:11px;color:rgba(255,255,255,0.4);letter-spacing:3px;text-transform:uppercase;">${tipoEvento}</span>
            </td>
          </tr>
        </table>
      </td></tr>

      <tr><td style="padding:0 0 32px;">
        <p style="margin:0 0 12px;font-family:${SERIF};font-size:13px;color:rgba(255,255,255,0.45);letter-spacing:1px;">Hola —</p>
        <p style="margin:0;font-family:${SERIF};font-size:26px;color:#ffffff;line-height:1.5;font-weight:normal;">${bodyHtml(input.textoPrincipal)}</p>
      </td></tr>

      ${flyerBlock}

      <tr><td style="padding:36px 0 32px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td width="48" style="border-bottom:2px solid #603ef9;">&nbsp;</td>
            <td style="border-bottom:1px solid rgba(255,255,255,0.08);">&nbsp;</td>
          </tr>
        </table>
      </td></tr>

      <tr><td style="padding:0 0 32px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td width="50%" style="vertical-align:top;padding-right:24px;border-right:1px solid rgba(255,255,255,0.1);">
              <p style="margin:0 0 8px;font-family:${SERIF};font-size:9px;color:#603ef9;letter-spacing:3px;text-transform:uppercase;">Speaker</p>
              <p style="margin:0 0 6px;font-family:${SERIF};font-size:24px;color:#ffffff;font-weight:bold;line-height:1.2;">${speakerName}</p>
              ${speakerRoleBlock}
            </td>
            <td width="50%" style="vertical-align:top;padding-left:24px;">
              <p style="margin:0 0 8px;font-family:${SERIF};font-size:9px;color:#603ef9;letter-spacing:3px;text-transform:uppercase;">Cuándo y dónde</p>
              <p style="margin:0 0 6px;font-family:${SERIF};font-size:18px;color:#ffffff;font-weight:bold;line-height:1.3;">${fechaCortaE}</p>
              <p style="margin:0 0 4px;font-family:${SERIF};font-size:13px;color:rgba(255,255,255,0.55);">${horaE}</p>
              <p style="margin:0;font-family:${SERIF};font-size:13px;color:rgba(255,255,255,0.55);">${lugarE}</p>
            </td>
          </tr>
        </table>
      </td></tr>

      <tr><td style="padding:0 0 32px;">
        <hr style="border:none;border-top:1px solid rgba(255,255,255,0.08);margin:0;">
      </td></tr>

      <tr><td style="padding:0 0 40px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="vertical-align:middle;">
              <p style="margin:0;font-family:${SERIF};font-size:13px;color:rgba(255,255,255,0.4);line-height:2.0;">
                📅 ${fechaLargaE}<br>
                🕔 ${horaE}<br>
                📍 ${lugarE}
              </p>
            </td>
            <td align="right" style="vertical-align:middle;padding-left:24px;">
              <a href="${ctaHref}" style="display:inline-block;background:#603ef9;color:#ffffff;text-decoration:none;font-family:${SERIF};font-size:14px;font-style:italic;padding:16px 36px;border-radius:4px;white-space:nowrap;">Reservá tu lugar →</a>
            </td>
          </tr>
        </table>
      </td></tr>

      <tr><td style="padding:24px 0 32px;border-top:1px solid rgba(255,255,255,0.08);">
        <p style="margin:0;font-family:${SERIF};font-size:14px;color:rgba(255,255,255,0.4);line-height:1.7;font-style:italic;">Nos vemos ahí,<br><span style="color:rgba(255,255,255,0.75);font-style:normal;font-weight:bold;">El equipo de Xplora UCEMA</span></p>
      </td></tr>

      <tr><td style="padding:0;border-radius:10px;overflow:hidden;">
        <img src="${FOOTER_IMAGE_URL}" alt="Xplora UCEMA" width="600" style="display:block;width:100%;border-radius:10px;opacity:0.6;">
      </td></tr>

      <tr><td align="center" style="padding:20px 0 0;">
        <p style="margin:0;font-size:10px;color:rgba(255,255,255,0.2);font-family:${SERIF};">¿No querés recibir más emails? <a href="${unsubHref}" style="color:rgba(255,255,255,0.35);text-decoration:none;">Desuscribite acá</a></p>
      </td></tr>

    </table>
  </td></tr>
</table>
</body>
</html>`;
}
