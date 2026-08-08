/**
 * Inicio del panel: panorama operativo + atajos.
 */
import { useEffect, useState } from 'react';
import { authFetch } from '../../lib/serverApi';
import { fetchAdminEventos } from '../../lib/db';
import { canSeeAdminSection } from '../../lib/crmPermissions';
import { useStaffPermissions } from '../../context/StaffPermissionsContext';
import type { AdminSectionId } from './crm/AdminShell';
import { SectionIntro, Spinner } from './crm/CrmUi';
import { crm } from './crm/crmTheme';

type Props = {
  onGo: (id: AdminSectionId) => void;
};

type Stats = {
  eventosActivos: number | null;
  miembros: number | null;
  sponsors: number | null;
  waitlist: number | null;
  campanas: number | null;
};

export default function AdminHome({ onGo }: Props) {
  const { permissions, nombre } = useStaffPermissions();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({
    eventosActivos: null,
    miembros: null,
    sponsors: null,
    waitlist: null,
    campanas: null,
  });

  const canWeb = canSeeAdminSection('sitio', permissions);
  const canEventos = canSeeAdminSection('eventos', permissions);
  const canComunidad = canSeeAdminSection('comunidad', permissions);
  const canLeads = canSeeAdminSection('leads', permissions);
  const canSponsors = canSeeAdminSection('sponsors', permissions);
  const canEmail = canSeeAdminSection('campanas_email', permissions);
  const canArchivo = canSeeAdminSection('charlas', permissions);
  const canEquipo = canSeeAdminSection('equipo', permissions);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      const next: Stats = {
        eventosActivos: null,
        miembros: null,
        sponsors: null,
        waitlist: null,
        campanas: null,
      };
      const jobs: Promise<void>[] = [];

      if (canEventos) {
        jobs.push(
          fetchAdminEventos()
            .then((rows) => {
              next.eventosActivos = rows.filter((e) => !e.realizado).length;
            })
            .catch(() => {
              next.eventosActivos = null;
            }),
        );
      }
      if (canComunidad) {
        jobs.push(
          authFetch('/api/admin/members')
            .then(async (res) => {
              if (!res.ok) return;
              const j = (await res.json()) as unknown;
              next.miembros = Array.isArray(j) ? j.length : null;
            })
            .catch(() => {
              next.miembros = null;
            }),
        );
      }
      if (canSponsors) {
        jobs.push(
          authFetch('/api/admin/sponsors')
            .then(async (res) => {
              if (!res.ok) return;
              const j = (await res.json()) as { rows?: unknown[] };
              next.sponsors = j.rows?.length ?? 0;
            })
            .catch(() => {
              next.sponsors = null;
            }),
        );
      }
      if (canLeads) {
        jobs.push(
          authFetch('/api/admin/startup-day/waitlist')
            .then(async (res) => {
              if (!res.ok) return;
              const j = (await res.json()) as { rows?: unknown[]; total?: number };
              next.waitlist = typeof j.total === 'number' ? j.total : (j.rows?.length ?? 0);
            })
            .catch(() => {
              next.waitlist = null;
            }),
        );
      }
      if (canEmail) {
        jobs.push(
          authFetch('/api/admin/email-campaigns')
            .then(async (res) => {
              if (!res.ok) return;
              const j = (await res.json()) as { rows?: unknown[] } | unknown[];
              next.campanas = Array.isArray(j) ? j.length : (j.rows?.length ?? 0);
            })
            .catch(() => {
              next.campanas = null;
            }),
        );
      }

      await Promise.all(jobs);
      if (!alive) return;
      setStats(next);
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [canEventos, canComunidad, canLeads, canSponsors, canEmail]);

  const greeting = nombre?.trim() ? `Hola, ${nombre.trim()}` : 'Panel Xplora';

  const cards: Array<{
    id: AdminSectionId;
    label: string;
    value: string;
    hint: string;
    show: boolean;
  }> = [
    {
      id: 'eventos',
      label: 'Eventos activos',
      value: stats.eventosActivos == null ? '—' : String(stats.eventosActivos),
      hint: 'Próximas convocatorias',
      show: canEventos,
    },
    {
      id: 'comunidad',
      label: 'Miembros',
      value: stats.miembros == null ? '—' : String(stats.miembros),
      hint: 'Base y listas',
      show: canComunidad,
    },
    {
      id: 'sponsors',
      label: 'Sponsors',
      value: stats.sponsors == null ? '—' : String(stats.sponsors),
      hint: 'Leads de empresas',
      show: canSponsors,
    },
    {
      id: 'leads',
      label: 'Waitlist SD',
      value: stats.waitlist == null ? '—' : String(stats.waitlist),
      hint: 'Reservas Startup Day',
      show: canLeads,
    },
    {
      id: 'campanas_email',
      label: 'Campañas',
      value: stats.campanas == null ? '—' : String(stats.campanas),
      hint: 'Email al club',
      show: canEmail,
    },
  ];

  const shortcuts: Array<{ id: AdminSectionId; title: string; desc: string; show: boolean }> = [
    { id: 'sitio', title: 'Web pública', desc: 'Cambiar hero y fotos del club', show: canWeb },
    { id: 'eventos', title: 'Nuevo evento', desc: 'Fecha, flyer y convocatoria', show: canEventos },
    { id: 'campanas_email', title: 'Campaña de email', desc: 'Avisar a la comunidad', show: canEmail },
    { id: 'sponsors', title: 'Sponsors', desc: 'Leads de marcas', show: canSponsors },
    { id: 'leads', title: 'Leads', desc: 'Waitlist y candidatos', show: canLeads },
    { id: 'comunidad', title: 'Comunidad', desc: 'Miembros y export', show: canComunidad },
    { id: 'charlas', title: 'Archivo', desc: 'Charlas e inscriptos Luma', show: canArchivo },
    { id: 'equipo', title: 'Equipo', desc: 'Cuentas y permisos', show: canEquipo },
  ];

  return (
    <>
      <SectionIntro
        kicker="Operaciones"
        title={greeting}
        subtitle="Web = fotos. Data = el resto. Empezá por lo que importa hoy."
      />

      {loading ? (
        <Spinner />
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
            gap: 12,
            marginBottom: 28,
          }}
        >
          {cards
            .filter((c) => c.show)
            .map((c) => (
              <button
                key={`${c.id}-${c.label}`}
                type="button"
                onClick={() => onGo(c.id)}
                style={{
                  ...crm.listCard,
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  gap: 6,
                  cursor: 'pointer',
                  textAlign: 'left',
                  border: '1px solid rgba(26,16,40,0.1)',
                  background: '#fff',
                }}
              >
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: 'var(--ink-muted)',
                  }}
                >
                  {c.label}
                </span>
                <span
                  style={{
                    fontFamily: "'Syne', sans-serif",
                    fontSize: 32,
                    fontWeight: 800,
                    letterSpacing: '-0.04em',
                    color: 'var(--ink)',
                    lineHeight: 1,
                  }}
                >
                  {c.value}
                </span>
                <span style={{ fontSize: 13, color: 'var(--ink-muted)', lineHeight: 1.35 }}>{c.hint}</span>
              </button>
            ))}
        </div>
      )}

      <h2
        style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: 18,
          fontWeight: 700,
          letterSpacing: '-0.03em',
          margin: '0 0 12px',
          color: 'var(--ink)',
        }}
      >
        Atajos
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
        {shortcuts
          .filter((s) => s.show)
          .map((s) => (
            <button
              key={s.id + s.title}
              type="button"
              onClick={() => onGo(s.id)}
              style={{
                ...crm.listCard,
                cursor: 'pointer',
                textAlign: 'left',
                background: '#fff',
              }}
            >
              <div style={crm.listBody}>
                <div style={{ ...crm.listTitle, fontFamily: "'Syne', sans-serif" }}>{s.title}</div>
                <div style={crm.listMeta}>{s.desc}</div>
              </div>
            </button>
          ))}
      </div>
    </>
  );
}
