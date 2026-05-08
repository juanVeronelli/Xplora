/**
 * Pestaña **Analytics**: KPIs y tablas derivadas de usuarios, eventos e inscripciones (actualización al cargar / refrescar).
 */
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import type { AdminAnalyticsResponse, AdminInstagramReelsAnalyticsResponse, AdminTalentAnalyticsResponse } from '../../types';
import { authFetch, readApiError } from '../../lib/serverApi';
import { CrmSection, Spinner } from './crm/CrmUi';
import { crm } from './crm/crmTheme';
import { useToast } from '../../context/FeedbackContext';

type SortDir = 'asc' | 'desc';
type IgSortKey =
  | 'timestamp'
  | 'reach'
  | 'views'
  | 'likes'
  | 'comments'
  | 'shares'
  | 'saved'
  | 'total_interactions'
  | 'watch_time'
  | 'avg_watch'
  | 'skip_rate';

function pctLabel(v: number | null): string {
  if (v == null) return '—';
  return `${v}%`;
}

function fmtNum(v: number | null): string {
  if (v == null || !Number.isFinite(v)) return '—';
  return new Intl.NumberFormat('es-AR').format(v);
}

function fmtPct01(v: number | null): string {
  if (v == null || !Number.isFinite(v)) return '—';
  return `${Math.round(v * 1000) / 10}%`;
}

function fmtTimeSeconds(v: number | null): string {
  if (v == null || !Number.isFinite(v)) return '—';
  const s = Math.max(0, Math.round(v));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m`;
  return `${m}m ${String(ss).padStart(2, '0')}s`;
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div
      style={{
        ...crm.listCard,
        flex: '1 1 140px',
        maxWidth: 220,
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: 6,
      }}
    >
      <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--ink-muted)', textTransform: 'uppercase' }}>
        {label}
      </span>
      <span style={{ fontFamily: "'Fraunces', serif", fontSize: 26, fontWeight: 700, color: 'var(--ink)', lineHeight: 1.1 }}>{value}</span>
      {hint ? <span style={{ fontSize: 12, color: 'var(--ink-muted)', lineHeight: 1.4 }}>{hint}</span> : null}
    </div>
  );
}

function DataTable({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div style={{ marginBottom: 28 }}>
      <h3 style={{ fontFamily: "'Fraunces', serif", fontSize: 17, fontWeight: 700, color: 'var(--ink)', margin: '0 0 12px' }}>{title}</h3>
      <div style={{ overflowX: 'auto', borderRadius: 12, border: '1px solid rgba(26,16,40,0.08)', background: '#fff' }}>
        {children}
      </div>
    </div>
  );
}

const th: React.CSSProperties = {
  textAlign: 'left',
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: 'var(--ink-muted)',
  padding: '10px 12px',
  borderBottom: '1px solid rgba(26,16,40,0.08)',
  whiteSpace: 'nowrap',
};
const td: React.CSSProperties = {
  fontSize: 14,
  color: 'var(--ink-soft)',
  padding: '10px 12px',
  borderBottom: '1px solid rgba(26,16,40,0.06)',
  verticalAlign: 'top',
};

export default function AnalyticsPanel() {
  const toast = useToast();
  const [data, setData] = useState<AdminAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [view, setView] = useState<'xplora' | 'instagram' | 'talento'>('xplora');

  const [talent, setTalent] = useState<AdminTalentAnalyticsResponse | null>(null);
  const [talentLoading, setTalentLoading] = useState(false);
  const [talentError, setTalentError] = useState('');

  const [ig, setIg] = useState<AdminInstagramReelsAnalyticsResponse | null>(null);
  const [igLoading, setIgLoading] = useState(false);
  const [igError, setIgError] = useState('');
  const [igSortKey, setIgSortKey] = useState<IgSortKey>('timestamp');
  const [igSortDir, setIgSortDir] = useState<SortDir>('desc');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    const res = await authFetch('/api/admin/analytics');
    if (!res.ok) {
      const msg = await readApiError(res);
      setError(msg);
      toast.error(msg);
      setLoading(false);
      return;
    }
    setData((await res.json()) as AdminAnalyticsResponse);
    setLoading(false);
  }, [toast]);

  const loadTalent = useCallback(async () => {
    setTalentLoading(true);
    setTalentError('');
    const res = await authFetch('/api/admin/talent-analytics');
    if (!res.ok) {
      const msg = await readApiError(res);
      setTalentError(msg);
      toast.error(msg);
      setTalentLoading(false);
      return;
    }
    setTalent((await res.json()) as AdminTalentAnalyticsResponse);
    setTalentLoading(false);
  }, [toast]);

  const loadIg = useCallback(
    async (year: number) => {
      setIgLoading(true);
      setIgError('');
      const res = await authFetch(`/api/admin/instagram/reels/analytics?year=${encodeURIComponent(String(year))}`);
      if (!res.ok) {
        const msg = await readApiError(res);
        setIgError(msg);
        toast.error(msg);
        setIgLoading(false);
        return;
      }
      setIg((await res.json()) as AdminInstagramReelsAnalyticsResponse);
      setIgLoading(false);
    },
    [toast],
  );

  useEffect(() => {
    void load();
    void loadTalent();
  }, [load, loadTalent]);

  const updated =
    data?.generated_at &&
    new Date(data.generated_at).toLocaleString('es-AR', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });

  const igSorted = (() => {
    if (!ig) return null;
    const num = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null);
    const get = (r: AdminInstagramReelsAnalyticsResponse['reels'][number]): number | string | null => {
      switch (igSortKey) {
        case 'timestamp':
          return r.timestamp || '';
        case 'reach':
          return num(r.insights.reach);
        case 'views':
          return num(r.insights.views);
        case 'likes':
          return num(r.insights.likes ?? r.like_count);
        case 'comments':
          return num(r.insights.comments ?? r.comments_count);
        case 'shares':
          return num(r.insights.shares);
        case 'saved':
          return num(r.insights.saved);
        case 'total_interactions':
          return num(r.insights.total_interactions);
        case 'watch_time':
          return num(r.insights.ig_reels_video_view_total_time);
        case 'avg_watch':
          return num(r.insights.ig_reels_avg_watch_time);
        case 'skip_rate':
          return num(r.insights.reels_skip_rate);
      }
    };
    const dir = igSortDir === 'asc' ? 1 : -1;
    const reels = [...ig.reels];
    reels.sort((a, b) => {
      const av = get(a);
      const bv = get(b);
      if (typeof av === 'string' || typeof bv === 'string') {
        const as = String(av ?? '');
        const bs = String(bv ?? '');
        return dir * bs.localeCompare(as); // timestamp default desc if dir is desc
      }
      const an = av ?? -Infinity;
      const bn = bv ?? -Infinity;
      if (an === bn) return 0;
      return dir * (an > bn ? 1 : -1);
    });
    return { ...ig, reels };
  })();

  const igSortTh = (label: string, key: IgSortKey): ReactNode => {
    const active = igSortKey === key;
    const arrow = active ? (igSortDir === 'asc' ? '↑' : '↓') : '';
    return (
      <button
        type="button"
        onClick={() => {
          if (igSortKey === key) setIgSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
          else {
            setIgSortKey(key);
            setIgSortDir(key === 'timestamp' ? 'desc' : 'desc');
          }
        }}
        style={{
          all: 'unset',
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          color: active ? 'var(--purple)' : 'inherit',
        }}
        title="Ordenar"
      >
        <span>{label}</span>
        <span style={{ fontSize: 12, opacity: active ? 1 : 0.5 }}>{arrow || '↕'}</span>
      </button>
    );
  };

  return (
    <CrmSection
      kicker="Indicadores"
      title="Analytics"
      subtitle="Números coherentes con tu base: inscripciones y check-in en la app, CSV Luma para contrastar, eventos cerrados para no-shows. Actualizá para refrescar."
      onNew={() => {}}
      showNew={false}
    >
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 20 }}>
        <p style={{ margin: 0, fontSize: 13, color: 'var(--ink-muted)' }}>
          {updated ? <>Última lectura: {updated}</> : null}
        </p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            type="button"
            style={{
              ...crm.chipBtn,
              background: view === 'xplora' ? 'var(--purple-soft)' : 'var(--white)',
              borderColor: view === 'xplora' ? 'rgba(96,62,249,.22)' : 'var(--border-warm)',
              color: view === 'xplora' ? 'var(--purple)' : 'var(--ink-muted)',
            }}
            onClick={() => setView('xplora')}
          >
            Xplora
          </button>
          <button
            type="button"
            style={{
              ...crm.chipBtn,
              background: view === 'instagram' ? 'var(--purple-soft)' : 'var(--white)',
              borderColor: view === 'instagram' ? 'rgba(96,62,249,.22)' : 'var(--border-warm)',
              color: view === 'instagram' ? 'var(--purple)' : 'var(--ink-muted)',
            }}
            onClick={() => {
              setView('instagram');
              if (!ig && !igLoading) void loadIg(new Date().getFullYear());
            }}
          >
            Instagram
          </button>
          <button
            type="button"
            style={{
              ...crm.chipBtn,
              background: view === 'talento' ? 'var(--purple-soft)' : 'var(--white)',
              borderColor: view === 'talento' ? 'rgba(96,62,249,.22)' : 'var(--border-warm)',
              color: view === 'talento' ? 'var(--purple)' : 'var(--ink-muted)',
            }}
            onClick={() => {
              setView('talento');
              if (!talent && !talentLoading) void loadTalent();
            }}
          >
            Talento
          </button>
          <button
            type="button"
            style={crm.chipBtn}
            onClick={() =>
              view === 'instagram'
                ? void loadIg(ig?.year ?? new Date().getFullYear())
                : view === 'talento'
                  ? void loadTalent()
                  : void load()
            }
            disabled={view === 'instagram' ? igLoading : view === 'talento' ? talentLoading : loading}
          >
            {view === 'instagram'
              ? igLoading
                ? 'Actualizando…'
                : 'Actualizar IG'
              : view === 'talento'
                ? talentLoading
                  ? 'Actualizando…'
                  : 'Actualizar talento'
                : loading
                  ? 'Actualizando…'
                  : 'Actualizar datos'}
          </button>
        </div>
      </div>

      {view === 'instagram' ? (
        igLoading && !ig ? (
          <Spinner />
        ) : igError && !ig ? (
          <p style={{ color: '#9b2c20', fontSize: 14 }}>{igError}</p>
        ) : igSorted ? (
          <>
            <div style={{ ...crm.listCard, marginBottom: 20, flexDirection: 'column', alignItems: 'stretch', gap: 10 }}>
              <strong style={{ fontSize: 13, color: 'var(--ink)' }}>Reels del {igSorted.year}</strong>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--ink-muted)', lineHeight: 1.55 }}>
                Datos desde Meta Graph API (media + insights). Algunos campos pueden venir vacíos según permisos/token o disponibilidad (hasta 48h de delay).
              </p>
            </div>

            <DataTable title={`Reels (${igSorted.reels.length})`}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={th}>{igSortTh('Fecha', 'timestamp')}</th>
                    <th style={th}>Caption</th>
                    <th style={th}>{igSortTh('Reach', 'reach')}</th>
                    <th style={th}>{igSortTh('Views', 'views')}</th>
                    <th style={th}>{igSortTh('Likes', 'likes')}</th>
                    <th style={th}>{igSortTh('Comentarios', 'comments')}</th>
                    <th style={th}>{igSortTh('Compartidos', 'shares')}</th>
                    <th style={th}>{igSortTh('Guardados', 'saved')}</th>
                    <th style={th}>{igSortTh('Interacciones', 'total_interactions')}</th>
                    <th style={th}>{igSortTh('Watch time', 'watch_time')}</th>
                    <th style={th}>{igSortTh('Avg watch', 'avg_watch')}</th>
                    <th style={th}>{igSortTh('Skip rate', 'skip_rate')}</th>
                    <th
                      style={{
                        ...th,
                        position: 'sticky',
                        right: 0,
                        background: '#fff',
                        boxShadow: '-8px 0 16px rgba(26,16,40,0.06)',
                        zIndex: 2,
                      }}
                    >
                      Link
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {igSorted.reels.length === 0 ? (
                    <tr>
                      <td style={td} colSpan={13}>
                        Sin reels detectados para ese año (o falta de permisos).
                      </td>
                    </tr>
                  ) : (
                    igSorted.reels.map(r => (
                      <tr key={r.id}>
                        <td style={td}>
                          {r.timestamp ? new Date(r.timestamp).toLocaleDateString('es-AR', { dateStyle: 'medium' }) : '—'}
                        </td>
                        <td style={{ ...td, maxWidth: 520 }}>
                          <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {r.caption ?? '—'}
                          </span>
                        </td>
                        <td style={td}>{fmtNum(r.insights.reach)}</td>
                        <td style={td}>{fmtNum(r.insights.views)}</td>
                        <td style={td}>{fmtNum(r.insights.likes ?? r.like_count)}</td>
                        <td style={td}>{fmtNum(r.insights.comments ?? r.comments_count)}</td>
                        <td style={td}>{fmtNum(r.insights.shares)}</td>
                        <td style={td}>{fmtNum(r.insights.saved)}</td>
                        <td style={td}>{fmtNum(r.insights.total_interactions)}</td>
                        <td style={td}>{fmtTimeSeconds(r.insights.ig_reels_video_view_total_time)}</td>
                        <td style={td}>{fmtTimeSeconds(r.insights.ig_reels_avg_watch_time)}</td>
                        <td style={td}>{fmtPct01(r.insights.reels_skip_rate)}</td>
                        <td
                          style={{
                            ...td,
                            position: 'sticky',
                            right: 0,
                            background: '#fff',
                            boxShadow: '-8px 0 16px rgba(26,16,40,0.06)',
                          }}
                        >
                          {r.permalink ? (
                            <a href={r.permalink} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--purple)', textDecoration: 'none' }}>
                              Abrir →
                            </a>
                          ) : (
                            '—'
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </DataTable>
          </>
        ) : null
      ) : view === 'talento' ? (
        talentLoading && !talent ? (
          <Spinner />
        ) : talentError && !talent ? (
          <p style={{ color: '#9b2c20', fontSize: 14 }}>{talentError}</p>
        ) : talent ? (
          <>
            <div style={{ ...crm.listCard, marginBottom: 20, flexDirection: 'column', alignItems: 'stretch', gap: 10 }}>
              <strong style={{ fontSize: 13, color: 'var(--ink)' }}>Talento y bolsa (interno)</strong>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--ink-muted)', lineHeight: 1.55 }}>
                Totales y tendencias basadas en <code style={{ fontSize: 12 }}>talent_profiles</code>,{' '}
                <code style={{ fontSize: 12 }}>job_applications</code> y <code style={{ fontSize: 12 }}>empleos</code>.
              </p>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 14 }}>
              <StatCard label="Talento en DB" value={fmtNum(talent.totals.talent_total)} />
              <StatCard
                label="Aplicaron (personas)"
                value={fmtNum(talent.totals.applicants_total)}
                hint="Usuarios únicos con al menos 1 postulación."
              />
              <StatCard label="Postulaciones" value={fmtNum(talent.totals.applications_total)} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
              <div style={{ ...crm.listCard, flexDirection: 'column', alignItems: 'stretch', gap: 10 }}>
                <strong style={{ fontSize: 13, color: 'var(--ink)' }}>Top categorías (área del empleo)</strong>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {(talent.top_areas ?? []).slice(0, 15).map(r => (
                    <div key={r.area} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 13 }}>
                      <span style={{ color: 'var(--ink-soft)' }}>{r.area}</span>
                      <span style={{ color: 'var(--ink-muted)' }}>{fmtNum(r.applications)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ ...crm.listCard, flexDirection: 'column', alignItems: 'stretch', gap: 10 }}>
                <strong style={{ fontSize: 13, color: 'var(--ink)' }}>Postulaciones por carrera</strong>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {(talent.by_career ?? []).slice(0, 15).map(r => (
                    <div key={r.career} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 13 }}>
                      <span style={{ color: 'var(--ink-soft)' }}>{r.career}</span>
                      <span style={{ color: 'var(--ink-muted)' }}>
                        {fmtNum(r.applicants)} / {fmtNum(r.applications)}
                      </span>
                    </div>
                  ))}
                </div>
                <div style={{ fontSize: 12, color: 'var(--ink-muted)' }}>Formato: applicants / applications</div>
              </div>
            </div>
          </>
        ) : null
      ) : loading && !data ? (
        <Spinner />
      ) : error && !data ? (
        <p style={{ color: '#9b2c20', fontSize: 14 }}>{error}</p>
      ) : data ? (
        <>
          <div
            style={{
              ...crm.listCard,
              marginBottom: 20,
              flexDirection: 'column',
              alignItems: 'stretch',
              gap: 10,
              background: 'rgba(96,62,249,0.06)',
              borderColor: 'rgba(96,62,249,0.15)',
            }}
          >
            <strong style={{ fontSize: 13, color: 'var(--ink)' }}>Cómo leer estos datos</strong>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: 'var(--ink-soft)', lineHeight: 1.55 }}>
              <li>
                <strong>Inscripto</strong> = hay fila en <code style={{ fontSize: 12 }}>inscripciones_evento</code> (web o proceso interno).
              </li>
              <li>
                <strong>Asistió</strong> = check-in marcado (<code style={{ fontSize: 12 }}>asistio</code>), p. ej. tras importar CSV de Luma.
              </li>
              <li>
                <strong>No-show</strong> (solo si el evento está <strong>cerrado</strong> en el panel: realizado) = inscripto y sin check-in.
              </li>
              <li>
                <strong>Hora del encuentro</strong> no está en base como campo numérico; el apartado «Mes en la tarjeta» usa el texto del mes del evento (convivencia con calendario del sitio).
              </li>
            </ul>
          </div>

          {data.advertencias.length > 0 && (
            <div style={{ ...crm.listCard, marginBottom: 16, background: '#fff8f0', borderColor: 'rgba(200,120,40,0.25)' }}>
              {data.advertencias.map((a, i) => (
                <p key={i} style={{ margin: 0, fontSize: 13, color: 'var(--ink-soft)', lineHeight: 1.5 }}>
                  {a}
                </p>
              ))}
            </div>
          )}

          {data.insights.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <h3 style={{ fontFamily: "'Fraunces', serif", fontSize: 17, fontWeight: 700, margin: '0 0 10px' }}>Ideas para actuar</h3>
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 14, color: 'var(--ink-soft)', lineHeight: 1.6 }}>
                {data.insights.map((t, i) => (
                  <li key={i}>{t}</li>
                ))}
              </ul>
            </div>
          )}

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 28 }}>
            <StatCard label="Miembros" value={String(data.muestra.usuarios)} hint={`${data.resumen.miembros_alumnos_ucema} alumno UCEMA`} />
            <StatCard label="Inscripciones (filas)" value={String(data.resumen.inscripciones_totales)} />
            <StatCard label="Check-ins" value={String(data.resumen.asistencias_registradas)} />
            <StatCard
              label="Tasa asist. global"
              value={pctLabel(data.resumen.tasa_asistencia_global_pct)}
              hint="Sobre todas las inscripciones"
            />
            <StatCard
              label="Tasa en eventos cerrados"
              value={pctLabel(data.resumen.tasa_asistencia_eventos_cerrados_pct)}
              hint="Solo eventos marcados realizados"
            />
            <StatCard
              label="No-shows (cerrados)"
              value={String(data.resumen.no_shows_solo_eventos_cerrados)}
              hint="Inscriptos sin check-in"
            />
          </div>

          <p style={{ fontSize: 13, color: 'var(--ink-muted)', marginBottom: 24 }}>
            Eventos en catálogo: <strong>{data.muestra.eventos_en_catalogo}</strong> · Con al menos una inscripción en app:{' '}
            <strong>{data.muestra.eventos_con_inscripciones}</strong>
          </p>

          <DataTable title="Alumnos UCEMA vs comunidad (por filas de inscripción)">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={th}>Segmento</th>
                  <th style={th}>Inscriptos</th>
                  <th style={th}>Check-in</th>
                  <th style={th}>Tasa</th>
                </tr>
              </thead>
              <tbody>
                {data.cema_vs_comunidad.map(row => (
                  <tr key={row.segmento}>
                    <td style={td}>{row.segmento}</td>
                    <td style={td}>{row.inscriptos}</td>
                    <td style={td}>{row.asistieron}</td>
                    <td style={td}>{pctLabel(row.tasa_pct)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </DataTable>

          <DataTable title="Por modalidad del evento">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={th}>Modalidad</th>
                  <th style={th}>Inscriptos</th>
                  <th style={th}>Check-in</th>
                  <th style={th}>Tasa</th>
                </tr>
              </thead>
              <tbody>
                {data.por_modalidad.length === 0 ? (
                  <tr>
                    <td style={td} colSpan={4}>
                      Sin datos todavía.
                    </td>
                  </tr>
                ) : (
                  data.por_modalidad.map(row => (
                    <tr key={row.modality}>
                      <td style={td}>{row.modality}</td>
                      <td style={td}>{row.inscriptos}</td>
                      <td style={td}>{row.asistieron}</td>
                      <td style={td}>{pctLabel(row.tasa_pct)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </DataTable>

          <DataTable title="Por tipo de evento (etiqueta en tarjeta)">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={th}>Tipo</th>
                  <th style={th}>Eventos</th>
                  <th style={th}>Inscriptos</th>
                  <th style={th}>Check-in</th>
                  <th style={th}>Tasa</th>
                </tr>
              </thead>
              <tbody>
                {data.por_tipo_evento.length === 0 ? (
                  <tr>
                    <td style={td} colSpan={5}>
                      Sin datos todavía.
                    </td>
                  </tr>
                ) : (
                  data.por_tipo_evento.map(row => (
                    <tr key={row.tag_label}>
                      <td style={td}>{row.tag_label}</td>
                      <td style={td}>{row.eventos_distintos}</td>
                      <td style={td}>{row.inscriptos}</td>
                      <td style={td}>{row.asistieron}</td>
                      <td style={td}>{pctLabel(row.tasa_pct)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </DataTable>

          <DataTable title="Por mes en la tarjeta del evento (campo «mes», ej. NOV)">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={th}>Mes</th>
                  <th style={th}>Eventos</th>
                  <th style={th}>Inscriptos</th>
                  <th style={th}>Check-in</th>
                </tr>
              </thead>
              <tbody>
                {data.por_mes_etiqueta.length === 0 ? (
                  <tr>
                    <td style={td} colSpan={4}>
                      Completá el mes en los eventos o todavía no hay inscripciones agrupables.
                    </td>
                  </tr>
                ) : (
                  data.por_mes_etiqueta.map(row => (
                    <tr key={row.mes_etiqueta}>
                      <td style={td}>{row.mes_etiqueta}</td>
                      <td style={td}>{row.eventos_distintos}</td>
                      <td style={td}>{row.inscriptos}</td>
                      <td style={td}>{row.asistieron}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </DataTable>

          <DataTable title="Carreras (miembros que se anotaron al menos a un evento)">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={th}>Carrera</th>
                  <th style={th}>Personas</th>
                  <th style={th}>Inscriptos</th>
                  <th style={th}>Check-in</th>
                  <th style={th}>Tasa</th>
                </tr>
              </thead>
              <tbody>
                {data.carreras.length === 0 ? (
                  <tr>
                    <td style={td} colSpan={5}>
                      Sin carreras cargadas o sin inscripciones.
                    </td>
                  </tr>
                ) : (
                  data.carreras.map(row => (
                    <tr key={row.carrera}>
                      <td style={td}>{row.carrera}</td>
                      <td style={td}>{row.personas_distintas}</td>
                      <td style={td}>{row.inscriptos}</td>
                      <td style={td}>{row.asistieron}</td>
                      <td style={td}>{pctLabel(row.tasa_pct)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </DataTable>

          <DataTable title="Eventos con más check-ins (app)">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={th}>Evento</th>
                  <th style={th}>Check-in</th>
                  <th style={th}>Inscriptos</th>
                  <th style={th}>Tasa</th>
                </tr>
              </thead>
              <tbody>
                {data.ranking.mas_asistencias.length === 0 ? (
                  <tr>
                    <td style={td} colSpan={4}>
                      Todavía no hay asistencias registradas.
                    </td>
                  </tr>
                ) : (
                  data.ranking.mas_asistencias.map(row => (
                    <tr key={row.evento_id}>
                      <td style={td}>{row.title}</td>
                      <td style={td}>{row.asistieron}</td>
                      <td style={td}>{row.inscriptos}</td>
                      <td style={td}>{pctLabel(row.tasa_pct)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </DataTable>

          <DataTable title="Más no-shows (solo eventos cerrados / realizados)">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={th}>Evento</th>
                  <th style={th}>No-shows</th>
                  <th style={th}>Inscriptos</th>
                  <th style={th}>Tasa no-show</th>
                </tr>
              </thead>
              <tbody>
                {data.ranking.mas_no_shows.length === 0 ? (
                  <tr>
                    <td style={td} colSpan={4}>
                      Ningún evento cerrado con inscriptos sin check-in, o todavía no marcaste eventos como realizados.
                    </td>
                  </tr>
                ) : (
                  data.ranking.mas_no_shows.map(row => (
                    <tr key={row.evento_id}>
                      <td style={td}>{row.title}</td>
                      <td style={td}>{row.no_shows}</td>
                      <td style={td}>{row.inscriptos}</td>
                      <td style={td}>{pctLabel(row.tasa_no_show_pct)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </DataTable>

          <DataTable title="Calidad de datos: CSV Luma vs filas en la app">
            <p style={{ margin: '0 12px 10px', fontSize: 13, color: 'var(--ink-muted)', lineHeight: 1.5 }}>
              Totales del último CSV importado en el evento vs inscripciones reales en base. Diferencias grandes conviene revisar (mismo evento en Luma, mails coincidentes).
            </p>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={th}>Evento</th>
                  <th style={th}>CSV inscriptos</th>
                  <th style={th}>CSV check-in</th>
                  <th style={th}>App inscriptos</th>
                  <th style={th}>App check-in</th>
                </tr>
              </thead>
              <tbody>
                {data.calidad_datos.csv_vs_app.length === 0 ? (
                  <tr>
                    <td style={td} colSpan={5}>
                      Sin totales CSV cargados o sin inscripciones en app para comparar.
                    </td>
                  </tr>
                ) : (
                  data.calidad_datos.csv_vs_app.map(row => (
                    <tr key={row.evento_id}>
                      <td style={td}>{row.title}</td>
                      <td style={td}>{row.csv_inscriptos}</td>
                      <td style={td}>{row.csv_asistieron}</td>
                      <td style={td}>{row.app_inscriptos}</td>
                      <td style={td}>{row.app_asistieron}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </DataTable>
        </>
      ) : null}
    </CrmSection>
  );
}
