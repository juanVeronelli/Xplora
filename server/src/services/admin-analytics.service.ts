/**
 * Métricas agregadas para Analytics admin: cruza `usuarios`, `eventos` e `inscripciones_evento`.
 * Sin tabla de “hora del evento”: el mes viene del campo `month` del evento; la hora no está modelada.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import { BadRequestError } from '../http/errors/http-error.js';

const FETCH_PAGE = 1000;

export type AdminAnalyticsCemaRow = {
  segmento: string;
  inscriptos: number;
  asistieron: number;
  tasa_pct: number | null;
};

export type AdminAnalyticsModalityRow = {
  modality: string;
  inscriptos: number;
  asistieron: number;
  tasa_pct: number | null;
};

export type AdminAnalyticsTagRow = {
  tag_label: string;
  eventos_distintos: number;
  inscriptos: number;
  asistieron: number;
  tasa_pct: number | null;
};

export type AdminAnalyticsMonthRow = {
  mes_etiqueta: string;
  eventos_distintos: number;
  inscriptos: number;
  asistieron: number;
};

export type AdminAnalyticsCarreraRow = {
  carrera: string;
  personas_distintas: number;
  inscriptos: number;
  asistieron: number;
  tasa_pct: number | null;
};

export type AdminAnalyticsEventoMini = {
  evento_id: string;
  title: string;
  inscriptos: number;
  asistieron: number;
  no_shows: number;
  realizado: boolean;
  tasa_pct: number | null;
  tasa_no_show_pct: number | null;
};

export type AdminAnalyticsCsvGapRow = {
  evento_id: string;
  title: string;
  csv_inscriptos: number;
  csv_asistieron: number;
  app_inscriptos: number;
  app_asistieron: number;
};

export type AdminAnalyticsResponse = {
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
};

type EvRow = {
  id: string;
  title: string | null;
  realizado: boolean | null;
  modality: string | null;
  tag_label: string | null;
  month: string | null;
  total_inscriptos: number | null;
  total_asistieron: number | null;
  created_at: string | null;
};

type InsRow = {
  usuario_id: string;
  evento_id: string;
  asistio: boolean;
};

type UsuarioRow = {
  id: string;
  carrera: string | null;
  es_alumno_cema: boolean | null;
};

function pct(num: number, den: number): number | null {
  if (den <= 0) return null;
  return Math.round((1000 * num) / den) / 10;
}

function normCarrera(raw: string | null | undefined): string {
  const t = (raw ?? '').trim();
  return t.length ? t : 'Sin carrera indicada';
}

function normMonth(raw: string | null | undefined): string {
  const t = (raw ?? '').trim().toUpperCase();
  return t.length ? t : '—';
}

function normModality(raw: string | null | undefined): string {
  const t = (raw ?? '').trim();
  return t.length ? t : 'Sin modalidad';
}

function normTag(raw: string | null | undefined): string {
  const t = (raw ?? '').trim();
  return t.length ? t : 'Sin etiqueta';
}

async function fetchAllEventos(sb: SupabaseClient): Promise<EvRow[]> {
  const out: EvRow[] = [];
  let offset = 0;
  for (;;) {
    const { data, error } = await sb
      .from('eventos')
      .select(
        'id, title, realizado, modality, tag_label, month, total_inscriptos, total_asistieron, created_at',
      )
      .order('created_at', { ascending: false })
      .range(offset, offset + FETCH_PAGE - 1);
    if (error) throw new BadRequestError(error.message);
    const chunk = (data as EvRow[] | null) ?? [];
    out.push(...chunk);
    if (chunk.length < FETCH_PAGE) break;
    offset += FETCH_PAGE;
  }
  return out;
}

async function fetchAllInscripciones(sb: SupabaseClient): Promise<InsRow[]> {
  const out: InsRow[] = [];
  let offset = 0;
  for (;;) {
    const { data, error } = await sb
      .from('inscripciones_evento')
      .select('usuario_id, evento_id, asistio')
      .range(offset, offset + FETCH_PAGE - 1);
    if (error) throw new BadRequestError(error.message);
    const chunk = (data as InsRow[] | null) ?? [];
    out.push(...chunk);
    if (chunk.length < FETCH_PAGE) break;
    offset += FETCH_PAGE;
  }
  return out;
}

async function fetchAllUsuariosAnalytics(sb: SupabaseClient): Promise<Map<string, UsuarioRow>> {
  const map = new Map<string, UsuarioRow>();
  let offset = 0;
  for (;;) {
    const { data, error } = await sb
      .from('usuarios')
      .select('id, carrera, es_alumno_cema')
      .range(offset, offset + FETCH_PAGE - 1);
    if (error) throw new BadRequestError(error.message);
    const chunk = (data as UsuarioRow[] | null) ?? [];
    for (const r of chunk) {
      map.set(r.id, r);
    }
    if (chunk.length < FETCH_PAGE) break;
    offset += FETCH_PAGE;
  }
  return map;
}

function buildInsights(payload: {
  nIns: number;
  nUsers: number;
  tasaGlobal: number | null;
  tasaCerrados: number | null;
  cema: AdminAnalyticsCemaRow[];
  evConIns: number;
}): string[] {
  const out: string[] = [];
  if (payload.nIns < 10) {
    out.push(
      'La muestra de inscripciones todavía es chica: usá las tasas como guía, no como verdad final. Con cada evento y CSV de Luma se va estabilizando.',
    );
  }
  if (payload.evConIns < 2 && payload.nIns > 0) {
    out.push(
      'Casi todo el dato viene de pocos eventos. Cuando sumés más fechas, las comparaciones por modalidad, mes y carrera van a ser más confiables.',
    );
  }
  if (payload.tasaCerrados != null && payload.tasaCerrados < 45) {
    out.push(
      'En eventos ya cerrados, la conversión inscripto → check-in es baja: conviene recordatorios más cercanos al día, clarificar lugar/link y revisar si el horario del encuentro compite con clases.',
    );
  }
  if (payload.tasaCerrados != null && payload.tasaCerrados >= 70) {
    out.push(
      'En eventos cerrados la asistencia es alta: el formato y los canales que usás están funcionando; documentá qué hiciste distinto para repetirlo.',
    );
  }
  const alum = payload.cema.find(c => c.segmento === 'Alumnos UCEMA');
  const com = payload.cema.find(c => c.segmento === 'Comunidad');
  if (
    alum &&
    com &&
    alum.tasa_pct != null &&
    com.tasa_pct != null &&
    alum.inscriptos >= 3 &&
    com.inscriptos >= 3 &&
    Math.abs(alum.tasa_pct - com.tasa_pct) >= 12
  ) {
    out.push(
      `Hay diferencia clara de asistencia entre alumnos UCEMA (${alum.tasa_pct}%) y comunidad (${com.tasa_pct}%): podés segmentar mails y recordatorios según el perfil.`,
    );
  }
  if (payload.nUsers > 20 && payload.nIns / payload.nUsers < 1.2) {
    out.push(
      'Muchos miembros no se anotaron a ningún evento todavía: campañas que expliquen el valor del próximo meet pueden subir la participación sin depender solo de orgánico.',
    );
  }
  return out.slice(0, 8);
}

export async function fetchAdminAnalytics(sb: SupabaseClient): Promise<AdminAnalyticsResponse> {
  const [eventos, rawIns, usuariosMap] = await Promise.all([
    fetchAllEventos(sb),
    fetchAllInscripciones(sb),
    fetchAllUsuariosAnalytics(sb),
  ]);

  const eventMap = new Map<string, EvRow>();
  for (const e of eventos) eventMap.set(e.id, e);

  const advertencias: string[] = [];
  if (!rawIns.length) {
    advertencias.push(
      'Todavía no hay filas en inscripciones_evento. Cuando la gente se anote desde el sitio o importes CSV de Luma, acá se van a llenar rankings y tasas.',
    );
  }

  let inscripcionesTotales = 0;
  let asistenciasRegistradas = 0;
  let noShowsCerrados = 0;
  let inscripcionesCerrados = 0;
  let asistenciasCerrados = 0;

  /** Por evento (solo filas de app) */
  const perEv = new Map<
    string,
    { inscriptos: number; asistieron: number; no_shows: number; title: string; realizado: boolean }
  >();

  const modalityAgg = new Map<string, { inscriptos: number; asistieron: number }>();
  const tagAgg = new Map<string, { inscriptos: number; asistieron: number; eventos: Set<string> }>();
  const monthAgg = new Map<string, { inscriptos: number; asistieron: number; eventos: Set<string> }>();
  const carreraAgg = new Map<string, { inscriptos: number; asistieron: number; users: Set<string> }>();
  const cemaAgg = {
    alumno: { inscriptos: 0, asistieron: 0 },
    comunidad: { inscriptos: 0, asistieron: 0 },
  };

  const eventosConIns = new Set<string>();

  for (const row of rawIns) {
    inscripcionesTotales += 1;
    if (row.asistio) asistenciasRegistradas += 1;

    const ev = eventMap.get(row.evento_id);
    if (!ev) continue;

    eventosConIns.add(row.evento_id);

    const realizado = Boolean(ev.realizado);
    if (realizado) {
      inscripcionesCerrados += 1;
      if (row.asistio) asistenciasCerrados += 1;
      if (!row.asistio) noShowsCerrados += 1;
    }

    const title = (ev.title ?? '').trim() || 'Sin título';
    let bucket = perEv.get(row.evento_id);
    if (!bucket) {
      bucket = {
        inscriptos: 0,
        asistieron: 0,
        no_shows: 0,
        title,
        realizado,
      };
      perEv.set(row.evento_id, bucket);
    }
    bucket.inscriptos += 1;
    if (row.asistio) bucket.asistieron += 1;
    if (realizado && !row.asistio) bucket.no_shows += 1;

    const mod = normModality(ev.modality);
    const ma = modalityAgg.get(mod) ?? { inscriptos: 0, asistieron: 0 };
    ma.inscriptos += 1;
    if (row.asistio) ma.asistieron += 1;
    modalityAgg.set(mod, ma);

    const tag = normTag(ev.tag_label);
    const ta = tagAgg.get(tag) ?? { inscriptos: 0, asistieron: 0, eventos: new Set<string>() };
    ta.inscriptos += 1;
    if (row.asistio) ta.asistieron += 1;
    ta.eventos.add(row.evento_id);
    tagAgg.set(tag, ta);

    const mes = normMonth(ev.month);
    const mo = monthAgg.get(mes) ?? { inscriptos: 0, asistieron: 0, eventos: new Set<string>() };
    mo.inscriptos += 1;
    if (row.asistio) mo.asistieron += 1;
    mo.eventos.add(row.evento_id);
    monthAgg.set(mes, mo);

    const u = usuariosMap.get(row.usuario_id);
    const car = normCarrera(u?.carrera);
    const ca = carreraAgg.get(car) ?? { inscriptos: 0, asistieron: 0, users: new Set<string>() };
    ca.inscriptos += 1;
    if (row.asistio) ca.asistieron += 1;
    ca.users.add(row.usuario_id);
    carreraAgg.set(car, ca);

    const alumno = Boolean(u?.es_alumno_cema);
    const seg = alumno ? cemaAgg.alumno : cemaAgg.comunidad;
    seg.inscriptos += 1;
    if (row.asistio) seg.asistieron += 1;
  }

  const miembrosTotal = usuariosMap.size;
  let miembrosUcema = 0;
  for (const u of usuariosMap.values()) {
    if (u.es_alumno_cema) miembrosUcema += 1;
  }

  const tasaGlobal = pct(asistenciasRegistradas, inscripcionesTotales);
  const tasaCerrados = pct(asistenciasCerrados, inscripcionesCerrados);

  const por_modalidad: AdminAnalyticsModalityRow[] = [...modalityAgg.entries()]
    .map(([modality, v]) => ({
      modality,
      inscriptos: v.inscriptos,
      asistieron: v.asistieron,
      tasa_pct: pct(v.asistieron, v.inscriptos),
    }))
    .sort((a, b) => b.inscriptos - a.inscriptos);

  const por_tipo_evento: AdminAnalyticsTagRow[] = [...tagAgg.entries()]
    .map(([tag_label, v]) => ({
      tag_label,
      eventos_distintos: v.eventos.size,
      inscriptos: v.inscriptos,
      asistieron: v.asistieron,
      tasa_pct: pct(v.asistieron, v.inscriptos),
    }))
    .sort((a, b) => b.inscriptos - a.inscriptos);

  const por_mes_etiqueta: AdminAnalyticsMonthRow[] = [...monthAgg.entries()]
    .filter(([mes]) => mes !== '—')
    .map(([mes_etiqueta, v]) => ({
      mes_etiqueta,
      eventos_distintos: v.eventos.size,
      inscriptos: v.inscriptos,
      asistieron: v.asistieron,
    }))
    .sort((a, b) => b.inscriptos - a.inscriptos);

  const carreras: AdminAnalyticsCarreraRow[] = [...carreraAgg.entries()]
    .map(([carrera, v]) => ({
      carrera,
      personas_distintas: v.users.size,
      inscriptos: v.inscriptos,
      asistieron: v.asistieron,
      tasa_pct: pct(v.asistieron, v.inscriptos),
    }))
    .sort((a, b) => b.personas_distintas - a.personas_distintas)
    .slice(0, 25);

  const cema_vs_comunidad: AdminAnalyticsCemaRow[] = [
    {
      segmento: 'Alumnos UCEMA',
      inscriptos: cemaAgg.alumno.inscriptos,
      asistieron: cemaAgg.alumno.asistieron,
      tasa_pct: pct(cemaAgg.alumno.asistieron, cemaAgg.alumno.inscriptos),
    },
    {
      segmento: 'Comunidad',
      inscriptos: cemaAgg.comunidad.inscriptos,
      asistieron: cemaAgg.comunidad.asistieron,
      tasa_pct: pct(cemaAgg.comunidad.asistieron, cemaAgg.comunidad.inscriptos),
    },
  ];

  const eventoMiniList: AdminAnalyticsEventoMini[] = [...perEv.entries()].map(([evento_id, v]) => ({
    evento_id,
    title: v.title,
    inscriptos: v.inscriptos,
    asistieron: v.asistieron,
    no_shows: v.no_shows,
    realizado: v.realizado,
    tasa_pct: pct(v.asistieron, v.inscriptos),
    tasa_no_show_pct: pct(v.no_shows, v.inscriptos),
  }));

  const mas_asistencias = [...eventoMiniList]
    .sort((a, b) => b.asistieron - a.asistieron || b.inscriptos - a.inscriptos)
    .slice(0, 10);

  const mas_no_shows = [...eventoMiniList]
    .filter(e => e.realizado && e.no_shows > 0)
    .sort((a, b) => b.no_shows - a.no_shows || b.inscriptos - a.inscriptos)
    .slice(0, 10);

  const csv_vs_app: AdminAnalyticsCsvGapRow[] = eventos
    .map(ev => {
      const app = perEv.get(ev.id);
      const csvIns = ev.total_inscriptos ?? 0;
      const csvAsist = ev.total_asistieron ?? 0;
      if (csvIns === 0 && csvAsist === 0 && !app) return null;
      return {
        evento_id: ev.id,
        title: (ev.title ?? '').trim() || 'Sin título',
        csv_inscriptos: csvIns,
        csv_asistieron: csvAsist,
        app_inscriptos: app?.inscriptos ?? 0,
        app_asistieron: app?.asistieron ?? 0,
      };
    })
    .filter((x): x is AdminAnalyticsCsvGapRow => x != null)
    .filter(r => r.csv_inscriptos > 0 || r.csv_asistieron > 0 || r.app_inscriptos > 0)
    .sort((a, b) => {
      const gap = (x: AdminAnalyticsCsvGapRow) =>
        Math.abs(x.csv_inscriptos - x.app_inscriptos) + Math.abs(x.csv_asistieron - x.app_asistieron);
      return gap(b) - gap(a);
    })
    .slice(0, 15);

  const insights = buildInsights({
    nIns: inscripcionesTotales,
    nUsers: miembrosTotal,
    tasaGlobal,
    tasaCerrados,
    cema: cema_vs_comunidad,
    evConIns: eventosConIns.size,
  });

  return {
    generated_at: new Date().toISOString(),
    muestra: {
      usuarios: miembrosTotal,
      inscripciones: inscripcionesTotales,
      eventos_en_catalogo: eventos.length,
      eventos_con_inscripciones: eventosConIns.size,
    },
    advertencias,
    insights,
    resumen: {
      miembros_total: miembrosTotal,
      miembros_alumnos_ucema: miembrosUcema,
      inscripciones_totales: inscripcionesTotales,
      asistencias_registradas: asistenciasRegistradas,
      no_shows_solo_eventos_cerrados: noShowsCerrados,
      tasa_asistencia_global_pct: tasaGlobal,
      tasa_asistencia_eventos_cerrados_pct: inscripcionesCerrados > 0 ? tasaCerrados : null,
    },
    por_modalidad,
    por_tipo_evento,
    por_mes_etiqueta,
    carreras,
    cema_vs_comunidad,
    ranking: {
      mas_asistencias,
      mas_no_shows,
    },
    calidad_datos: {
      csv_vs_app,
    },
  };
}
