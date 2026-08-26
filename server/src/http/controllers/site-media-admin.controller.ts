import { randomUUID } from 'node:crypto';
import type { RequestHandler } from 'express';
import type { AppConfig } from '../../config/env.js';
import { createServiceSupabase, createUserSupabase } from '../../infra/supabase-clients.js';
import { BadRequestError } from '../errors/http-error.js';
import { asyncHandler } from '../middleware/async-handler.js';

function normalizeLogoJson(arr: unknown): { id: string; name: string; logo_url: string }[] {
  if (!Array.isArray(arr)) return [];
  const out: { id: string; name: string; logo_url: string }[] = [];
  for (const item of arr) {
    if (!item || typeof item !== 'object') continue;
    const o = item as Record<string, unknown>;
    const name = typeof o.name === 'string' ? o.name.trim() : '';
    const logo_url =
      typeof o.logo_url === 'string'
        ? o.logo_url.trim()
        : typeof o.logoUrl === 'string'
          ? o.logoUrl.trim()
          : '';
    if (!name || !logo_url) continue;
    const id = typeof o.id === 'string' && o.id.trim() ? o.id.trim() : randomUUID();
    out.push({ id, name, logo_url });
  }
  return out;
}

export function createSiteMediaUpsertHandler(config: AppConfig): RequestHandler {
  return asyncHandler(async (req, res) => {
    const hero = req.body?.hero_url;
    const logo = req.body?.logo_url;
    const highlightRaw = req.body?.highlight_video_url;
    const highlight_video_url = typeof highlightRaw === 'string' ? highlightRaw : '';
    const lumaRaw = req.body?.member_luma_embed_src;
    const member_luma_embed_src = typeof lumaRaw === 'string' ? lumaRaw.trim() : '';
    if (member_luma_embed_src) {
      try {
        const u = new URL(member_luma_embed_src);
        if (u.protocol !== 'https:') {
          throw new BadRequestError('El embed de Luma debe ser https.');
        }
        const host = u.hostname.toLowerCase();
        if (
          host !== 'luma.com' &&
          !host.endsWith('.luma.com') &&
          host !== 'lu.ma' &&
          !host.endsWith('.lu.ma')
        ) {
          throw new BadRequestError('Solo se permiten embeds de luma.com / lu.ma.');
        }
      } catch (e) {
        if (e instanceof BadRequestError) throw e;
        throw new BadRequestError('URL de embed Luma inválida.');
      }
    }
    const carousel = req.body?.carousel;
    const company_logos = req.body?.company_logos;
    const sponsor_logos = req.body?.sponsor_logos;
    if (typeof hero !== 'string' || typeof logo !== 'string' || !Array.isArray(carousel)) {
      throw new BadRequestError('hero_url, logo_url y carousel son obligatorios.');
    }
    if (!Array.isArray(company_logos) || !Array.isArray(sponsor_logos)) {
      throw new BadRequestError('company_logos y sponsor_logos deben ser arrays (podés mandar []).');
    }

    const service = createServiceSupabase(config);
    const sb = service ?? createUserSupabase(config, req.headers.authorization);
    const payload = {
      id: 'main',
      hero_url: hero,
      logo_url: logo,
      highlight_video_url,
      member_luma_embed_src,
      carousel,
      company_logos: normalizeLogoJson(company_logos),
      sponsor_logos: normalizeLogoJson(sponsor_logos),
      updated_at: new Date().toISOString(),
    };
    const { error } = await sb.from('site_media').upsert(payload, { onConflict: 'id' });
    if (error) {
      const msg = error.message;
      const hint = /site_media|schema cache|member_luma/i.test(msg)
        ? ' Creá/actualizá la tabla: ejecutá supabase-setup-member-luma-embed.sql en Supabase SQL.'
        : '';
      throw new BadRequestError(msg + hint);
    }
    res.status(204).send();
  });
}
