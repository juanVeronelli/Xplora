import type { RequestHandler } from 'express';
import type { AppConfig } from '../../config/env.js';
import { createServiceSupabase } from '../../infra/supabase-clients.js';
import {
  findMemberByEmail,
  linkOrCreateUsuario,
  toPublicProfile,
} from '../../services/member-accounts.service.js';
import {
  createConfirmToken,
  createLoginCode,
  hashSecret,
  signMemberAccessToken,
} from '../../services/member-jwt.service.js';
import {
  sendMemberLoginCodeEmail,
  sendMemberRegisterConfirmEmail,
} from '../../services/member-auth-email.service.js';
import { BadRequestError, InternalError, UnauthorizedError } from '../errors/http-error.js';
import { asyncHandler } from '../middleware/async-handler.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const REGISTER_TTL_MS = 24 * 60 * 60 * 1000;
const LOGIN_TTL_MS = 10 * 60 * 1000;
const LOGIN_RESEND_COOLDOWN_MS = 2 * 60 * 1000;

function normalizeEmail(raw: unknown): string {
  const email = typeof raw === 'string' ? raw.trim().toLowerCase() : '';
  if (!email || !EMAIL_RE.test(email) || email.length > 240) {
    throw new BadRequestError('Email inválido.');
  }
  return email;
}

function requireResendAndJwt(config: AppConfig): {
  secret: string;
} {
  if (!config.resend) throw new InternalError('El envío de emails no está configurado (RESEND_API_KEY).');
  if (!config.memberJwtSecret) {
    throw new InternalError('MEMBER_JWT_SECRET no está configurado en el servidor.');
  }
  return { secret: config.memberJwtSecret };
}

/** POST /api/member/register — pide confirmación por email (botón Confirmar). */
export function createMemberRegisterHandler(config: AppConfig): RequestHandler {
  return asyncHandler(async (req, res) => {
    requireResendAndJwt(config);
    const sb = createServiceSupabase(config);
    if (!sb) throw new InternalError('Base de datos no configurada (service role).');

    const email = normalizeEmail((req.body as { email?: unknown }).email);
    const existing = await findMemberByEmail(sb, email);
    if (existing?.email_confirmed_at) {
      throw new BadRequestError('Ese email ya tiene cuenta. Pedí un código para entrar.');
    }

    if (!existing) {
      const { error } = await sb.from('member_accounts').insert({ email });
      if (error) {
        if (error.code === 'PGRST205' || /member_accounts/i.test(error.message)) {
          throw new InternalError(
            'Faltan tablas de miembros en Supabase. Ejecutá supabase-setup-member-accounts.sql.',
          );
        }
        throw new BadRequestError(error.message);
      }
    }

    const token = createConfirmToken();
    const expiresAt = new Date(Date.now() + REGISTER_TTL_MS).toISOString();
    const { error: chErr } = await sb.from('member_auth_challenges').insert({
      email,
      purpose: 'register_confirm',
      token_hash: hashSecret(token),
      expires_at: expiresAt,
    });
    if (chErr) throw new InternalError(chErr.message);

    const confirmUrl = `${config.publicSiteUrl.replace(/\/$/, '')}/cuenta/confirmar?token=${encodeURIComponent(token)}`;
    const mailErr = await sendMemberRegisterConfirmEmail(config, { to: email, confirmUrl });
    if (mailErr) {
      console.warn('[member/register] email:', mailErr);
      throw new InternalError('No pudimos enviar el email de confirmación. Probá de nuevo.');
    }

    res.json({ ok: true, message: 'Te enviamos un email para confirmar tu cuenta.' });
  });
}

/** POST /api/member/confirm — activa la cuenta con el token del mail. */
export function createMemberConfirmHandler(config: AppConfig): RequestHandler {
  return asyncHandler(async (req, res) => {
    const { secret } = requireResendAndJwt(config);
    const sb = createServiceSupabase(config);
    if (!sb) throw new InternalError('Base de datos no configurada (service role).');

    const token = typeof (req.body as { token?: unknown }).token === 'string'
      ? (req.body as { token: string }).token.trim()
      : '';
    if (!token) throw new BadRequestError('Falta el token de confirmación.');

    const tokenHash = hashSecret(token);
    const { data: challenge, error } = await sb
      .from('member_auth_challenges')
      .select('*')
      .eq('purpose', 'register_confirm')
      .eq('token_hash', tokenHash)
      .is('consumed_at', null)
      .maybeSingle();
    if (error) throw new InternalError(error.message);
    if (!challenge) throw new BadRequestError('Link inválido o ya usado.');
    if (new Date(challenge.expires_at as string).getTime() < Date.now()) {
      throw new BadRequestError('El link de confirmación venció. Registrate de nuevo.');
    }

    const email = String(challenge.email).toLowerCase();
    const now = new Date().toISOString();

    let account = await findMemberByEmail(sb, email);
    if (!account) {
      const { data: created, error: insErr } = await sb
        .from('member_accounts')
        .insert({ email, email_confirmed_at: now })
        .select('*')
        .single();
      if (insErr || !created) throw new InternalError(insErr?.message || 'No se pudo crear la cuenta.');
      account = created as typeof account;
    } else if (!account.email_confirmed_at) {
      const { data: updated, error: upErr } = await sb
        .from('member_accounts')
        .update({ email_confirmed_at: now, updated_at: now })
        .eq('id', account.id)
        .select('*')
        .single();
      if (upErr || !updated) throw new InternalError(upErr?.message || 'No se pudo confirmar.');
      account = updated as typeof account;
    }

    await sb
      .from('member_auth_challenges')
      .update({ consumed_at: now })
      .eq('id', challenge.id);

    if (account) await linkOrCreateUsuario(sb, account);
    const fresh = account ? await findMemberByEmail(sb, email) : null;
    if (!fresh) throw new InternalError('Cuenta no encontrada tras confirmar.');

    const accessToken = await signMemberAccessToken(secret, { id: fresh.id, email: fresh.email });
    res.json({ accessToken, account: toPublicProfile(fresh) });
  });
}

/** POST /api/member/login/request — envía código de 5 dígitos (solo cuenta confirmada). */
export function createMemberLoginRequestHandler(config: AppConfig): RequestHandler {
  return asyncHandler(async (req, res) => {
    requireResendAndJwt(config);
    const sb = createServiceSupabase(config);
    if (!sb) throw new InternalError('Base de datos no configurada (service role).');

    const email = normalizeEmail((req.body as { email?: unknown }).email);
    const account = await findMemberByEmail(sb, email);
    if (!account) {
      throw new BadRequestError('No hay una cuenta con ese email. Creá una primero.');
    }
    if (!account.email_confirmed_at) {
      throw new BadRequestError(
        'Ese email todavía no está confirmado. Revisá tu correo o registrate de nuevo.',
      );
    }

    const { data: recent } = await sb
      .from('member_auth_challenges')
      .select('created_at')
      .eq('email', email)
      .eq('purpose', 'login_code')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (recent?.created_at) {
      const elapsed = Date.now() - new Date(recent.created_at as string).getTime();
      if (elapsed < LOGIN_RESEND_COOLDOWN_MS) {
        const waitSec = Math.ceil((LOGIN_RESEND_COOLDOWN_MS - elapsed) / 1000);
        throw new BadRequestError(`Esperá ${waitSec}s antes de pedir otro código.`);
      }
    }

    const code = createLoginCode();
    const expiresAt = new Date(Date.now() + LOGIN_TTL_MS).toISOString();
    const { error: chErr } = await sb.from('member_auth_challenges').insert({
      email,
      purpose: 'login_code',
      token_hash: hashSecret(`${email}:${code}`),
      expires_at: expiresAt,
    });
    if (chErr) throw new InternalError(chErr.message);

    const mailErr = await sendMemberLoginCodeEmail(config, { to: email, code });
    if (mailErr) {
      console.warn('[member/login] email:', mailErr);
      throw new InternalError('No pudimos enviar el código. Probá de nuevo.');
    }

    res.json({
      ok: true,
      message: 'Te enviamos un código a tu email.',
      resendAfterSec: Math.floor(LOGIN_RESEND_COOLDOWN_MS / 1000),
    });
  });
}

/** POST /api/member/login/verify — valida código y emite JWT. */
export function createMemberLoginVerifyHandler(config: AppConfig): RequestHandler {
  return asyncHandler(async (req, res) => {
    const { secret } = requireResendAndJwt(config);
    const sb = createServiceSupabase(config);
    if (!sb) throw new InternalError('Base de datos no configurada (service role).');

    const body = req.body as { email?: unknown; code?: unknown };
    const email = normalizeEmail(body.email);
    const code = typeof body.code === 'string' ? body.code.trim().replace(/\s+/g, '') : '';
    if (!/^\d{5}$/.test(code)) throw new BadRequestError('Código inválido. Debe tener 5 dígitos.');

    const { data: challenge, error } = await sb
      .from('member_auth_challenges')
      .select('*')
      .eq('email', email)
      .eq('purpose', 'login_code')
      .eq('token_hash', hashSecret(`${email}:${code}`))
      .is('consumed_at', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw new InternalError(error.message);
    if (!challenge) throw new UnauthorizedError('Código incorrecto o vencido.');
    if (new Date(challenge.expires_at as string).getTime() < Date.now()) {
      throw new UnauthorizedError('El código venció. Pedí uno nuevo.');
    }

    const account = await findMemberByEmail(sb, email);
    if (!account?.email_confirmed_at) throw new UnauthorizedError('Cuenta no confirmada.');

    const now = new Date().toISOString();
    await sb.from('member_auth_challenges').update({ consumed_at: now }).eq('id', challenge.id);
    await linkOrCreateUsuario(sb, account);

    const fresh = (await findMemberByEmail(sb, email)) ?? account;
    const accessToken = await signMemberAccessToken(secret, { id: fresh.id, email: fresh.email });
    res.json({ accessToken, account: toPublicProfile(fresh) });
  });
}
