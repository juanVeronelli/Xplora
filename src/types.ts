/**
 * Tipos compartidos front + contratos con la API.
 *
 * - **UI** (`Evento`, `Charla`, `Empleo`): camelCase, lo que renderizan las páginas.
 * - **DB** (`Db*`): reflejo de columnas Supabase en snake_case; el admin y el server las usan al guardar.
 */
export interface Speaker {
  name: string;
  role: string;
  initials: string;
  bio: string;
}

export type Page =
  | 'home'
  | 'eventos'
  | 'evento-detail'
  | 'charlas'
  | 'charla-detail'
  | 'bolsa'
  | 'empleo-detail'
  | 'somos'
  | 'sponsors'
  | 'admin';

export interface Evento {
  id: string;
  emoji: string;
  /** Miniatura de tarjeta (URL); si falta, se usa el símbolo o un degradado. */
  thumbnailUrl?: string;
  day: string;
  month: string;
  tagLabel: string;
  tagType: 'p' | 'g' | 'o' | 'n';
  title: string;
  date: string;
  location: string;
  modality?: string;
  capacity?: string;
  cost?: string;
  registrationLink?: string;
  desc: string;
  about?: string;
  speakerInitials: string;
  speakerName: string;
  speakerRole: string;
  speakerBio?: string;
  speakers?: Speaker[];
}

export interface Charla {
  id: string;
  emoji: string;
  thumbnailUrl?: string;
  date: string;
  title: string;
  speakerInitials: string;
  speakerName: string;
  tagLabel: string;
  tagType: 'p' | 'g' | 'o' | 'n';
  about: string;
  topics: string[];
  duration: string;
  attendees: string;
  speakerBio: string;
  whyXplora: string;
  recordingLink?: string;
  materialLink?: string;
}

export interface Empleo {
  id: string;
  emoji: string;
  thumbnailUrl?: string;
  title: string;
  company: string;
  location: string;
  type: string;
  typeTag: 'p' | 'g' | 'o' | 'n';
  area: string;
  description?: string;
  requirements?: string;
  benefits?: string;
  applicationLink?: string;
}

// DB row types (snake_case from Supabase)
export interface DbEvento {
  id: string;
  title: string;
  emoji: string;
  tag_type: string;
  tag_label: string;
  date_display: string;
  day: string;
  month: string;
  location: string;
  modality: string;
  capacity: string;
  cost: string;
  registration_link: string;
  summary: string;
  about: string;
  speaker_name: string;
  speaker_role: string;
  speaker_initials: string;
  speaker_bio: string;
  speakers: Speaker[];
  /** URL de imagen para tarjetas (Cloudinary, etc.) */
  thumbnail_url?: string | null;
  /** Último CSV Luma importado (panel admin). */
  total_inscriptos?: number | null;
  total_asistieron?: number | null;
  luma_csv_imported_at?: string | null;
  /** No listar en próximos eventos del sitio si ya pasó / está archivado en Eventos pasados. */
  realizado?: boolean | null;
  created_at: string;
}

export interface DbCharla {
  id: string;
  evento_id?: string;
  title: string;
  emoji: string;
  speaker_name: string;
  speaker_initials: string;
  speaker_bio: string;
  tag_type: string;
  tag_label: string;
  date_display: string;
  about: string;
  topics: string[];
  why_xplora: string;
  duration: string;
  attendees: string;
  recording_link: string;
  material_link: string;
  thumbnail_url?: string | null;
  created_at: string;
}

export interface DbEmpleo {
  id: string;
  title: string;
  company: string;
  location: string;
  emoji: string;
  type: string;
  type_tag: string;
  area: string;
  description: string;
  requirements: string;
  benefits: string;
  application_link: string;
  thumbnail_url?: string | null;
  created_at: string;
}

/** Foto del carrusel (URL en Cloudinary o ruta local por defecto) */
export interface CarouselSlide {
  id: string;
  url: string;
  label: string;
}

/** Logo de marca (URL Cloudinary o /public/...) */
export interface LogoBrand {
  id: string;
  name: string;
  logoUrl: string;
}

export interface DbSiteMedia {
  id: string;
  hero_url: string | null;
  logo_url: string | null;
  /** Video sección “charlas / momentos” en la Home. */
  highlight_video_url?: string | null;
  carousel: CarouselSlide[] | null;
  company_logos?: unknown;
  sponsor_logos?: unknown;
  updated_at: string;
}

/** Inscripción a un evento en el listado de miembros (detalle para validar el %). */
export interface AdminMemberInscripcionResumen {
  evento_id: string;
  title: string;
  asistio: boolean;
  /** Fecha de inscripción (`inscripciones_evento.registered_at`). */
  registered_at?: string;
}

/** Fila de miembro en panel Database (`GET /api/admin/members`). */
export interface AdminMemberRow {
  id: string;
  nombre: string;
  email: string;
  carrera: string;
  /** Derivado de `inscripciones`; puede omitirse en respuestas viejas. */
  pct_asistencia: number | null;
  eventos_inscripto: number;
  eventos_asistio: number;
  /** Vacío si no hay filas en `inscripciones_evento`. */
  inscripciones?: AdminMemberInscripcionResumen[];
  /** Columnas de `public.usuarios` (para export / listas guardadas). */
  es_alumno_cema?: boolean;
  created_at?: string | null;
  updated_at?: string | null;
  /** Copia de contadores en BD (trigger); deben coincidir con inscripciones reales. */
  usuario_eventos_anotado?: number | null;
  usuario_eventos_asistio?: number | null;
}

/** Filtros guardados con una lista de contactos (referencia al crear la lista). */
export interface ContactListFilterSnapshot {
  email_contains?: string;
  carrera?: string;
  pct_min?: string;
  pct_max?: string;
  /** '' | 'yes' | 'no' — alumno UCEMA según formulario. */
  es_alumno_cema?: '' | 'yes' | 'no';
}

/** Lista guardada (`GET /api/admin/contact-lists`). */
export interface ContactListSummary {
  id: string;
  nombre: string;
  descripcion: string | null;
  member_count: number;
  filter_snapshot: ContactListFilterSnapshot | null;
  created_at: string;
  updated_at: string;
}

/** Snapshot persistido por miembro en una lista (`snapshot` JSONB). */
export interface ContactListMemberSnapshotV1 {
  v: 1;
  captured_at: string;
  row: AdminMemberRow;
}

export interface ContactListMemberApiRow {
  id: string;
  usuario_id: string | null;
  snapshot: ContactListMemberSnapshotV1;
}

/** Campaña para selectores (`GET /api/admin/email-campaigns`). */
export interface AdminEmailCampaignListItem {
  id: string;
  titulo_interno: string | null;
  asunto: string | null;
  /** Clave de plantilla (`emailTemplates/registry.ts`). */
  template_id: string;
}

/** Miembro + si recibió la campaña elegida (`GET /api/admin/email-campaigns/:id/audience`). */
export interface AdminCampaignAudienceMember extends AdminMemberRow {
  enviado: boolean;
}

/** Respuesta audiencia por campaña. */
export interface AdminCampaignAudienceResponse {
  campaign: AdminEmailCampaignListItem;
  rows: AdminCampaignAudienceMember[];
}

/** Fila de `GET /api/admin/eventos/:eventoId/inscripciones`. */
export interface AdminEventoInscripcionRow {
  usuario_id: string;
  nombre: string;
  email: string;
  carrera: string;
  asistio: boolean;
  registered_at: string;
  asistio_at: string | null;
}

export interface AdminEventoInscripcionesResponse {
  evento: {
    id: string;
    title: string;
    date_display: string | null;
    realizado: boolean | null;
  };
  rows: AdminEventoInscripcionRow[];
}

/** Respuesta `GET /api/admin/analytics` — métricas agregadas para el panel. */
export interface AdminAnalyticsCemaRow {
  segmento: string;
  inscriptos: number;
  asistieron: number;
  tasa_pct: number | null;
}

export interface AdminAnalyticsModalityRow {
  modality: string;
  inscriptos: number;
  asistieron: number;
  tasa_pct: number | null;
}

export interface AdminAnalyticsTagRow {
  tag_label: string;
  eventos_distintos: number;
  inscriptos: number;
  asistieron: number;
  tasa_pct: number | null;
}

export interface AdminAnalyticsMonthRow {
  mes_etiqueta: string;
  eventos_distintos: number;
  inscriptos: number;
  asistieron: number;
}

export interface AdminAnalyticsCarreraRow {
  carrera: string;
  personas_distintas: number;
  inscriptos: number;
  asistieron: number;
  tasa_pct: number | null;
}

export interface AdminAnalyticsEventoMini {
  evento_id: string;
  title: string;
  inscriptos: number;
  asistieron: number;
  no_shows: number;
  realizado: boolean;
  tasa_pct: number | null;
  tasa_no_show_pct: number | null;
}

export interface AdminAnalyticsCsvGapRow {
  evento_id: string;
  title: string;
  csv_inscriptos: number;
  csv_asistieron: number;
  app_inscriptos: number;
  app_asistieron: number;
}

export interface AdminAnalyticsResponse {
  generated_at: string;
  muestra: {
    usuarios: number;
    inscripciones: number;
    eventos_en_catalogo: number;
    eventos_con_inscripciones: number;
  };
  advertencias: string[];
  insights: string[];
  resumen: {
    miembros_total: number;
    miembros_alumnos_ucema: number;
    inscripciones_totales: number;
    asistencias_registradas: number;
    no_shows_solo_eventos_cerrados: number;
    tasa_asistencia_global_pct: number | null;
    tasa_asistencia_eventos_cerrados_pct: number | null;
  };
  por_modalidad: AdminAnalyticsModalityRow[];
  por_tipo_evento: AdminAnalyticsTagRow[];
  por_mes_etiqueta: AdminAnalyticsMonthRow[];
  carreras: AdminAnalyticsCarreraRow[];
  cema_vs_comunidad: AdminAnalyticsCemaRow[];
  ranking: {
    mas_asistencias: AdminAnalyticsEventoMini[];
    mas_no_shows: AdminAnalyticsEventoMini[];
  };
  calidad_datos: {
    csv_vs_app: AdminAnalyticsCsvGapRow[];
  };
}
