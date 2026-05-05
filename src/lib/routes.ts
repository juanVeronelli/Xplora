import type { Page } from '../types';

/** Ruta pública del panel (SPA). */
export const PANEL_PATH = '/panel';

/** Normaliza pathname para comparar rutas (sin slash final salvo `/`). */
export function normalizePath(pathname: string): string {
  const p = pathname.replace(/\/+$/, '');
  return p === '' ? '/' : p;
}

/** Devuelve la página según la URL actual. */
export function pathToPage(pathname: string): Page {
  const p = normalizePath(pathname);
  if (p === PANEL_PATH) return 'admin';
  if (p === '/') return 'home';
  if (p === '/somos-xplora') return 'somos';
  if (p === '/sponsors') return 'sponsors';
  if (p === '/eventos') return 'eventos';
  // El Archivo vive dentro de /eventos (tab «Archivo» / hash #archivo).
  if (p === '/charlas') return 'eventos';
  if (p === '/bolsa') return 'bolsa';
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
      return '/bolsa';
    case 'admin':
      return PANEL_PATH;
    case 'evento-detail':
      return '/eventos';
    case 'charla-detail':
      return '/eventos';
    case 'empleo-detail':
      return '/bolsa';
    default:
      return '/';
  }
}
