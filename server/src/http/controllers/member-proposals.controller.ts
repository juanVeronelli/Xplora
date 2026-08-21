/**
 * Propuestas / feedback de miembros.
 */
import type { RequestHandler } from 'express';
import type { AppConfig } from '../../config/env.js';
import { createServiceSupabase } from '../../infra/supabase-clients.js';
import { BadRequestError, InternalError, UnauthorizedError } from '../errors/http-error.js';
import { asyncHandler } from '../middleware/async-handler.js';

const KINDS = new Set(['feedback', 'event_idea', 'topic', 'other']);

function clean(v: unknown, max: number): string {
  if (typeof v !== 'string') return '';
  return v.trim().slice(0, max);
}

/** POST /api/member/proposals */
export function createMemberProposalCreateHandler(config: AppConfig): RequestHandler {
  return asyncHandler(async (req, res) => {
    const auth = req.memberAuth;
    if (!auth) throw new UnauthorizedError('Iniciá sesión.');
    const sb = createServiceSupabase(config);
    if (!sb) throw new InternalError('Base de datos no configurada.');

    const body = req.body as Record<string, unknown>;
    const kind = clean(body.kind, 32);
    const title = clean(body.title, 160);
    const text = clean(body.body, 4000);

    if (!KINDS.has(kind)) {
      throw new BadRequestError('Elegí un tipo de propuesta válido.');
    }
    if (title.length < 3) throw new BadRequestError('El título es muy corto.');
    if (text.length < 10) throw new BadRequestError('Contanos un poco más (mín. 10 caracteres).');

    const { data, error } = await sb
      .from('member_proposals')
      .insert({
        member_account_id: auth.accountId,
        email: auth.email,
        kind,
        title,
        body: text,
      })
      .select('id, kind, title, body, created_at')
      .single();

    if (error) {
      if (error.code === 'PGRST205' || /member_proposals/i.test(error.message)) {
        throw new InternalError(
          'Falta la tabla member_proposals. Ejecutá supabase-setup-member-proposals.sql en Supabase.',
        );
      }
      throw new BadRequestError(error.message);
    }

    res.status(201).json({ proposal: data });
  });
}

/** GET /api/member/proposals — listado propio */
export function createMemberProposalListHandler(config: AppConfig): RequestHandler {
  return asyncHandler(async (req, res) => {
    const auth = req.memberAuth;
    if (!auth) throw new UnauthorizedError('Iniciá sesión.');
    const sb = createServiceSupabase(config);
    if (!sb) throw new InternalError('Base de datos no configurada.');

    const { data, error } = await sb
      .from('member_proposals')
      .select('id, kind, title, body, created_at')
      .eq('member_account_id', auth.accountId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      if (error.code === 'PGRST205' || /member_proposals/i.test(error.message)) {
        res.json({ proposals: [] });
        return;
      }
      throw new InternalError(error.message);
    }

    res.json({ proposals: data ?? [] });
  });
}
