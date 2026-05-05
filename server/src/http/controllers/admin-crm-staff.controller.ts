/**
 * CRUD de cuentas del equipo CRM (`crm_staff` + auth.users). Requiere service role.
 */
import type { RequestHandler } from 'express';
import type { AppConfig } from '../../config/env.js';
import {
  BadRequestError,
  ForbiddenError,
  InternalError,
} from '../errors/http-error.js';
import { asyncHandler } from '../middleware/async-handler.js';
import { createServiceSupabase } from '../../infra/supabase-clients.js';
import {
  canAssignPermissions,
  canManageStaffAccounts,
  hasPermission,
  normalizePermissionList,
} from '../../permissions/crm-permissions.js';

function requireServiceSb(config: AppConfig) {
  const sb = createServiceSupabase(config);
  if (!sb) {
    throw new InternalError(
      'Falta SUPABASE_SERVICE_ROLE_KEY: no se pueden crear ni gestionar cuentas del equipo desde el servidor.',
    );
  }
  return sb;
}

function strOrNull(v: unknown): string | null {
  if (v === undefined || v === null) return null;
  if (typeof v !== 'string') return null;
  const t = v.trim();
  return t.length ? t : null;
}

export function createAdminCrmStaffListHandler(config: AppConfig): RequestHandler {
  return asyncHandler(async (_req, res) => {
    const sb = requireServiceSb(config);
    const { data, error } = await sb
      .from('crm_staff')
      .select('auth_user_id, email, permissions, nombre, apellido, equipo, created_at')
      .order('created_at', { ascending: true });
    if (error) throw new BadRequestError(error.message);
    const rows = (data ?? []).map(r => ({
      auth_user_id: r.auth_user_id as string,
      email: r.email as string,
      permissions: normalizePermissionList(r.permissions),
      nombre: (r.nombre as string | null) ?? '',
      apellido: (r.apellido as string | null) ?? '',
      equipo: (r.equipo as string | null) ?? '',
      created_at: r.created_at as string,
    }));
    res.json({ rows });
  });
}

export function createAdminCrmStaffCreateHandler(config: AppConfig): RequestHandler {
  return asyncHandler(async (req, res) => {
    const actor = req.staffProfile?.permissions;
    if (!actor?.length) throw new ForbiddenError('Sin permisos.');
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const passwordRaw = typeof req.body?.password === 'string' ? req.body.password : '';
    const permissionsRaw = req.body?.permissions;
    const nombre = strOrNull(req.body?.nombre) ?? '';
    const apellido = strOrNull(req.body?.apellido) ?? '';
    const equipo = strOrNull(req.body?.equipo) ?? '';

    if (!email) throw new BadRequestError('Email obligatorio.');
    const permissions = normalizePermissionList(permissionsRaw);
    if (permissions.length === 0) {
      throw new BadRequestError('Al menos un permiso es obligatorio.');
    }
    if (!canAssignPermissions(actor, permissions)) {
      throw new ForbiddenError('Solo quien tiene acceso total puede otorgar ese nivel a otras cuentas.');
    }

    const defaultPw =
      process.env.CRM_DEFAULT_TEMP_PASSWORD?.trim() ||
      'XploraCrmTemp1!';
    const password = passwordRaw.length >= 8 ? passwordRaw : defaultPw;

    const sb = requireServiceSb(config);
    const { data: created, error: cErr } = await sb.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (cErr || !created.user) {
      throw new BadRequestError(cErr?.message || 'No se pudo crear el usuario en Auth.');
    }

    const { error: insErr } = await sb.from('crm_staff').insert({
      auth_user_id: created.user.id,
      email,
      permissions,
      nombre: nombre || null,
      apellido: apellido || null,
      equipo: equipo || null,
    });
    if (insErr) {
      await sb.auth.admin.deleteUser(created.user.id);
      throw new BadRequestError(insErr.message);
    }

    res.status(201).json({
      auth_user_id: created.user.id,
      email,
      permissions,
      temporary_password: passwordRaw.length >= 8 ? undefined : password,
    });
  });
}

export function createAdminCrmStaffPatchHandler(config: AppConfig): RequestHandler {
  return asyncHandler(async (req, res) => {
    const actor = req.staffProfile?.permissions;
    if (!actor?.length) throw new ForbiddenError('Sin permisos.');
    const rawId = req.params.id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;
    if (!id) throw new BadRequestError('Falta id.');

    const body = req.body ?? {};
    const sb = requireServiceSb(config);
    const canManage = canManageStaffAccounts(actor);
    const selfId = req.authUser?.id;
    const isSelf = Boolean(selfId && id === selfId);

    /** Solo nombre/apellido/equipo en la propia fila (sin tocar permisos ni login). */
    if (!canManage) {
      if (!isSelf) {
        throw new ForbiddenError('No tenés permiso para editar otras cuentas del equipo.');
      }
      if (body.permissions !== undefined) {
        throw new ForbiddenError('No podés modificar permisos.');
      }
      if (typeof body.email === 'string' && body.email.trim()) {
        throw new ForbiddenError('No podés cambiar el email desde acá.');
      }
      const pwdRawSelf = typeof body.new_password === 'string' ? body.new_password : '';
      if (pwdRawSelf.length > 0) {
        throw new ForbiddenError('Usá «Mi contraseña» para cambiar tu propia contraseña.');
      }

      const updatesSelf: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };
      for (const key of ['nombre', 'apellido', 'equipo'] as const) {
        if (body[key] !== undefined) {
          updatesSelf[key] = strOrNull(body[key]);
        }
      }
      const touchSelf = Object.keys(updatesSelf).filter(k => k !== 'updated_at');
      if (touchSelf.length === 0) {
        throw new BadRequestError('Nada para actualizar.');
      }

      const { error } = await sb.from('crm_staff').update(updatesSelf).eq('auth_user_id', id);
      if (error) throw new BadRequestError(error.message);
      res.json({ ok: true });
      return;
    }

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (body.permissions !== undefined) {
      const permissions = normalizePermissionList(body.permissions);
      if (permissions.length === 0) {
        throw new BadRequestError('Si enviás permisos, debe haber al menos uno.');
      }
      if (!canAssignPermissions(actor, permissions)) {
        throw new ForbiddenError('Solo quien tiene acceso total puede otorgar ese nivel a otras cuentas.');
      }
      updates.permissions = permissions;
    }

    for (const key of ['nombre', 'apellido', 'equipo'] as const) {
      if (body[key] !== undefined) {
        updates[key] = strOrNull(body[key]);
      }
    }

    const newEmailRaw =
      typeof body.email === 'string' && body.email.trim()
        ? body.email.trim().toLowerCase()
        : '';

    const pwdRaw = typeof body.new_password === 'string' ? body.new_password : '';
    const wantsPasswordChange = pwdRaw.length > 0;
    if (wantsPasswordChange) {
      if (!hasPermission(actor, 'access_total')) {
        throw new ForbiddenError('Solo quien tiene acceso total puede cambiar la contraseña de una cuenta.');
      }
      if (pwdRaw.length < 8) {
        throw new BadRequestError('La nueva contraseña debe tener al menos 8 caracteres.');
      }
      const { error: pe } = await sb.auth.admin.updateUserById(id, { password: pwdRaw });
      if (pe) throw new BadRequestError(pe.message);
    }

    if (newEmailRaw) {
      if (!hasPermission(actor, 'access_total')) {
        throw new ForbiddenError('Solo quien tiene acceso total puede cambiar el email de una cuenta.');
      }
      const { error: ee } = await sb.auth.admin.updateUserById(id, { email: newEmailRaw });
      if (ee) throw new BadRequestError(ee.message);
      updates.email = newEmailRaw;
    }

    const dbFields = Object.keys(updates).filter(k => k !== 'updated_at');
    if (dbFields.length === 0 && !wantsPasswordChange) {
      throw new BadRequestError('Nada para actualizar.');
    }

    const { error } = await sb.from('crm_staff').update(updates).eq('auth_user_id', id);
    if (error) throw new BadRequestError(error.message);

    res.json({ ok: true });
  });
}

export function createAdminCrmStaffDeleteHandler(config: AppConfig): RequestHandler {
  return asyncHandler(async (req, res) => {
    const rawId = req.params.id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;
    if (!id) throw new BadRequestError('Falta id.');
    const selfId = req.authUser?.id;
    if (id === selfId) throw new BadRequestError('No podés eliminar tu propia cuenta desde acá.');

    const sb = requireServiceSb(config);
    const { error } = await sb.auth.admin.deleteUser(id);
    if (error) throw new BadRequestError(error.message);
    res.status(204).send();
  });
}

export function createAdminCrmStaffResetPasswordHandler(config: AppConfig): RequestHandler {
  return asyncHandler(async (req, res) => {
    const rawId = req.params.id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;
    if (!id) throw new BadRequestError('Falta id.');
    const bodyPw = typeof req.body?.password === 'string' ? req.body.password : '';
    const defaultPw =
      process.env.CRM_DEFAULT_TEMP_PASSWORD?.trim() ||
      'XploraCrmTemp1!';
    const password = bodyPw.length >= 8 ? bodyPw : defaultPw;

    const sb = requireServiceSb(config);
    const { error } = await sb.auth.admin.updateUserById(id, { password });
    if (error) throw new BadRequestError(error.message);
    res.json({
      ok: true,
      temporary_password: bodyPw.length >= 8 ? undefined : password,
    });
  });
}
