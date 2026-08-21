import type { Page } from '../types';

/**
 * Ruta del panel CRM (solo SPA). Configurá `VITE_PANEL_PATH` en el build (ej. Netlify)
 * con un segmento difícil de adivinar; si no está definido, en desarrollo suele ser `/panel`.
 * La seguridad real sigue siendo Supabase Auth + permisos CRM; esto reduce el descubrimiento casual.
 */
export function getPanelPath(): string {
  const raw = (import.meta.env.VITE_PANEL_PATH as string | undefined)?.trim();
  if (raw && raw.startsWith('/')) {
    const n = raw.replace(/\/+$/, '');
    return n.length ? n : '/panel';
  }
  return '/panel';
}

/** Normaliza pathname para comparar rutas (sin slash final salvo `/`). */
export function normalizePath(pathname: string): string {
  const p = pathname.replace(/\/+$/, '');
  return p === '' ? '/' : p;
}

/** Devuelve la página según la URL actual. */
export function pathToPage(pathname: string): Page {
  const p = normalizePath(pathname);
  if (p === getPanelPath()) return 'admin';
  if (p === '/') return 'home';
  if (p === '/somos-xplora') return 'somos';
  if (p === '/sponsors') return 'sponsors';
  if (p === '/eventos') return 'eventos';
  // El Archivo vive dentro de /eventos (tab «Archivo» / hash #archivo).
  if (p === '/charlas') return 'eventos';
  if (p === '/cuenta/confirmar') return 'cuenta-confirm';
  if (p === '/cuenta') return 'cuenta';
  if (p === '/empleo' || p === '/bolsa') return 'empleo';
  return 'home';
}

/** Path que debe mostrarse en la barra de direcciones para cada página. */
export function pageToPath(page: Page): string {
  switch (page) {
    case 'home':
      return '/';
    case 'somos':
      return '/somos-xplora';
    case 'sponsors':
      return '/sponsors';
    case 'eventos':
      return '/eventos';
    // El Archivo vive dentro de /eventos (tab «Archivo» / hash #archivo).
    case 'charlas':
      return '/eventos';
    case 'admin':
      return getPanelPath();
    case 'evento-detail':
      return '/eventos';
    case 'charla-detail':
      return '/eventos';
    case 'cuenta':
      return '/cuenta';
    case 'cuenta-confirm':
      return '/cuenta/confirmar';
    case 'empleo':
      return '/empleo';
    default:
      return '/';
  }
}
