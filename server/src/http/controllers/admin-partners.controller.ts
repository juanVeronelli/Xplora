import type { RequestHandler } from 'express';
import type { AppConfig } from '../../config/env.js';
import { createServiceSupabase } from '../../infra/supabase-clients.js';
import { BadRequestError, InternalError } from '../errors/http-error.js';
import { asyncHandler } from '../middleware/async-handler.js';

function requireServiceSb(config: AppConfig) {
  const sb = createServiceSupabase(config);
  if (!sb) {
    throw new InternalError('Falta SUPABASE_SERVICE_ROLE_KEY para gestionar partners.');
  }
  return sb;
}

export function createAdminPartnerCompaniesListHandler(config: AppConfig): RequestHandler {
  return asyncHandler(async (_req, res) => {
    const sb = requireServiceSb(config);
    const { data, error } = await sb.from('partner_companies').select('*').order('created_at', { ascending: false });
    if (error) throw new BadRequestError(error.message);
    res.json({ rows: data ?? [] });
  });
}

export function createAdminPartnerCompanyCreateHandler(config: AppConfig): RequestHandler {
  return asyncHandler(async (req, res) => {
    const sb = requireServiceSb(config);
    const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
    const domain = typeof req.body?.domain === 'string' ? req.body.domain.trim() : '';
    const logo_url = typeof req.body?.logo_url === 'string' ? req.body.logo_url.trim() : '';
    if (!name) throw new BadRequestError('Nombre de empresa obligatorio.');
    const { data, error } = await sb.from('partner_companies').insert({ name, domain, logo_url }).select('*').single();
    if (error) throw new BadRequestError(error.message);
    res.status(201).json(data);
  });
}

export function createAdminPartnerUserCreateHandler(config: AppConfig): RequestHandler {
  return asyncHandler(async (req, res) => {
    const sb = requireServiceSb(config);
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const passwordRaw = typeof req.body?.password === 'string' ? req.body.password : '';
    const company_id = typeof req.body?.company_id === 'string' ? req.body.company_id.trim() : '';
    if (!email) throw new BadRequestError('Email obligatorio.');
    if (!company_id) throw new BadRequestError('company_id obligatorio.');
    const defaultPw = process.env.PARTNER_DEFAULT_TEMP_PASSWORD?.trim() || 'Xplora.2026';
    const password = passwordRaw.trim().length >= 8 ? passwordRaw : defaultPw;

    const { data: created, error: cErr } = await sb.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (cErr || !created.user) throw new BadRequestError(cErr?.message || 'No se pudo crear el usuario en Auth.');

    const { error: linkErr } = await sb.from('partner_users').insert({
      user_id: created.user.id,
      company_id,
    });
    if (linkErr) {
      await sb.auth.admin.deleteUser(created.user.id);
      throw new BadRequestError(linkErr.message);
    }

    res.status(201).json({
      user_id: created.user.id,
      email,
      company_id,
      temporary_password: passwordRaw.trim().length >= 8 ? undefined : password,
    });
  });
}

export function createAdminPartnerUsersListHandler(config: AppConfig): RequestHandler {
  return asyncHandler(async (req, res) => {
    const sb = requireServiceSb(config);
    const company_id = typeof req.query?.company_id === 'string' ? req.query.company_id.trim() : '';
    if (!company_id) throw new BadRequestError('company_id obligatorio.');
    const { data, error } = await sb.from('partner_users').select('user_id, company_id, created_at').eq('company_id', company_id);
    if (error) throw new BadRequestError(error.message);
    const rows = [];
    for (const r of data ?? []) {
      const uid = r.user_id as string;
      const { data: u, error: uErr } = await sb.auth.admin.getUserById(uid);
      if (uErr) throw new BadRequestError(uErr.message);
      rows.push({
        user_id: uid,
        company_id: r.company_id as string,
        email: u.user?.email ?? '',
        created_at: r.created_at as string,
      });
    }
    res.json({ rows });
  });
}

export function createAdminPartnerUserResetPasswordHandler(config: AppConfig): RequestHandler {
  return asyncHandler(async (req, res) => {
    const sb = requireServiceSb(config);
    const rawId = req.params.id;
    const user_id = Array.isArray(rawId) ? rawId[0] : rawId;
    if (!user_id) throw new BadRequestError('Falta user_id.');
    const passwordRaw = typeof req.body?.password === 'string' ? req.body.password : '';
    const defaultPw = process.env.PARTNER_DEFAULT_TEMP_PASSWORD?.trim() || 'Xplora.2026';
    const password = passwordRaw.trim().length >= 8 ? passwordRaw : defaultPw;
    const { error } = await sb.auth.admin.updateUserById(user_id, { password });
    if (error) throw new BadRequestError(error.message);
    res.json({ ok: true, temporary_password: passwordRaw.trim().length >= 8 ? undefined : password });
  });
}

