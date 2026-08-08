/**
 * Landing aparte en el subdominio Startup Day.
 *
 * Producción: startupday.xploraucema.com
 * Preview local: http://localhost:5173/?startupday=1
 *
 * DNS / Netlify (una sola vez):
 * 1. Netlify → Domain management → Add domain alias: startupday.xploraucema.com
 * 2. DNS del dominio: CNAME `startupday` → el target que indique Netlify
 *    (suele ser algo como `<site>.netlify.app`)
 * 3. Esperar SSL (Let's Encrypt vía Netlify)
 */

const STARTUP_DAY_HOSTS = new Set([
  'startupday.xploraucema.com',
  'startupday.localhost',
]);

function normalizeHost(hostname: string): string {
  return hostname.toLowerCase().replace(/\.$/, '');
}

/** True cuando hay que servir la landing Startup Day en lugar del sitio principal. */
export function isStartupDayHost(hostname = window.location.hostname): boolean {
  const host = normalizeHost(hostname);
  if (STARTUP_DAY_HOSTS.has(host)) return true;

  // Preview en local / preview deploys sin DNS real
  try {
    const q = new URLSearchParams(window.location.search);
    if (q.get('startupday') === '1') return true;
  } catch {
    /* ignore */
  }

  return false;
}

export const STARTUP_DAY_CANONICAL = 'https://startupday.xploraucema.com/';
export const MAIN_SITE_URL = 'https://xploraucema.com/';

function isSameOriginPreviewHost(host: string): boolean {
  return (
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host.endsWith('.netlify.app') ||
    host.endsWith('.localhost')
  );
}

/** URL del funnel Startup Day (cross-host o `?startupday=1` en preview). */
export function startupDayUrl(): string {
  const host = normalizeHost(window.location.hostname);
  const { origin } = window.location;

  if (STARTUP_DAY_HOSTS.has(host)) return `${origin}/`;
  if (isSameOriginPreviewHost(host)) return `${origin}/?startupday=1`;
  return STARTUP_DAY_CANONICAL;
}

/** URL del sitio Xplora principal. */
export function mainSiteUrl(): string {
  const host = normalizeHost(window.location.hostname);
  const { origin } = window.location;

  if (host === 'startupday.xploraucema.com') return MAIN_SITE_URL;
  if (host === 'startupday.localhost') {
    const port = window.location.port ? `:${window.location.port}` : '';
    return `${window.location.protocol}//localhost${port}/`;
  }
  // Preview con ?startupday=1 u origen principal
  return `${origin}/`;
}
