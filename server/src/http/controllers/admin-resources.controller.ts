/**
 * Handlers genéricos **POST / PATCH / DELETE** para tablas de contenido (`eventos`, `charlas`, `empleos`).
 * El cliente Supabase se crea con el JWT del request → RLS de Supabase aplica como el usuario autenticado.
 */
import type { RequestHandler } from 'express';
import type { AppConfig } from '../../config/env.js';
import { createUserSupabase } from '../../infra/supabase-clients.js';
import { BadRequestError } from '../errors/http-error.js';
import { asyncHandler } from '../middleware/async-handler.js';

type AdminTable = 'eventos' | 'charlas' | 'empleos';

function mapSbErr(msg: string): BadRequestError {
  return new BadRequestError(msg);
}

export function createAdminInsertHandler(config: AppConfig, table: AdminTable): RequestHandler {
  return asyncHandler(async (req, res) => {
    const sb = createUserSupabase(config, req.headers.authorization);
    const body = req.body as Record<string, unknown>;
    const { data, error } = await sb.from(table).insert(body).select().single();
    if (error) {
      throw mapSbErr(error.message);
    }
    res.status(201).json(data);
  });
}

export function createAdminUpdateHandler(config: AppConfig, table: AdminTable): RequestHandler {
  return asyncHandler(async (req, res) => {
    const id = req.params.id;
    if (!id) throw new BadRequestError('Falta id.');
    const sb = createUserSupabase(config, req.headers.authorization);
    const { data, error } = await sb.from(table).update(req.body).eq('id', id).select().single();
    if (error) {
      throw mapSbErr(error.message);
    }
    res.json(data);
  });
}

export function createAdminDeleteHandler(config: AppConfig, table: AdminTable): RequestHandler {
  return asyncHandler(async (req, res) => {
    const id = req.params.id;
    if (!id) throw new BadRequestError('Falta id.');
    const sb = createUserSupabase(config, req.headers.authorization);
    const { error } = await sb.from(table).delete().eq('id', id);
    if (error) {
      throw mapSbErr(error.message);
    }
    res.status(204).send();
  });
}
