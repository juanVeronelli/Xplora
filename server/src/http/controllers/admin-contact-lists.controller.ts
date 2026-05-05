/**
 * Listas de contacto guardadas en `contact_lists` + snapshots en `contact_list_members`.
 */
import type { RequestHandler } from 'express';
import type { AppConfig } from '../../config/env.js';
import { BadRequestError } from '../errors/http-error.js';
import { asyncHandler } from '../middleware/async-handler.js';
import { createUserSupabase } from '../../infra/supabase-clients.js';
import {
  createContactList,
  deleteContactList,
  getContactListById,
  listContactLists,
  listContactListsForCreator,
  listMembersForList,
  patchContactList,
  type MemberFilterSnapshot,
} from '../../services/contact-lists.service.js';
import { ForbiddenError } from '../errors/http-error.js';

function routeParamId(param: string | string[] | undefined): string {
  if (typeof param === 'string') return param;
  if (Array.isArray(param) && param[0]) return param[0];
  return '';
}

function parseFilterSnap(raw: unknown): MemberFilterSnapshot | null {
  if (raw == null || raw === '') return null;
  if (typeof raw !== 'object') throw new BadRequestError('filter_snapshot inválido.');
  return raw as MemberFilterSnapshot;
}

export function createContactListsListHandler(config: AppConfig): RequestHandler {
  return asyncHandler(async (req, res) => {
    const sb = createUserSupabase(config, req.headers.authorization);
    const lists = await listContactLists(sb);
    res.json({ lists });
  });
}

/** GET /api/admin/contact-lists/mine — solo listas creadas por el usuario logueado. */
export function createMyContactListsListHandler(config: AppConfig): RequestHandler {
  return asyncHandler(async (req, res) => {
    const uid = req.authUser?.id ?? null;
    if (!uid) throw new ForbiddenError('No hay usuario autenticado.');
    const sb = createUserSupabase(config, req.headers.authorization);
    const lists = await listContactListsForCreator(sb, uid);
    res.json({ lists });
  });
}

export function createContactListDetailHandler(config: AppConfig): RequestHandler {
  return asyncHandler(async (req, res) => {
    const id = routeParamId(req.params.id);
    if (!id) throw new BadRequestError('Falta id de lista.');
    const sb = createUserSupabase(config, req.headers.authorization);
    const list = await getContactListById(sb, id);
    if (!list) {
      res.status(404).json({ error: 'Lista no encontrada.' });
      return;
    }
    const members = await listMembersForList(sb, id);
    res.json({ list, members });
  });
}

export function createContactListCreateHandler(config: AppConfig): RequestHandler {
  return asyncHandler(async (req, res) => {
    const body = req.body as Record<string, unknown>;
    const nombre = typeof body.nombre === 'string' ? body.nombre : '';
    const descripcion =
      typeof body.descripcion === 'string'
        ? body.descripcion
        : body.descripcion === null
          ? null
          : null;
    const member_ids = Array.isArray(body.member_ids) ? body.member_ids : undefined;
    const filter_snapshot = parseFilterSnap(body.filter_snapshot);
    const filter = parseFilterSnap(body.filter);

    const uid = req.authUser?.id ?? null;

    const sb = createUserSupabase(config, req.headers.authorization);
    const list = await createContactList(sb, {
      nombre,
      descripcion,
      filter_snapshot,
      member_ids: member_ids as string[] | undefined,
      filter,
      created_by_auth_user_id: uid,
    });
    res.status(201).json({ list });
  });
}

export function createContactListPatchHandler(config: AppConfig): RequestHandler {
  return asyncHandler(async (req, res) => {
    const id = routeParamId(req.params.id);
    if (!id) throw new BadRequestError('Falta id de lista.');
    const body = req.body as Record<string, unknown>;
    const patch: { nombre?: string; descripcion?: string | null } = {};
    if (typeof body.nombre === 'string') patch.nombre = body.nombre;
    if (body.descripcion === null) patch.descripcion = null;
    else if (typeof body.descripcion === 'string') patch.descripcion = body.descripcion;

    const sb = createUserSupabase(config, req.headers.authorization);
    const list = await patchContactList(sb, id, patch);
    if (!list) {
      res.status(404).json({ error: 'Lista no encontrada.' });
      return;
    }
    res.json({ list });
  });
}

export function createContactListDeleteHandler(config: AppConfig): RequestHandler {
  return asyncHandler(async (req, res) => {
    const id = routeParamId(req.params.id);
    if (!id) throw new BadRequestError('Falta id de lista.');
    const sb = createUserSupabase(config, req.headers.authorization);
    const existing = await getContactListById(sb, id);
    if (!existing) {
      res.status(404).json({ error: 'Lista no encontrada.' });
      return;
    }
    await deleteContactList(sb, id);
    res.status(204).send();
  });
}
