/**
 * Lectura del catálogo público (eventos, charlas, empleos).
 *
 * Todo pasa por el **backend Express** (`/api/public/*`), no desde el browser directo a Supabase,
 * para no exponer detalles de BD y mantener un único contrato HTTP.
 *
 * - `fetch*` / `map*`: datos ya mapeados al modelo de UI (`Evento`, etc.).
 * - `fetchRaw*`: filas tal cual vienen de Supabase (`DbEvento`, snake_case) — útiles en el admin.
 */
import type { Evento, Charla, Empleo, DbEvento, DbCharla, DbEmpleo, Speaker } from '../types';
import { publicFetch, authFetch } from './serverApi';

/** Convierte una fila `eventos` de Supabase al tipo que consume la web pública. */
export function mapEvento(r: DbEvento): Evento {
  const thumb = r.thumbnail_url?.trim();
  const poster = r.home_poster_url?.trim();
  return {
    id: r.id,
    title: r.title,
    emoji: r.emoji || '',
    thumbnailUrl: thumb || undefined,
    homePosterUrl: poster || undefined,
    tagType: (r.tag_type as Evento['tagType']) || 'p',
    tagLabel: r.tag_label || '',
    date: r.date_display || '',
    day: r.day || '',
    month: r.month || '',
    location: r.location || '',
    modality: r.modality,
    capacity: r.capacity,
    cost: r.cost,
    registrationLink: r.registration_link,
    desc: r.summary || '',
    about: r.about,
    speakerName: r.speaker_name || '',
    speakerRole: r.speaker_role || '',
    speakerInitials: r.speaker_initials || '',
    speakerBio: r.speaker_bio,
    speakers: (r.speakers || []) as Speaker[],
  };
}

/** Igual que {@link mapEvento} para la tabla `charlas`. */
export function mapCharla(r: DbCharla): Charla {
  const thumb = r.thumbnail_url?.trim();
  return {
    id: r.id,
    title: r.title,
    emoji: r.emoji || '',
    thumbnailUrl: thumb || undefined,
    speakerName: r.speaker_name || '',
    speakerInitials: r.speaker_initials || '',
    speakerBio: r.speaker_bio || '',
    tagType: (r.tag_type as Charla['tagType']) || 'p',
    tagLabel: r.tag_label || '',
    date: r.date_display || '',
    about: r.about || '',
    topics: r.topics || [],
    whyXplora: r.why_xplora || '',
    duration: r.duration || '',
    attendees: r.attendees || '',
    recordingLink: r.recording_link,
    materialLink: r.material_link,
  };
}

/** Igual que {@link mapEvento} para la tabla `empleos`. */
export function mapEmpleo(r: DbEmpleo): Empleo {
  const thumb = r.thumbnail_url?.trim();
  return {
    id: r.id,
    title: r.title,
    company: r.company || '',
    location: r.location || '',
    emoji: r.emoji || '',
    thumbnailUrl: thumb || undefined,
    type: r.type || '',
    typeTag: (r.type_tag as Empleo['typeTag']) || 'g',
    area: r.area || '',
    description: r.description,
    requirements: r.requirements,
    benefits: r.benefits,
    applicationLink: r.application_link,
  };
}

/** Lista de eventos para el sitio público; ante error HTTP devuelve `[]` (degradación suave). */
export async function fetchEventos(): Promise<Evento[]> {
  const res = await publicFetch('/api/public/eventos');
  if (!res.ok) return [];
  const data = (await res.json()) as DbEvento[];
  return data.map(mapEvento);
}

/** Lista de charlas pasadas para el sitio público. */
export async function fetchCharlas(): Promise<Charla[]> {
  const res = await publicFetch('/api/public/charlas');
  if (!res.ok) return [];
  const data = (await res.json()) as DbCharla[];
  return data.map(mapCharla);
}

/** Lista de ofertas de la bolsa laboral. */
export async function fetchEmpleos(): Promise<Empleo[]> {
  const res = await publicFetch('/api/public/empleos');
  if (!res.ok) return [];
  const data = (await res.json()) as DbEmpleo[];
  return data.map(mapEmpleo);
}

/** Filas crudas para el panel admin: todos los eventos (incluye `realizado`). Requiere sesión. */
export async function fetchAdminEventos(): Promise<DbEvento[]> {
  const res = await authFetch('/api/admin/eventos');
  if (!res.ok) return [];
  return (await res.json()) as DbEvento[];
}

/** Lectura pública (solo próximos: `realizado = false` en el servidor). */
export async function fetchRawEventos(): Promise<DbEvento[]> {
  const res = await publicFetch('/api/public/eventos');
  if (!res.ok) return [];
  return (await res.json()) as DbEvento[];
}

/** Ver {@link fetchRawEventos}. */
export async function fetchRawCharlas(): Promise<DbCharla[]> {
  const res = await publicFetch('/api/public/charlas');
  if (!res.ok) return [];
  return (await res.json()) as DbCharla[];
}

/** Ver {@link fetchRawEventos}. */
export async function fetchRawEmpleos(): Promise<DbEmpleo[]> {
  const res = await publicFetch('/api/public/empleos');
  if (!res.ok) return [];
  return (await res.json()) as DbEmpleo[];
}
