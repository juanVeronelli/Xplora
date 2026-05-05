/**
 * POST /api/auth/change-password — el usuario CRM cambia su propia contraseña (valida la actual).
 */
import type { RequestHandler } from 'express';
import type { AppConfig } from '../../config/env.js';
import {
  BadRequestError,
  ForbiddenError,
  InternalError,
  UnauthorizedError,
} from '../errors/http-error.js';
import { asyncHandler } from '../middleware/async-handler.js';
import {
  createAnonSupabase,
  createServiceSupabase,
  createUserSupabase,
} from '../../infra/supabase-clients.js';

function requireServiceSb(config: AppConfig) {
  const sb = createServiceSupabase(config);
  if (!sb) {
    throw new InternalError('Falta SUPABASE_SERVICE_ROLE_KEY en el servidor.');
  }
  return sb;
}

export function createAuthChangePasswordHandler(config: AppConfig): RequestHandler {
  return asyncHandler(async (req, res) => {
    const uid = req.authUser?.id;
    if (!uid) throw new UnauthorizedError('Sesión requerida.');

    const current = typeof req.body?.current_password === 'string' ? req.body.current_password : '';
    const nextPw = typeof req.body?.new_password === 'string' ? req.body.new_password : '';
    if (!current || !nextPw) {
      throw new BadRequestError('Contraseña actual y nueva son obligatorias.');
    }
    if (nextPw.length < 8) {
      throw new BadRequestError('La nueva contraseña debe tener al menos 8 caracteres.');
    }
    if (current === nextPw) {
      throw new BadRequestError('La nueva contraseña debe ser distinta a la actual.');
    }

    const sbUser = createUserSupabase(config, req.headers.authorization);
    const { data: udata, error: uerr } = await sbUser.auth.getUser();
    if (uerr || !udata.user?.email) {
      throw new BadRequestError('No se pudo leer tu email de sesión.');
    }
    const em = udata.user.email.trim().toLowerCase();

    const anon = createAnonSupabase(config);
    const { error: signErr } = await anon.auth.signInWithPassword({
      email: em,
      password: current,
    });
    if (signErr) {
      throw new ForbiddenError('La contraseña actual no es correcta.');
    }

    const svc = requireServiceSb(config);
    const { error: upErr } = await svc.auth.admin.updateUserById(uid, { password: nextPw });
    if (upErr) throw new BadRequestError(upErr.message);
    res.json({ ok: true });
  });
}
