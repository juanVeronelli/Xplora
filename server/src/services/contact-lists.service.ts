/**
 * CRUD de listas de contacto + snapshots JSON por miembro.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import { BadRequestError } from '../http/errors/http-error.js';
import type { AdminMemberRowDTO } from './admin-member-rows.service.js';
import { fetchAllMemberRows } from './admin-member-rows.service.js';
import {
  applyMemberFilterSnapshot,
  type MemberFilterSnapshot,
} from './member-row-filter.service.js';

export type { MemberFilterSnapshot };

export type ContactListSnapshotPayload = {
  v: 1;
  captured_at: string;
  row: AdminMemberRowDTO;
};

type ListRow = {
  id: string;
  nombre: string;
  descripcion: string | null;
  filter_snapshot: MemberFilterSnapshot | null;
  member_count: number;
  created_at: string;
  updated_at: string;
  created_by_auth_user_id?: string | null;
};

type MemberRowDb = {
  id: string;
  list_id: string;
  usuario_id: string | null;
  snapshot: unknown;
};

export async function listContactLists(sb: SupabaseClient): Promise<ListRow[]> {
  const { data, error } = await sb
    .from('contact_lists')
    .select('id, nombre, descripcion, filter_snapshot, member_count, created_at, updated_at, created_by_auth_user_id')
    .order('updated_at', { ascending: false });
  if (error) throw new BadRequestError(error.message);
  return (data as ListRow[]) ?? [];
}

export async function listContactListsForCreator(
  sb: SupabaseClient,
  creatorAuthUserId: string,
): Promise<ListRow[]> {
  const { data, error } = await sb
    .from('contact_lists')
    .select('id, nombre, descripcion, filter_snapshot, member_count, created_at, updated_at, created_by_auth_user_id')
    .eq('created_by_auth_user_id', creatorAuthUserId)
    .order('updated_at', { ascending: false });
  if (error) throw new BadRequestError(error.message);
  return (data as ListRow[]) ?? [];
}

export async function getContactListById(sb: SupabaseClient, listId: string): Promise<ListRow | null> {
  const { data, error } = await sb
    .from('contact_lists')
    .select('id, nombre, descripcion, filter_snapshot, member_count, created_at, updated_at, created_by_auth_user_id')
    .eq('id', listId)
    .maybeSingle();
  if (error) throw new BadRequestError(error.message);
  return (data as ListRow | null) ?? null;
}

export async function listMembersForList(sb: SupabaseClient, listId: string): Promise<MemberRowDb[]> {
  const { data, error } = await sb
    .from('contact_list_members')
    .select('id, list_id, usuario_id, snapshot')
    .eq('list_id', listId)
    .order('created_at', { ascending: true });
  if (error) throw new BadRequestError(error.message);
  return (data as MemberRowDb[]) ?? [];
}

export type CreateContactListInput = {
  nombre: string;
  descripcion: string | null;
  filter_snapshot: MemberFilterSnapshot | null;
  member_ids?: string[];
  filter?: MemberFilterSnapshot | null;
  created_by_auth_user_id: string | null;
};

export async function createContactList(sb: SupabaseClient, input: CreateContactListInput): Promise<ListRow> {
  const nombre = input.nombre.trim();
  if (!nombre) throw new BadRequestError('El nombre de la lista es obligatorio.');

  const allRows = await fetchAllMemberRows(sb);
  const byId = new Map(allRows.map(r => [r.id, r]));

  let chosen: AdminMemberRowDTO[] = [];
  const ids = input.member_ids;
  if (Array.isArray(ids) && ids.length > 0) {
    const seen = new Set<string>();
    for (const id of ids) {
      if (typeof id !== 'string' || !id.trim()) continue;
      if (seen.has(id)) continue;
      seen.add(id);
      const row = byId.get(id);
      if (row) chosen.push(row);
    }
  } else {
    const snap = input.filter ?? input.filter_snapshot;
    chosen = applyMemberFilterSnapshot(allRows, snap);
  }

  if (chosen.length === 0) {
    throw new BadRequestError('La lista quedaría vacía: revisá los filtros o los usuarios elegidos.');
  }

  const capturedAt = new Date().toISOString();
  const filterSnapshot = input.filter_snapshot ?? input.filter ?? null;

  const { data: inserted, error: insErr } = await sb
    .from('contact_lists')
    .insert({
      nombre,
      descripcion: input.descripcion?.trim() || null,
      filter_snapshot: filterSnapshot,
      member_count: chosen.length,
      created_by_auth_user_id: input.created_by_auth_user_id,
    })
    .select('id, nombre, descripcion, filter_snapshot, member_count, created_at, updated_at, created_by_auth_user_id')
    .single();

  if (insErr) throw new BadRequestError(insErr.message);
  const list = inserted as ListRow;

  const memberPayload = chosen.map(row => ({
    list_id: list.id,
    usuario_id: row.id,
    snapshot: {
      v: 1 as const,
      captured_at: capturedAt,
      row,
    } satisfies ContactListSnapshotPayload,
  }));

  const { error: memErr } = await sb.from('contact_list_members').insert(memberPayload);
  if (memErr) {
    await sb.from('contact_lists').delete().eq('id', list.id);
    throw new BadRequestError(memErr.message);
  }

  return list;
}

export async function patchContactList(
  sb: SupabaseClient,
  listId: string,
  patch: { nombre?: string; descripcion?: string | null },
): Promise<ListRow | null> {
  const updates: Record<string, unknown> = {};
  if (patch.nombre !== undefined) {
    const n = patch.nombre.trim();
    if (!n) throw new BadRequestError('El nombre no puede quedar vacío.');
    updates.nombre = n;
  }
  if (patch.descripcion !== undefined) {
    updates.descripcion = patch.descripcion === null || patch.descripcion === '' ? null : patch.descripcion.trim();
  }
  if (Object.keys(updates).length === 0) return getContactListById(sb, listId);

  const { data, error } = await sb
    .from('contact_lists')
    .update(updates)
    .eq('id', listId)
    .select('id, nombre, descripcion, filter_snapshot, member_count, created_at, updated_at')
    .maybeSingle();

  if (error) throw new BadRequestError(error.message);
  return (data as ListRow | null) ?? null;
}

export async function deleteContactList(sb: SupabaseClient, listId: string): Promise<boolean> {
  const { error } = await sb.from('contact_lists').delete().eq('id', listId);
  if (error) throw new BadRequestError(error.message);
  return true;
}

/** Inserta miembros nuevos en una lista existente (evita duplicados por `usuario_id` o id en snapshot). */
export async function appendContactListMembers(
  sb: SupabaseClient,
  listId: string,
  memberIds: string[],
): Promise<{ added: number; member_count: number }> {
  const list = await getContactListById(sb, listId);
  if (!list) throw new BadRequestError('Lista no encontrada.');

  const existing = await listMembersForList(sb, listId);
  const already = new Set<string>();
  for (const m of existing) {
    if (m.usuario_id) already.add(m.usuario_id);
    const snap = m.snapshot as { row?: { id?: string } } | null;
    const rid = snap?.row?.id;
    if (rid) already.add(rid);
  }

  const allRows = await fetchAllMemberRows(sb);
  const byId = new Map(allRows.map(r => [r.id, r]));

  const capturedAt = new Date().toISOString();
  const toAdd: AdminMemberRowDTO[] = [];
  for (const raw of memberIds) {
    if (typeof raw !== 'string' || !raw.trim()) continue;
    const id = raw.trim();
    if (already.has(id)) continue;
    const row = byId.get(id);
    if (!row) continue;
    already.add(id);
    toAdd.push(row);
  }

  if (toAdd.length === 0) {
    return { added: 0, member_count: list.member_count };
  }

  const memberPayload = toAdd.map(row => ({
    list_id: listId,
    usuario_id: row.id,
    snapshot: {
      v: 1 as const,
      captured_at: capturedAt,
      row,
    } satisfies ContactListSnapshotPayload,
  }));

  const { error: memErr } = await sb.from('contact_list_members').insert(memberPayload);
  if (memErr) throw new BadRequestError(memErr.message);

  const membersAfter = await listMembersForList(sb, listId);
  const accurateCount = membersAfter.length;
  const { error: upErr } = await sb
    .from('contact_lists')
    .update({ member_count: accurateCount, updated_at: new Date().toISOString() })
    .eq('id', listId);
  if (upErr) throw new BadRequestError(upErr.message);

  return {
    added: toAdd.length,
    member_count: accurateCount,
  };
}
