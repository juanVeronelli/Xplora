/**
 * Listado de campañas de email y audiencia (quién recibió cada envío vía `campanias_envios`).
 */
import type { RequestHandler } from 'express';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { AppConfig } from '../../config/env.js';
import { fetchAllMemberRows } from '../../services/admin-member-rows.service.js';
import { createUserSupabase } from '../../infra/supabase-clients.js';
import { BadRequestError } from '../errors/http-error.js';
import { asyncHandler } from '../middleware/async-handler.js';
import { ForbiddenError } from '../errors/http-error.js';
import {
  DEFAULT_EMAIL_TEMPLATE_ID,
  isValidEmailTemplateId,
  type EmailTemplateId,
} from '../../domain/email-template-ids.js';
import { getContactListById, listMembersForList } from '../../services/contact-lists.service.js';

const FETCH_PAGE = 1000;

function parseCampaignRouteId(req: { params: { id?: string | string[] } }): string {
  const rawId = req.params.id;
  const idRaw = Array.isArray(rawId) ? rawId[0] : rawId;
  if (!idRaw || typeof idRaw !== 'string') throw new BadRequestError('Falta id de campaña.');
  return idRaw;
}

async function fetchUsuarioIdsEnvioCampaign(
  sb: SupabaseClient,
  campaniaId: string,
): Promise<Set<string>> {
  const out = new Set<string>();
  let offset = 0;
  for (;;) {
    const { data, error } = await sb
      .from('campanias_envios')
      .select('usuario_id')
      .eq('campania_id', campaniaId)
      .range(offset, offset + FETCH_PAGE - 1);
    if (error) throw new BadRequestError(error.message);
    const chunk = (data as { usuario_id: string }[] | null) ?? [];
    for (const row of chunk) out.add(row.usuario_id);
    if (chunk.length < FETCH_PAGE) break;
    offset += FETCH_PAGE;
  }
  return out;
}

function mapCampaignRow(raw: Record<string, unknown>): {
  id: string;
  titulo_interno: string | null;
  asunto: string | null;
  template_id: EmailTemplateId;
  contact_list_id?: string | null;
} {
  const rawTemplate =
    typeof raw.template_id === 'string' && isValidEmailTemplateId(raw.template_id)
      ? raw.template_id
      : DEFAULT_EMAIL_TEMPLATE_ID;
  return {
    id: String(raw.id),
    titulo_interno:
      (typeof raw.titulo_interno === 'string'
        ? raw.titulo_interno
        : typeof raw.nombre === 'string'
          ? raw.nombre
          : typeof raw.titulo === 'string'
            ? raw.titulo
            : null) ?? null,
    asunto: typeof raw.asunto === 'string' ? raw.asunto : null,
    template_id: rawTemplate,
    contact_list_id: typeof raw.contact_list_id === 'string' ? raw.contact_list_id : null,
  };
}

/** POST /api/admin/email-campaigns — solo `nombre` y `asunto` (created_at/updated_at los define la BD). */
export function createEmailCampaignInsertHandler(config: AppConfig): RequestHandler {
  return asyncHandler(async (req, res) => {
    const sb = createUserSupabase(config, req.headers.authorization);
    const body = req.body as Record<string, unknown>;
    const nombre =
      (typeof body.nombre === 'string' ? body.nombre.trim() : '') ||
      (typeof body.titulo_interno === 'string' ? body.titulo_interno.trim() : '');
    const asunto = typeof body.asunto === 'string' ? body.asunto.trim() : '';
    if (!nombre) {
      throw new BadRequestError('El título de la campaña (nombre) es obligatorio.');
    }
    if (!asunto) {
      throw new BadRequestError('El asunto es obligatorio.');
    }

    const rawTemplateId = body.template_id;
    const template_id =
      typeof rawTemplateId === 'string' && isValidEmailTemplateId(rawTemplateId.trim())
        ? rawTemplateId.trim()
        : DEFAULT_EMAIL_TEMPLATE_ID;

    const row = { nombre, asunto, template_id };

    // Opcional: asociar campaña a una lista de contactos (audiencia objetivo).
    const rawListId = body.contact_list_id;
    if (typeof rawListId === 'string' && rawListId.trim()) {
      const listId = rawListId.trim();
      const uid = req.authUser?.id ?? null;
      if (!uid) throw new ForbiddenError('No hay usuario autenticado.');
      const list = await getContactListById(sb, listId);
      if (!list) throw new BadRequestError('Lista no encontrada.');
      if ((list.created_by_auth_user_id ?? null) !== uid) {
        throw new ForbiddenError('Solo podés usar tus propias listas de contactos.');
      }
      (row as Record<string, unknown>).contact_list_id = listId;
    }

    const { data, error } = await sb.from('campanias_email').insert(row).select().single();
    if (error) {
      throw new BadRequestError(error.message);
    }
    res.status(201).json(data);
  });
}

/** GET /api/admin/email-campaigns */
export function createEmailCampaignsListHandler(config: AppConfig): RequestHandler {
  return asyncHandler(async (req, res) => {
    const sb = createUserSupabase(config, req.headers.authorization);
    const { data, error } = await sb.from('campanias_email').select('*').order('id', { ascending: false });
    if (error) {
      throw new BadRequestError(error.message);
    }
    const rows = ((data as Record<string, unknown>[]) ?? []).map(mapCampaignRow);
    res.json(rows);
  });
}

/**
 * POST /api/admin/email-campaigns/:id/envios
 * Registra en `campanias_envios` que esos usuarios ya recibieron esta campaña (tras envío real por Resend u otro).
 * Idempotente: no duplica filas (usuario ya registrado se cuenta en skipped_already_sent).
 */
export function createEmailCampaignLogEnviosHandler(config: AppConfig): RequestHandler {
  return asyncHandler(async (req, res) => {
    const campaignId = parseCampaignRouteId(req);
    const body = req.body as Record<string, unknown>;
    const sb = createUserSupabase(config, req.headers.authorization);

    // Permite dos modos:
    // - usuario_ids: ids explícitos (modo manual / externo)
    // - contact_list_id: resolver destinatarios desde una lista guardada (modo CRM)
    // - audience: 'all' para todos los usuarios (dinámico; incluye nuevos)
    const rawListId = body.contact_list_id;
    const rawIds = body.usuario_ids;
    const rawAudience = body.audience;

    let usuario_ids: string[] = [];

    if (rawAudience === 'all') {
      const members = await fetchAllMemberRows(sb);
      usuario_ids = members.map(m => m.id).filter(Boolean);
      if (usuario_ids.length === 0) {
        throw new BadRequestError('No hay usuarios en la base para registrar envíos.');
      }
    } else if (typeof rawListId === 'string' && rawListId.trim()) {
      const listId = rawListId.trim();
      const uid = req.authUser?.id ?? null;
      if (!uid) throw new ForbiddenError('No hay usuario autenticado.');
      const list = await getContactListById(sb, listId);
      if (!list) throw new BadRequestError('Lista no encontrada.');
      if ((list.created_by_auth_user_id ?? null) !== uid) {
        throw new ForbiddenError('Solo podés enviar a listas creadas por tu usuario.');
      }
      const members = await listMembersForList(sb, listId);
      usuario_ids = members
        .map(m => m.usuario_id)
        .filter((x): x is string => typeof x === 'string' && x.trim().length > 0);
      if (usuario_ids.length === 0) {
        throw new BadRequestError('La lista elegida no tiene usuarios con id para registrar envíos.');
      }
    } else if (Array.isArray(rawIds)) {
      usuario_ids = rawIds
        .filter((x): x is string => typeof x === 'string' && x.trim().length > 0)
        .map(s => s.trim());
      if (usuario_ids.length === 0) {
        throw new BadRequestError('usuario_ids no puede estar vacío.');
      }
    } else {
      throw new BadRequestError("Enviá JSON con audience:'all', contact_list_id o usuario_ids (array de UUIDs).");
    }

    const { data: campaignRow, error: cErr } = await sb
      .from('campanias_email')
      .select('id')
      .eq('id', campaignId)
      .maybeSingle();
    if (cErr) throw new BadRequestError(cErr.message);
    if (!campaignRow) throw new BadRequestError('Campaña no encontrada.');

    const existing = await fetchUsuarioIdsEnvioCampaign(sb, campaignId);
    const nuevos = usuario_ids.filter(uid => !existing.has(uid));
    const skipped_already_sent = usuario_ids.length - nuevos.length;

    if (nuevos.length === 0) {
      res.json({ inserted: 0, skipped_already_sent, total_recipients: usuario_ids.length });
      return;
    }

    const rows = nuevos.map(usuario_id => ({
      campania_id: campaignId,
      usuario_id,
    }));

    const { error: insErr } = await sb.from('campanias_envios').insert(rows);
    if (insErr) throw new BadRequestError(insErr.message);

    res.status(201).json({
      inserted: nuevos.length,
      skipped_already_sent,
      total_recipients: usuario_ids.length,
    });
  });
}

/** GET /api/admin/email-campaigns/:id/audience */
export function createEmailCampaignAudienceHandler(config: AppConfig): RequestHandler {
  return asyncHandler(async (req, res) => {
    const id = parseCampaignRouteId(req);
    const sb = createUserSupabase(config, req.headers.authorization);

    const { data: rawCampaign, error: cErr } = await sb
      .from('campanias_email')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (cErr) throw new BadRequestError(cErr.message);
    if (!rawCampaign || typeof rawCampaign !== 'object') {
      throw new BadRequestError('Campaña no encontrada.');
    }

    const campaign = mapCampaignRow(rawCampaign as Record<string, unknown>);
    const [members, enviados] = await Promise.all([
      fetchAllMemberRows(sb),
      fetchUsuarioIdsEnvioCampaign(sb, id),
    ]);

    const rows = members.map(m => ({
      ...m,
      enviado: enviados.has(m.id),
    }));

    res.json({ campaign, rows });
  });
}
