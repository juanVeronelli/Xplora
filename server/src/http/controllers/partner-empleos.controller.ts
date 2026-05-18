import type { RequestHandler } from 'express';
import type { AppConfig } from '../../config/env.js';
import { createServiceSupabase, createUserSupabase } from '../../infra/supabase-clients.js';
import { BadRequestError, InternalError, UnauthorizedError } from '../errors/http-error.js';
import { asyncHandler } from '../middleware/async-handler.js';

function requireServiceSb(config: AppConfig) {
  const sb = createServiceSupabase(config);
  if (!sb) throw new InternalError('Falta SUPABASE_SERVICE_ROLE_KEY.');
  return sb;
}

/**
 * Partner Portal: CRUD de `empleos` y postulaciones con JWT Supabase del partner (RLS).
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
    const companyId = req.partnerCompanyId;
    if (!companyId) throw new UnauthorizedError('Tu cuenta no está asociada a una empresa.');
    const sbSvc = requireServiceSb(config);
    const sbUser = createUserSupabase(config, req.headers.authorization);
    const body = (req.body ?? {}) as Record<string, unknown>;

    const { data: company, error: cErr } = await sbSvc.from('partner_companies').select('name, logo_url').eq('id', companyId).maybeSingle();
    if (cErr) throw new BadRequestError(cErr.message);
    const companyName = typeof (company as any)?.name === 'string' ? String((company as any).name) : '';
    const companyLogo = typeof (company as any)?.logo_url === 'string' ? String((company as any).logo_url) : '';

    const payload: Record<string, unknown> = {
      ...body,
      company_id: companyId,
      ...(companyName ? { company: companyName } : {}),
      ...(companyLogo && !('thumbnail_url' in body) ? { thumbnail_url: companyLogo } : {}),
      application_link: '',
    };
    const { data, error } = await sbUser.from('empleos').insert(payload).select('*').single();
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
