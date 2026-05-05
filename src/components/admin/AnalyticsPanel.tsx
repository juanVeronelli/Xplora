/**
 * Pestaña **Analytics**: KPIs y tablas derivadas de usuarios, eventos e inscripciones (actualización al cargar / refrescar).
 */
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import type { AdminAnalyticsResponse } from '../../types';
import { authFetch, readApiError } from '../../lib/serverApi';
import { CrmSection, Spinner } from './crm/CrmUi';
import { crm } from './crm/crmTheme';
import { useToast } from '../../context/FeedbackContext';

function pctLabel(v: number | null): string {
  if (v == null) return '—';
  return `${v}%`;
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

  useEffect(() => {
    void load();
  }, [load]);

  const updated =
    data?.generated_at &&
    new Date(data.generated_at).toLocaleString('es-AR', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });

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
        <button type="button" style={crm.chipBtn} onClick={() => void load()} disabled={loading}>
          {loading ? 'Actualizando…' : 'Actualizar datos'}
        </button>
      </div>

      {loading && !data ? (
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
