/**
 * Orígenes permitidos para CORS (sitio + Startup Day + preview local).
 */
import type { AppConfig } from '../config/env.js';

function originFromUrl(raw: string | null | undefined): string | null {
  if (!raw?.trim()) return null;
  try {
    return new URL(raw.trim()).origin;
  } catch {
    return null;
  }
}

export function buildAllowedCorsOrigins(config: AppConfig): Set<string> {
  const set = new Set<string>();
  const add = (o: string | null) => {
    if (o) set.add(o);
  };

  add(originFromUrl(config.publicSiteUrl));
  add('https://xploraucema.com');
  add('https://www.xploraucema.com');
  add('https://startupday.xploraucema.com');

  const extra = process.env.CORS_ALLOWED_ORIGINS || process.env.ALLOWED_ORIGINS || '';
  for (const part of extra.split(',')) {
    add(originFromUrl(part) || (part.trim().startsWith('http') ? part.trim() : null));
  }

  if (config.nodeEnv !== 'production') {
    add('http://localhost:5173');
    add('http://127.0.0.1:5173');
    add('http://localhost:4173');
    add('http://127.0.0.1:4173');
    add('http://localhost:8787');
  }

  return set;
}

export function isCorsOriginAllowed(origin: string, allowed: Set<string>): boolean {
  if (allowed.has(origin)) return true;
  // Preview deploys de este repo en Netlify
  try {
    const host = new URL(origin).hostname;
    if (host.endsWith('.netlify.app')) return true;
  } catch {
    /* ignore */
  }
  return false;
}
