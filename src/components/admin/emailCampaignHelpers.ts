/** Origen público del sitio (CTA en plantillas de email). */
export function emailSiteOrigin(): string {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin.replace(/\/$/, '');
  }
  const fromEnv = (import.meta.env.VITE_SITE_URL as string | undefined)?.trim();
  return fromEnv?.replace(/\/$/, '') ?? '';
}
