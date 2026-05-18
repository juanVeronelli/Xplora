import type { Page } from '../types';
import { PUBLIC_BOLSA_ENABLED } from '../config/publicFeatures';

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

/**
 * Ruta privada del portal de partners (similar a panel admin).
 * Configurá `VITE_PARTNER_PATH` en el build; si falta, default `/partner`.
 */
export function getPartnerPath(): string {
  const raw = (import.meta.env.VITE_PARTNER_PATH as string | undefined)?.trim();
  if (raw && raw.startsWith('/')) {
    const n = raw.replace(/\/+$/, '');
    return n.length ? n : '/partner';
  }
  return '/partner';
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
  if (p === '/bolsa') return PUBLIC_BOLSA_ENABLED ? 'bolsa' : 'home';
  if (p === getPartnerPath()) return 'partner';
  if (p === '/talento') return 'talento';
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
    case 'bolsa':
      return PUBLIC_BOLSA_ENABLED ? '/bolsa' : '/';
    case 'partner':
      return getPartnerPath();
    case 'talento':
      return '/talento';
    case 'admin':
      return getPanelPath();
    case 'evento-detail':
      return '/eventos';
    case 'charla-detail':
      return '/eventos';
    case 'empleo-detail':
      return PUBLIC_BOLSA_ENABLED ? '/bolsa' : '/';
    default:
      return '/';
  }
}
