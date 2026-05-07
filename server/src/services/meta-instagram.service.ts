import { BadRequestError } from '../http/errors/http-error.js';

type MetaConfig = {
  graphApiVersion: string;
  instagramUserId: string;
  accessToken: string;
};

type GraphPaging = { next?: string | null };

type GraphList<T> = {
  data?: T[];
  paging?: GraphPaging;
  error?: { message?: string };
};

export type InstagramReelRow = {
  id: string;
  timestamp: string;
  caption: string | null;
  permalink: string | null;
  thumbnail_url: string | null;
  like_count: number | null;
  comments_count: number | null;
  /** Algunos tokens/permisos devuelven `play_count` o campos similares; no garantizado. */
  play_count?: number | null;
};

function isoYear(ts: string | null | undefined): number | null {
  if (!ts) return null;
  const d = new Date(ts);
  const t = d.getTime();
  if (!Number.isFinite(t)) return null;
  return d.getUTCFullYear();
}

async function fetchGraphJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  const raw = await res.text();
  if (!res.ok) {
    throw new BadRequestError(`Meta Graph API error (${res.status}): ${raw.slice(0, 500)}`);
  }
  try {
    return JSON.parse(raw) as T;
  } catch {
    throw new BadRequestError(`Meta Graph API invalid JSON: ${raw.slice(0, 500)}`);
  }
}

function buildMediaUrl(cfg: MetaConfig): string {
  const base = `https://graph.facebook.com/${cfg.graphApiVersion}/${cfg.instagramUserId}/media`;
  const fields = [
    'id',
    'caption',
    'media_type',
    'media_product_type',
    'permalink',
    'timestamp',
    'like_count',
    'comments_count',
    'thumbnail_url',
    // Campos que pueden o no venir según permisos/versiones:
    'play_count',
  ].join(',');
  const u = new URL(base);
  u.searchParams.set('fields', fields);
  u.searchParams.set('limit', '100');
  u.searchParams.set('access_token', cfg.accessToken);
  return u.toString();
}

type GraphMediaItem = {
  id: string;
  caption?: string | null;
  media_type?: string | null;
  media_product_type?: string | null;
  permalink?: string | null;
  timestamp?: string | null;
  like_count?: number | null;
  comments_count?: number | null;
  thumbnail_url?: string | null;
  play_count?: number | null;
};

function isReel(m: GraphMediaItem): boolean {
  const t = (m.media_type ?? '').toUpperCase();
  const p = (m.media_product_type ?? '').toUpperCase();
  return t === 'REELS' || p === 'REELS';
}

/**
 * Devuelve reels del año solicitado.
 * Nota: si el token no tiene permisos para ciertos campos, algunos valores pueden venir null/undefined.
 */
export async function fetchInstagramReelsForYear(cfg: MetaConfig, year: number): Promise<InstagramReelRow[]> {
  if (!cfg.instagramUserId || !cfg.accessToken) throw new BadRequestError('Meta config incompleta (IG_USER_ID / ACCESS_TOKEN).');
  if (!Number.isFinite(year) || year < 2000 || year > 2200) throw new BadRequestError('Año inválido.');

  const out: InstagramReelRow[] = [];
  let nextUrl: string | null | undefined = buildMediaUrl(cfg);

  for (let guard = 0; guard < 200 && nextUrl; guard++) {
    const payload: GraphList<GraphMediaItem> = await fetchGraphJson(nextUrl);
    if (payload.error?.message) throw new BadRequestError(payload.error.message);

    const items = payload.data ?? [];
    for (const m of items) {
      if (!isReel(m)) continue;
      const y = isoYear(m.timestamp ?? null);
      if (y !== year) continue;
      out.push({
        id: m.id,
        timestamp: m.timestamp ?? '',
        caption: (m.caption ?? null) ? String(m.caption) : null,
        permalink: m.permalink ?? null,
        thumbnail_url: m.thumbnail_url ?? null,
        like_count: typeof m.like_count === 'number' ? m.like_count : null,
        comments_count: typeof m.comments_count === 'number' ? m.comments_count : null,
        play_count: typeof m.play_count === 'number' ? m.play_count : null,
      });
    }

    nextUrl = payload.paging?.next ?? null;
  }

  out.sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));
  return out;
}

