import type { RequestHandler } from 'express';
import type { AppConfig } from '../../config/env.js';
import { createUserSupabase } from '../../infra/supabase-clients.js';
import { BadRequestError } from '../errors/http-error.js';
import { asyncHandler } from '../middleware/async-handler.js';

type ApplyPayload = {
  job_id: string;
  cover_letter?: string;
  extra?: Record<string, unknown>;
};

export function createTalentApplyHandler(config: AppConfig): RequestHandler {
  return asyncHandler(async (req, res) => {
    const sb = createUserSupabase(config, req.headers.authorization);
    const userId = req.authUser?.id;
    if (!userId) throw new BadRequestError('Falta usuario.');

    const body = req.body as ApplyPayload;
    const jobId = String(body?.job_id ?? '').trim();
    if (!jobId) throw new BadRequestError('Falta job_id.');

    // Job (public data) + company_id para snapshot.
    const { data: job, error: jobErr } = await sb.from('empleos').select('*').eq('id', jobId).single();
    if (jobErr || !job) throw new BadRequestError('Empleo inexistente.');

    // Perfil: obligatorio para aplicar.
    const { data: profile, error: profErr } = await sb.from('talent_profiles').select('*').eq('user_id', userId).maybeSingle();
    if (profErr) throw new BadRequestError(profErr.message);
    if (!profile) {
      throw new BadRequestError('Para aplicar tenés que completar tu perfil de talento primero.');
    }
    // Validación mínima “todo lo que podamos saber”.
    const fullName = String((profile as any).full_name ?? '').trim();
    const career = String((profile as any).career ?? '').trim();
    const cvUrl = String((profile as any).cv_url ?? '').trim();
    if (!fullName || !career || !cvUrl) {
      throw new BadRequestError('Completá tu perfil (nombre, carrera y CV) antes de aplicar.');
    }

    const snapshot = {
      profile: profile ?? null,
      cover_letter: body.cover_letter ?? '',
      extra: body.extra ?? {},
      job: {
        id: job.id,
        title: job.title,
        company: job.company,
        company_id: job.company_id ?? null,
      },
      submitted_at: new Date().toISOString(),
    };

    const insert = {
      job_id: job.id,
      company_id: job.company_id ?? null,
      talent_user_id: userId,
      snapshot,
    };

    const { data, error } = await sb.from('job_applications').insert(insert).select('*').single();
    if (error) throw new BadRequestError(error.message);
    res.status(201).json(data);
  });
}

