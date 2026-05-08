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

type InsightsValue = { value?: number | null };
type GraphInsightsItem = {
  name?: string | null;
  values?: InsightsValue[];
  total_value?: { value?: number | null } | null;
};
type GraphInsightsResponse = {
  data?: GraphInsightsItem[];
  error?: { message?: string };
};

export type InstagramReelInsights = {
  reach: number | null;
  views: number | null;
  likes: number | null;
  comments: number | null;
  shares: number | null;
  saved: number | null;
  reposts: number | null;
  total_interactions: number | null;
  /** seconds */
  ig_reels_avg_watch_time: number | null;
  /** seconds */
  ig_reels_video_view_total_time: number | null;
  /** percentage 0..1 */
  reels_skip_rate: number | null;
  /** only for crossposted media; can be null */
  facebook_views: number | null;
  /** only for crossposted media; can be null */
  crossposted_views: number | null;
};

export type InstagramReelAnalyticsRow = InstagramReelRow & { insights: InstagramReelInsights };

export type InstagramReelsAnalyticsResponse = {
  generated_at: string;
  year: number;
  reels: InstagramReelAnalyticsRow[];
  totals: InstagramReelInsights & {
    reels_count: number;
    avg_reach: number | null;
    avg_views: number | null;
    avg_watch_time_s: number | null;
  };
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

function buildInsightsUrl(cfg: MetaConfig, mediaId: string, metrics: string[]): string {
  const base = `https://graph.facebook.com/${cfg.graphApiVersion}/${mediaId}/insights`;
  const u = new URL(base);
  u.searchParams.set('metric', metrics.join(','));
  u.searchParams.set('access_token', cfg.accessToken);
  return u.toString();
}

function normalizeNumber(v: unknown): number | null {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function metricValue(item: GraphInsightsItem): number | null {
  const v = item?.values?.[0]?.value;
  return normalizeNumber(v ?? item?.total_value?.value ?? null);
}

function emptyInsights(): InstagramReelInsights {
  return {
    reach: null,
    views: null,
    likes: null,
    comments: null,
    shares: null,
    saved: null,
    reposts: null,
    total_interactions: null,
    ig_reels_avg_watch_time: null,
    ig_reels_video_view_total_time: null,
    reels_skip_rate: null,
    facebook_views: null,
    crossposted_views: null,
  };
}

async function fetchInstagramReelInsights(cfg: MetaConfig, mediaId: string): Promise<InstagramReelInsights> {
  const coreMetrics = [
    'reach',
    'views',
    'likes',
    'comments',
    'shares',
    'saved',
    'reposts',
    'total_interactions',
    'ig_reels_avg_watch_time',
    'ig_reels_video_view_total_time',
    'reels_skip_rate',
  ];

  const out = emptyInsights();
  const coreUrl = buildInsightsUrl(cfg, mediaId, coreMetrics);
  const payload: GraphInsightsResponse = await fetchGraphJson(coreUrl);
  if (payload.error?.message) throw new BadRequestError(payload.error.message);
  for (const it of payload.data ?? []) {
    const name = String(it?.name ?? '').trim();
    if (!name) continue;
    const v = metricValue(it);
    // keep strongly-typed shape but map dynamically from API response
    (out as Record<string, unknown>)[name] = v;
  }

  // Optional metrics can throw if the media isn't crossposted to Facebook.
  try {
    const extraUrl = buildInsightsUrl(cfg, mediaId, ['facebook_views', 'crossposted_views']);
    const extra: GraphInsightsResponse = await fetchGraphJson(extraUrl);
    for (const it of extra.data ?? []) {
      const name = String(it?.name ?? '').trim();
      if (!name) continue;
      const v = metricValue(it);
      (out as Record<string, unknown>)[name] = v;
    }
  } catch {
    // ignore
  }

  return out;
}

async function mapPool<TIn, TOut>(
  items: TIn[],
  concurrency: number,
  fn: (item: TIn, idx: number) => Promise<TOut>,
): Promise<TOut[]> {
  const out: TOut[] = new Array(items.length);
  let next = 0;
  const workers = new Array(Math.max(1, Math.min(concurrency, items.length))).fill(0).map(async () => {
    for (;;) {
      const i = next++;
      if (i >= items.length) break;
      out[i] = await fn(items[i], i);
    }
  });
  await Promise.all(workers);
  return out;
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

export async function fetchInstagramReelsAnalyticsForYear(cfg: MetaConfig, year: number): Promise<InstagramReelsAnalyticsResponse> {
  const reels = await fetchInstagramReelsForYear(cfg, year);

  const reelsWithInsights = await mapPool(reels, 6, async (r) => {
    const insights = await fetchInstagramReelInsights(cfg, r.id);
    return { ...r, insights };
  });

  const sum = (xs: Array<number | null | undefined>): number | null => {
    let has = false;
    let acc = 0;
    for (const v of xs) {
      if (typeof v === 'number' && Number.isFinite(v)) {
        has = true;
        acc += v;
      }
    }
    return has ? acc : null;
  };

  const reels_count = reelsWithInsights.length;
  const totals: InstagramReelsAnalyticsResponse['totals'] = {
    reels_count,
    reach: sum(reelsWithInsights.map((r) => r.insights.reach)),
    views: sum(reelsWithInsights.map((r) => r.insights.views)),
    likes: sum(reelsWithInsights.map((r) => r.insights.likes)),
    comments: sum(reelsWithInsights.map((r) => r.insights.comments)),
    shares: sum(reelsWithInsights.map((r) => r.insights.shares)),
    saved: sum(reelsWithInsights.map((r) => r.insights.saved)),
    reposts: sum(reelsWithInsights.map((r) => r.insights.reposts)),
    total_interactions: sum(reelsWithInsights.map((r) => r.insights.total_interactions)),
    ig_reels_avg_watch_time: null, // average below (not sum)
    ig_reels_video_view_total_time: sum(reelsWithInsights.map((r) => r.insights.ig_reels_video_view_total_time)),
    reels_skip_rate: null, // average below (not sum)
    facebook_views: sum(reelsWithInsights.map((r) => r.insights.facebook_views)),
    crossposted_views: sum(reelsWithInsights.map((r) => r.insights.crossposted_views)),
    avg_reach: null,
    avg_views: null,
    avg_watch_time_s: null,
  };

  const avgFromTotals = (numerator: number | null, denom: number): number | null => {
    if (numerator == null || !Number.isFinite(numerator) || denom <= 0) return null;
    return numerator / denom;
  };

  totals.avg_reach = avgFromTotals(totals.reach, reels_count);
  totals.avg_views = avgFromTotals(totals.views, reels_count);

  const avg = (vals: Array<number | null>): number | null => {
    const ns = vals.filter((v): v is number => typeof v === 'number' && Number.isFinite(v));
    if (ns.length === 0) return null;
    const s = ns.reduce((a, b) => a + b, 0);
    return s / ns.length;
  };

  totals.avg_watch_time_s = avg(reelsWithInsights.map((r) => r.insights.ig_reels_avg_watch_time));
  totals.reels_skip_rate = avg(reelsWithInsights.map((r) => r.insights.reels_skip_rate));

  return {
    generated_at: new Date().toISOString(),
    year,
    reels: reelsWithInsights,
    totals,
  };
}

