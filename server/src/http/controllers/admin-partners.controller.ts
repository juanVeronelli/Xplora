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
    const out: any[] = [];
    for (const c of data ?? []) {
      const cid = String((c as any).id);
      const { data: puRow, error: puErr } = await sb.from('partner_users').select('user_id').eq('company_id', cid).maybeSingle();
      if (puErr) throw new BadRequestError(puErr.message);
      const uid = puRow?.user_id ? String(puRow.user_id) : '';
      let partner_email: string | null = null;
      if (uid) {
        const { data: authUser, error: guErr } = await sb.auth.admin.getUserById(uid);
        if (guErr) throw new BadRequestError(guErr.message);
        partner_email = authUser?.user?.email ?? null;
      }
      out.push({ ...(c as any), partner_user_id: uid || null, partner_email });
    }
    res.json({ rows: out });
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

export function createAdminPartnerCreateHandler(config: AppConfig): RequestHandler {
  return asyncHandler(async (req, res) => {
    const sb = requireServiceSb(config);
    const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
    const domain = typeof req.body?.domain === 'string' ? req.body.domain.trim() : '';
    const logo_url = typeof req.body?.logo_url === 'string' ? req.body.logo_url.trim() : '';
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const passwordRaw = typeof req.body?.password === 'string' ? req.body.password : '';
    if (!name) throw new BadRequestError('Nombre de empresa obligatorio.');
    if (!email) throw new BadRequestError('Email obligatorio.');

    const defaultPw = process.env.PARTNER_DEFAULT_TEMP_PASSWORD?.trim() || 'Xplora.2026';
    const password = passwordRaw.trim().length >= 8 ? passwordRaw.trim() : defaultPw;
    if (password.length < 8) throw new BadRequestError('La contraseña debe tener al menos 8 caracteres.');

    const { data: company, error: cErr } = await sb.from('partner_companies').insert({ name, domain, logo_url }).select('*').single();
    if (cErr || !company) throw new BadRequestError(cErr?.message || 'No se pudo crear la empresa.');
    const company_id = String((company as any).id);

    try {
      const { data: created, error: authErr } = await sb.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });
      if (authErr || !created?.user?.id) {
        throw new BadRequestError(authErr?.message || 'No se pudo crear el usuario en Auth.');
      }
      const user_id = created.user.id;
      const { error: puErr } = await sb.from('partner_users').insert({ user_id, company_id });
      if (puErr) {
        await sb.auth.admin.deleteUser(user_id);
        throw new BadRequestError(puErr.message);
      }

      res.status(201).json({
        company,
        user: { email, user_id },
        temporary_password: passwordRaw.trim().length >= 8 ? undefined : password,
      });
    } catch (e) {
      await sb.from('partner_companies').delete().eq('id', company_id);
      throw e;
    }
  });
}

export function createAdminPartnerUsersListHandler(_config: AppConfig): RequestHandler {
  return asyncHandler(async (_req, _res) => {
    throw new BadRequestError('Deprecated: partners ya no usan /users.');
  });
}

export function createAdminPartnerUserResetPasswordHandler(_config: AppConfig): RequestHandler {
  return asyncHandler(async (_req, _res) => {
    throw new BadRequestError('Deprecated: partners ya no usan reset por esta ruta.');
  });
}

export function createAdminPartnerAccountUpdateHandler(config: AppConfig): RequestHandler {
  return asyncHandler(async (req, res) => {
    const sb = requireServiceSb(config);
    const rawId = req.params.id;
    const company_id = Array.isArray(rawId) ? rawId[0] : rawId;
    if (!company_id) throw new BadRequestError('Falta company id.');
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const passwordRaw = typeof req.body?.password === 'string' ? req.body.password : '';

    const { data: pu, error: puErr } = await sb.from('partner_users').select('user_id').eq('company_id', company_id).maybeSingle();
    if (puErr) throw new BadRequestError(puErr.message);
    if (!pu?.user_id) throw new BadRequestError('Esta empresa no tiene cuenta en Auth.');

    const attrs: { email?: string; password?: string } = {};
    if (email) attrs.email = email;
    if (passwordRaw.trim()) {
      if (passwordRaw.trim().length < 8) throw new BadRequestError('La contraseña debe tener al menos 8 caracteres.');
      attrs.password = passwordRaw.trim();
    }
    if (Object.keys(attrs).length === 0) throw new BadRequestError('Nada para actualizar.');
    const { error } = await sb.auth.admin.updateUserById(String(pu.user_id), attrs);
    if (error) throw new BadRequestError(error.message);
    res.json({ ok: true });
  });
}

export function createAdminPartnerCompanyUpdateHandler(config: AppConfig): RequestHandler {
  return asyncHandler(async (req, res) => {
    const sb = requireServiceSb(config);
    const rawId = req.params.id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;
    if (!id) throw new BadRequestError('Falta company id.');
    const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
    const domain = typeof req.body?.domain === 'string' ? req.body.domain.trim() : '';
    const logo_url = typeof req.body?.logo_url === 'string' ? req.body.logo_url.trim() : '';
    if (!name) throw new BadRequestError('Nombre de empresa obligatorio.');
    const { data, error } = await sb
      .from('partner_companies')
      .update({ name, domain, logo_url })
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw new BadRequestError(error.message);
    res.json(data);
  });
}

export function createAdminPartnerCompanyDeleteHandler(config: AppConfig): RequestHandler {
  return asyncHandler(async (req, res) => {
    const sb = requireServiceSb(config);
    const rawId = req.params.id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;
    if (!id) throw new BadRequestError('Falta company id.');

    const { data: puRows, error: qErr } = await sb.from('partner_users').select('user_id').eq('company_id', id);
    if (qErr) throw new BadRequestError(qErr.message);
    const userIds = (puRows ?? []).map(r => String((r as any).user_id)).filter(Boolean);

    const { error: delCoErr } = await sb.from('partner_companies').delete().eq('id', id);
    if (delCoErr) throw new BadRequestError(delCoErr.message);

    for (const uid of userIds) {
      const { error: duErr } = await sb.auth.admin.deleteUser(uid);
      if (duErr) throw new BadRequestError(duErr.message);
    }

    res.json({ ok: true });
  });
}

export function createAdminPartnerUserDeleteHandler(_config: AppConfig): RequestHandler {
  return asyncHandler(async (_req, _res) => {
    throw new BadRequestError('Deprecated: partners ya no usan /users.');
  });
}
