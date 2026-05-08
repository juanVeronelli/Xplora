import type { RequestHandler } from 'express';
import type { AppConfig } from '../../config/env.js';
import { createUserSupabase } from '../../infra/supabase-clients.js';
import { BadRequestError, UnauthorizedError } from '../errors/http-error.js';
import { asyncHandler } from '../middleware/async-handler.js';

/**
 * Partner Portal:
 * - CRUD de `empleos` (solo los de su empresa, filtrados por RLS).
 * - Listado de postulaciones por empleo.
 */

export function createPartnerEmpleosListHandler(config: AppConfig): RequestHandler {
  return asyncHandler(async (req, res) => {
    const sb = createUserSupabase(config, req.headers.authorization);
    const { data, error } = await sb.from('empleos').select('*').order('created_at', { ascending: false });
    if (error) throw new BadRequestError(error.message);
    res.json(data ?? []);
  });
}

export function createPartnerEmpleoCreateHandler(config: AppConfig): RequestHandler {
  return asyncHandler(async (req, res) => {
    const sb = createUserSupabase(config, req.headers.authorization);
    const body = (req.body ?? {}) as Record<string, unknown>;

    // company_id se determina por el usuario partner (función SQL SECURITY DEFINER).
    const { data: companyId, error: rpcErr } = await sb.rpc('partner_company_id');
    if (rpcErr || !companyId) {
      throw new UnauthorizedError('Tu cuenta no está asociada a una empresa.');
    }

    const payload: Record<string, unknown> = {
      ...body,
      company_id: companyId,
      // apply interno, no link externo
      application_link: '',
    };
    const { data, error } = await sb.from('empleos').insert(payload).select('*').single();
    if (error) throw new BadRequestError(error.message);
    res.status(201).json(data);
  });
}

export function createPartnerEmpleoPatchHandler(config: AppConfig): RequestHandler {
  return asyncHandler(async (req, res) => {
    const id = req.params.id;
    if (!id) throw new BadRequestError('Falta id.');
    const sb = createUserSupabase(config, req.headers.authorization);
    const body = (req.body ?? {}) as Record<string, unknown>;
    // company_id no se puede editar desde partner portal.
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete body.company_id;
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete body.application_link;
    const { data, error } = await sb.from('empleos').update(body).eq('id', id).select('*').single();
    if (error) throw new BadRequestError(error.message);
    res.json(data);
  });
}

export function createPartnerEmpleoDeleteHandler(config: AppConfig): RequestHandler {
  return asyncHandler(async (req, res) => {
    const id = req.params.id;
    if (!id) throw new BadRequestError('Falta id.');
    const sb = createUserSupabase(config, req.headers.authorization);
    const { error } = await sb.from('empleos').delete().eq('id', id);
    if (error) throw new BadRequestError(error.message);
    res.status(204).send();
  });
}

export function createPartnerEmpleoApplicationsListHandler(config: AppConfig): RequestHandler {
  return asyncHandler(async (req, res) => {
    const jobId = req.params.id;
    if (!jobId) throw new BadRequestError('Falta id.');
    const sb = createUserSupabase(config, req.headers.authorization);

    // RLS debe filtrar por company_id. Pero también validamos que el job exista para este usuario.
    const { data: job, error: jobErr } = await sb.from('empleos').select('id, company_id, title').eq('id', jobId).single();
    if (jobErr || !job) throw new UnauthorizedError('No tenés acceso a ese empleo.');

    const { data, error } = await sb
      .from('job_applications')
      .select('*')
      .eq('job_id', jobId)
      .order('created_at', { ascending: false });
    if (error) throw new BadRequestError(error.message);
    res.json({ job, applications: data ?? [] });
  });
}

