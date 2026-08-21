import type { SupabaseClient } from '@supabase/supabase-js';
import { InternalError } from '../http/errors/http-error.js';

export type MemberStudy = {
  institution: string;
  degree: string;
  year?: string;
};

export type MemberJob = {
  company: string;
  role: string;
  from?: string;
  to?: string;
  current?: boolean;
};

export type MemberLanguage = {
  name: string;
  level: string;
};

export type MemberAccountRow = {
  id: string;
  email: string;
  email_confirmed_at: string | null;
  usuario_id: string | null;
  display_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  studies: MemberStudy[] | unknown;
  jobs: MemberJob[] | unknown;
  languages: MemberLanguage[] | unknown;
  skills: string[] | null;
  cv_url: string | null;
  created_at: string;
  updated_at: string;
};

export type MemberPublicProfile = {
  id: string;
  email: string;
  displayName: string;
  phone: string;
  avatarUrl: string;
  studies: MemberStudy[];
  jobs: MemberJob[];
  languages: MemberLanguage[];
  skills: string[];
  cvUrl: string;
  emailConfirmed: boolean;
  createdAt: string;
};

function asArray<T>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}

export function toPublicProfile(row: MemberAccountRow): MemberPublicProfile {
  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name?.trim() || '',
    phone: row.phone?.trim() || '',
    avatarUrl: row.avatar_url?.trim() || '',
    studies: asArray<MemberStudy>(row.studies),
    jobs: asArray<MemberJob>(row.jobs),
    languages: asArray<MemberLanguage>(row.languages),
    skills: Array.isArray(row.skills) ? row.skills : [],
    cvUrl: row.cv_url?.trim() || '',
    emailConfirmed: Boolean(row.email_confirmed_at),
    createdAt: row.created_at,
  };
}

export async function findMemberByEmail(
  sb: SupabaseClient,
  email: string,
): Promise<MemberAccountRow | null> {
  const { data, error } = await sb
    .from('member_accounts')
    .select('*')
    .eq('email', email.toLowerCase())
    .maybeSingle();
  if (error) {
    if (error.code === 'PGRST205' || /Could not find the table/i.test(error.message)) {
      throw new InternalError(
        'Faltan tablas de miembros en Supabase. Ejecutá supabase-setup-member-accounts.sql en el SQL Editor.',
      );
    }
    throw error;
  }
  return (data as MemberAccountRow | null) ?? null;
}

export async function findMemberById(
  sb: SupabaseClient,
  id: string,
): Promise<MemberAccountRow | null> {
  const { data, error } = await sb.from('member_accounts').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return (data as MemberAccountRow | null) ?? null;
}

/** Asegura fila en `usuarios` y la vincula a la cuenta. */
export async function linkOrCreateUsuario(
  sb: SupabaseClient,
  account: MemberAccountRow,
): Promise<string | null> {
  const email = account.email.toLowerCase();
  const { data: existing } = await sb.from('usuarios').select('id').eq('email', email).maybeSingle();
  if (existing?.id) {
    if (account.usuario_id !== existing.id) {
      await sb
        .from('member_accounts')
        .update({ usuario_id: existing.id, updated_at: new Date().toISOString() })
        .eq('id', account.id);
    }
    return existing.id as string;
  }

  const nombre = account.display_name?.trim() || email.split('@')[0] || 'Miembro';
  const { data: created, error } = await sb
    .from('usuarios')
    .insert({
      email,
      nombre,
      suscrito_newsletter: true,
    })
    .select('id')
    .single();
  if (error || !created?.id) return null;

  await sb
    .from('member_accounts')
    .update({ usuario_id: created.id, updated_at: new Date().toISOString() })
    .eq('id', account.id);
  return created.id as string;
}

export type MemberEventHistoryItem = {
  id: string;
  title: string;
  dateDisplay: string;
  registeredAt: string | null;
  asistio: boolean;
};

export async function fetchMemberEventHistory(
  sb: SupabaseClient,
  usuarioId: string | null,
): Promise<MemberEventHistoryItem[]> {
  if (!usuarioId) return [];
  const { data: insc, error } = await sb
    .from('inscripciones_evento')
    .select('id, evento_id, registered_at, asistio')
    .eq('usuario_id', usuarioId)
    .order('registered_at', { ascending: false });
  if (error || !insc?.length) return [];

  const eventoIds = [...new Set(insc.map((r) => r.evento_id as string).filter(Boolean))];
  const { data: eventos } = await sb
    .from('eventos')
    .select('id, title, date_display')
    .in('id', eventoIds);
  const byId = new Map((eventos ?? []).map((e) => [e.id as string, e]));

  return insc.map((r) => {
    const ev = byId.get(r.evento_id as string);
    return {
      id: r.id as string,
      title: (ev?.title as string) || 'Evento',
      dateDisplay: (ev?.date_display as string) || '',
      registeredAt: (r.registered_at as string | null) ?? null,
      asistio: Boolean(r.asistio),
    };
  });
}
