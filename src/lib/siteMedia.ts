import type { CarouselSlide, DbSiteMedia, LogoBrand } from '../types';
import {
  DEFAULT_CAROUSEL,
  DEFAULT_CLUB_MODES,
  DEFAULT_COMPANY_BRANDS,
  DEFAULT_HERO_URL,
  DEFAULT_HIGHLIGHT_VIDEO_URL,
  DEFAULT_LOGO_URL,
  DEFAULT_SPONSOR_BRANDS,
} from './defaultsMedia';
import { authFetch, publicFetch } from './serverApi';

export interface ResolvedSiteMedia {
  heroUrl: string;
  logoUrl: string;
  /** Vacío = mostrar placeholder de video en la Home. */
  highlightVideoUrl: string;
  /** Vacío = no mostrar bloque Luma en /cuenta. */
  memberLumaEmbedSrc: string;
  carousel: CarouselSlide[];
  /** Las 4 fotos de El club (derivadas del carousel / defaults). */
  clubModes: CarouselSlide[];
  companies: LogoBrand[];
  sponsors: LogoBrand[];
}

/** Default del embed Luma en cuenta (override desde Ops → Web). */
export const DEFAULT_MEMBER_LUMA_EMBED_SRC =
  'https://luma.com/embed/event/evt-5XRVfMXFHYcRaLt/simple';

/** Acepta URL o HTML de iframe; solo luma.com / lu.ma por https. */
export function parseLumaEmbedInput(raw: string): string {
  const t = raw.trim();
  if (!t) return '';
  const fromIframe = t.match(/\bsrc\s*=\s*["']([^"']+)["']/i);
  const candidate = (fromIframe?.[1] || t).trim();
  return sanitizeLumaEmbedSrc(candidate);
}

export function sanitizeLumaEmbedSrc(url: string): string {
  try {
    const u = new URL(url);
    if (u.protocol !== 'https:') return '';
    const host = u.hostname.toLowerCase();
    if (host !== 'luma.com' && !host.endsWith('.luma.com') && host !== 'lu.ma' && !host.endsWith('.lu.ma')) {
      return '';
    }
    return u.toString();
  } catch {
    return '';
  }
}

function resolveMemberLumaEmbedSrc(row: DbSiteMedia | null): string {
  if (!row || row.member_luma_embed_src === undefined || row.member_luma_embed_src === null) {
    return DEFAULT_MEMBER_LUMA_EMBED_SRC;
  }
  const t = typeof row.member_luma_embed_src === 'string' ? row.member_luma_embed_src.trim() : '';
  if (t === '') return '';
  return sanitizeLumaEmbedSrc(t) || '';
}

function ensureSlideIds(slides: unknown): CarouselSlide[] {
  if (!Array.isArray(slides)) return [...DEFAULT_CAROUSEL];
  const out: CarouselSlide[] = [];
  for (const raw of slides) {
    if (!raw || typeof raw !== 'object') continue;
    const o = raw as Record<string, unknown>;
    const url = typeof o.url === 'string' ? o.url : '';
    const label = typeof o.label === 'string' ? o.label : 'Foto';
    let id = typeof o.id === 'string' ? o.id : '';
    if (!id) id = crypto.randomUUID();
    if (url) out.push({ id, url, label });
  }
  return out.length ? out : [...DEFAULT_CAROUSEL];
}

function ensureLogoBrands(raw: unknown, fallback: LogoBrand[]): LogoBrand[] {
  if (!Array.isArray(raw)) return [...fallback];
  const out: LogoBrand[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const o = item as Record<string, unknown>;
    const name = typeof o.name === 'string' ? o.name.trim() : '';
    const logoUrl =
      typeof o.logo_url === 'string'
        ? o.logo_url.trim()
        : typeof o.logoUrl === 'string'
          ? o.logoUrl.trim()
          : '';
    if (!name || !logoUrl) continue;
    let id = typeof o.id === 'string' ? o.id : '';
    if (!id) id = crypto.randomUUID();
    out.push({ id, name, logoUrl });
  }
  return out.length ? out : [...fallback];
}

function resolveHighlightVideoUrl(row: DbSiteMedia | null): string {
  const raw = row?.highlight_video_url;
  if (raw === null || raw === undefined) return DEFAULT_HIGHLIGHT_VIDEO_URL;
  const t = typeof raw === 'string' ? raw.trim() : '';
  if (t === '') return '';
  return t;
}

/** Resuelve exactamente 4 slides del club (por id `mode-*` o defaults). */
export function resolveClubModes(slides: CarouselSlide[]): CarouselSlide[] {
  return DEFAULT_CLUB_MODES.map((slot, i) => {
    const byId = slides.find((s) => s.id === slot.id);
    if (byId?.url) return { id: slot.id, label: slot.label, url: byId.url };
    // Compat: si el carousel viejo no tenía ids mode-*, usar por índice
    const byIndex = slides[i];
    if (byIndex?.url) return { id: slot.id, label: slot.label, url: byIndex.url };
    return { ...slot };
  });
}

export function mergeSiteMedia(row: DbSiteMedia | null): ResolvedSiteMedia {
  const carousel = ensureSlideIds(row?.carousel);
  return {
    heroUrl: row?.hero_url?.trim() || DEFAULT_HERO_URL,
    logoUrl: row?.logo_url?.trim() || DEFAULT_LOGO_URL,
    highlightVideoUrl: resolveHighlightVideoUrl(row),
    memberLumaEmbedSrc: resolveMemberLumaEmbedSrc(row),
    carousel,
    clubModes: resolveClubModes(carousel),
    companies: ensureLogoBrands(row?.company_logos, DEFAULT_COMPANY_BRANDS),
    sponsors: ensureLogoBrands(row?.sponsor_logos, DEFAULT_SPONSOR_BRANDS),
  };
}

export async function fetchSiteMediaRow(): Promise<DbSiteMedia | null> {
  const res = await publicFetch('/api/public/site-media');
  if (!res.ok) {
    console.warn('site_media:', res.status);
    return null;
  }
  const data = await res.json();
  if (!data) return null;
  return data as DbSiteMedia;
}

export async function saveSiteMedia(
  payload: ResolvedSiteMedia,
): Promise<{ error: { message: string } | null }> {
  const res = await authFetch('/api/admin/site-media', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      hero_url: payload.heroUrl,
      logo_url: payload.logoUrl,
      highlight_video_url: payload.highlightVideoUrl,
      member_luma_embed_src: payload.memberLumaEmbedSrc,
      carousel: payload.carousel,
      company_logos: payload.companies.map(c => ({
        id: c.id,
        name: c.name,
        logo_url: c.logoUrl,
      })),
      sponsor_logos: payload.sponsors.map(s => ({
        id: s.id,
        name: s.name,
        logo_url: s.logoUrl,
      })),
    }),
  });

  if (!res.ok) {
    const j = (await res.json().catch(() => ({}))) as { error?: string };
    let message = typeof j.error === 'string' ? j.error : 'No se pudo guardar.';
    if (/site_media|schema cache|company_logos|sponsor_logos|column|highlight_video|member_luma/i.test(message)) {
      message += ' La base todavía no está actualizada para guardar estos campos.';
    }
    return { error: { message } };
  }
  return { error: null };
}
