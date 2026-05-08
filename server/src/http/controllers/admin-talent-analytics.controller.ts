/**
 * GET /api/admin/talent-analytics — métricas agregadas para Talento/Bolsa.
 * Se resuelve con service role (las tablas tienen RLS restrictiva para no-admin).
 */
import type { RequestHandler } from 'express';
import type { AppConfig } from '../../config/env.js';
import { createServiceSupabase } from '../../infra/supabase-clients.js';
import { BadRequestError, InternalError } from '../errors/http-error.js';
import { asyncHandler } from '../middleware/async-handler.js';

function requireServiceSb(config: AppConfig) {
  const sb = createServiceSupabase(config);
  if (!sb) throw new InternalError('Falta SUPABASE_SERVICE_ROLE_KEY para analytics de talento.');
  return sb;
}

type SqlRow = Record<string, unknown>;

type ServiceSb = NonNullable<ReturnType<typeof createServiceSupabase>>;

async function sqlSelect(sb: ServiceSb, query: string, maxRows = 50): Promise<SqlRow[]> {
  const { data, error } = await sb.rpc('crm_sql_select', { query, max_rows: maxRows });
  if (error) throw new BadRequestError(error.message);
  return (Array.isArray(data) ? data : []) as SqlRow[];
}

function num(v: unknown): number {
  const n = typeof v === 'number' ? v : typeof v === 'string' ? Number(v) : NaN;
  return Number.isFinite(n) ? n : 0;
}

function str(v: unknown): string {
  return typeof v === 'string' ? v : v == null ? '' : String(v);
}

export function createAdminTalentAnalyticsHandler(config: AppConfig): RequestHandler {
  return asyncHandler(async (_req, res) => {
    const sb = requireServiceSb(config);

    const totals = await sqlSelect(
      sb,
      `
      select
        (select count(*) from public.talent_profiles) as talent_total,
        (select count(*) from public.job_applications) as applications_total,
        (select count(distinct talent_user_id) from public.job_applications) as applicants_total
      `,
      5,
    );

    const topAreas = await sqlSelect(
      sb,
      `
      select
        coalesce(nullif(btrim(e.area), ''), 'Sin categoría') as area,
        count(*) as applications
      from public.job_applications a
      join public.empleos e on e.id = a.job_id
      group by 1
      order by applications desc
      `,
      20,
    );

    const byCareer = await sqlSelect(
      sb,
      `
      select
        coalesce(nullif(btrim(tp.career), ''), 'Sin carrera') as career,
        count(distinct a.talent_user_id) as applicants,
        count(*) as applications
      from public.job_applications a
      join public.talent_profiles tp on tp.user_id = a.talent_user_id
      group by 1
      order by applicants desc, applications desc
      `,
      30,
    );

    const t0 = totals[0] ?? {};
    res.json({
      totals: {
        talent_total: num(t0.talent_total),
        applicants_total: num(t0.applicants_total),
        applications_total: num(t0.applications_total),
      },
      top_areas: topAreas.map(r => ({ area: str(r.area), applications: num(r.applications) })),
      by_career: byCareer.map(r => ({
        career: str(r.career),
        applicants: num(r.applicants),
        applications: num(r.applications),
      })),
      generated_at: new Date().toISOString(),
    });
  });
}

