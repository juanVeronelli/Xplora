import type { RequestHandler } from 'express';
import type { AppConfig } from '../../config/env.js';
import { createServiceSupabase, createUserSupabase } from '../../infra/supabase-clients.js';
import { BadRequestError, InternalError } from '../errors/http-error.js';
import { asyncHandler } from '../middleware/async-handler.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type UsuarioRow = {
  id: string;
  nombre: string | null;
  email: string | null;
  carrera: string | null;
  es_alumno_cema: boolean | null;
};

/**
 * GET /api/talent/bootstrap
 * Devuelve:
 * - si el usuario (email) existe en `usuarios`
 * - si tiene `talent_profiles`
 * - y si requiere onboarding (no existe en `usuarios`)
 */
export function createTalentBootstrapHandler(config: AppConfig): RequestHandler {
  return asyncHandler(async (req, res) => {
    const emailRaw = (req.authUser?.email ?? '').trim().toLowerCase();
    if (!emailRaw || !EMAIL_RE.test(emailRaw)) throw new BadRequestError('Email inválido en sesión.');

    const sbService = createServiceSupabase(config);
    if (!sbService) {
      throw new InternalError('Falta SUPABASE_SERVICE_ROLE_KEY para bootstrap de talento.');
    }

    const { data: member, error: memErr } = await sbService
      .from('usuarios')
      .select('id, nombre, email, carrera, es_alumno_cema')
      .eq('email', emailRaw)
      .maybeSingle();
    if (memErr) throw new BadRequestError(memErr.message);

    // Talent profile se lee con el JWT del user (RLS: own profile).
    const sbUser = createUserSupabase(config, req.headers.authorization);
    const { data: tprofile, error: tErr } = await sbUser
      .from('talent_profiles')
      .select('*')
      .eq('user_id', req.authUser!.id)
      .maybeSingle();
    if (tErr) throw new BadRequestError(tErr.message);

    res.json({
      email: emailRaw,
      member: (member as UsuarioRow | null) ?? null,
      talent_profile: tprofile ?? null,
      needs_onboarding: !member,
    });
  });
}

type OnboardPayload = {
  nombre: string;
  carrera: string;
  es_alumno_cema: boolean;
  // Talent extras
  phone?: string;
  graduation_year?: string;
  linkedin_url?: string;
  portfolio_url?: string;
  cv_url?: string;
  about?: string;
  full_name?: string;
};

/**
 * POST /api/talent/onboard
 * Crea (si falta) `usuarios` y upsert de `talent_profiles`.
 * Requiere sesión (magic link) y usa service role para escribir en `usuarios`.
 */
export function createTalentOnboardHandler(config: AppConfig): RequestHandler {
  return asyncHandler(async (req, res) => {
    const emailRaw = (req.authUser?.email ?? '').trim().toLowerCase();
    if (!emailRaw || !EMAIL_RE.test(emailRaw)) throw new BadRequestError('Email inválido en sesión.');

    const sbService = createServiceSupabase(config);
    if (!sbService) {
      throw new InternalError('Falta SUPABASE_SERVICE_ROLE_KEY para onboarding de talento.');
    }

    const body = (req.body ?? {}) as Partial<OnboardPayload>;
    const nombre = typeof body.nombre === 'string' ? body.nombre.trim() : '';
    const carrera = typeof body.carrera === 'string' ? body.carrera.trim() : '';
    const es_alumno_cema = Boolean(body.es_alumno_cema);

    if (!nombre) throw new BadRequestError('Completá tu nombre.');
    if (!carrera) throw new BadRequestError('Completá tu carrera.');

    // 1) Ensure member row in usuarios (upsert por email).
    const memberRow = {
      nombre,
      email: emailRaw,
      carrera,
      es_alumno_cema,
    };
    const { data: member, error: upErr } = await sbService
      .from('usuarios')
      .upsert(memberRow, { onConflict: 'email' })
      .select('id, nombre, email, carrera, es_alumno_cema')
      .single();
    if (upErr) throw new BadRequestError(upErr.message);

    // 2) Upsert talent profile (RLS: own profile; usamos user JWT).
    const sbUser = createUserSupabase(config, req.headers.authorization);
    const fullName = (typeof body.full_name === 'string' ? body.full_name.trim() : '') || nombre;
    const payload = {
      user_id: req.authUser!.id,
      email: emailRaw,
      full_name: fullName,
      phone: typeof body.phone === 'string' ? body.phone.trim() : '',
      career: carrera,
      graduation_year: typeof body.graduation_year === 'string' ? body.graduation_year.trim() : '',
      linkedin_url: typeof body.linkedin_url === 'string' ? body.linkedin_url.trim() : '',
      portfolio_url: typeof body.portfolio_url === 'string' ? body.portfolio_url.trim() : '',
      cv_url: typeof body.cv_url === 'string' ? body.cv_url.trim() : '',
      about: typeof body.about === 'string' ? body.about.trim() : '',
      updated_at: new Date().toISOString(),
    };

    const { data: tprofile, error: tErr } = await sbUser.from('talent_profiles').upsert(payload).select('*').single();
    if (tErr) throw new BadRequestError(tErr.message);

    res.status(201).json({ member, talent_profile: tprofile });
  });
}

