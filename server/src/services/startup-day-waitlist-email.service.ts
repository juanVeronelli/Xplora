/** Logo usado en mails de campaña (mismo asset Cloudinary que el CRM). */
const EMAIL_LOGO_URL =
  'https://res.cloudinary.com/doe1cks3v/image/upload/v1774141496/logo_sin_fondo_nlqlse.png';

/**
 * Confirmación de lista Startup Day (cupos limitados / chances).
 * Mock HTML liviano; se puede refinar después.
 */
export function buildStartupDayWaitlistConfirmHtml(opts: {
  email: string;
  nombreCompleto: string | null;
}): string {
  const greeting = opts.nombreCompleto?.trim()
    ? `Hola ${escapeHtml(opts.nombreCompleto.trim().split(/\s+/)[0]!)},`
    : 'Hola,';

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Startup Day — lista</title>
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
              <p style="margin:0 0 12px;font-size:15px;line-height:1.5;">${greeting}</p>
              <p style="margin:0 0 12px;font-size:15px;line-height:1.55;">
                Ya estás en la lista de <strong>Startup Day</strong>. Te vamos a avisar novedades
                del evento a este correo.
              </p>
              <p style="margin:0 0 12px;font-size:15px;line-height:1.55;">
                11 de septiembre de 2026 · 15 a 20 hs · Av. Alem 882 (UCEMA).
              </p>
              <p style="margin:0 0 12px;font-size:15px;line-height:1.55;">
                La inscripción ya está abierta:
                <a href="https://luma.com/1ubys1uc" style="color:#603ef9;">luma.com/1ubys1uc</a>.
                Te escribimos a <strong>${escapeHtml(opts.email)}</strong> si hay novedades.
              </p>
              <p style="margin:24px 0 0;font-size:13px;line-height:1.5;color:#7A6E92;">
                Equipo Xplora
              </p>
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
    .replace(/"/g, '&quot;');
}
