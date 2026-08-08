/**
 * Vista dedicada: leads de sponsors / empresas (form público → sponsor_leads).
 */
import { useEffect, useState } from 'react';
import { authFetch, readApiError } from '../../lib/serverApi';
import { CrmSection, Spinner, Empty } from './crm/CrmUi';
import { crm } from './crm/crmTheme';
import { useToast } from '../../context/FeedbackContext';

type SponsorLeadRow = {
  id: string;
  empresa: string;
  nombre_contacto: string;
  email: string;
  telefono: string | null;
  interes: string;
  mensaje: string | null;
  created_at: string;
};

export default function SponsorsPanel() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<SponsorLeadRow[]>([]);
  const [open, setOpen] = useState<SponsorLeadRow | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const res = await authFetch('/api/admin/sponsors');
      if (cancelled) return;
      if (!res.ok) {
        toast.error(await readApiError(res));
        setRows([]);
      } else {
        const j = (await res.json()) as { rows?: SponsorLeadRow[] };
        setRows(j.rows ?? []);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [toast]);

  return (
    <CrmSection
      kicker="Empresas"
      title="Sponsors"
      subtitle="Leads de marcas que quieren participar en Xplora o Startup Day. También llegan por mail a xplora.ucema@gmail.com."
      onNew={() => {}}
      showNew={false}
    >
      <p style={{ margin: '0 0 14px', fontSize: 13, color: 'var(--ink-muted)' }}>
        {rows.length} lead{rows.length === 1 ? '' : 's'}
      </p>

      {loading ? (
        <Spinner />
      ) : rows.length === 0 ? (
        <Empty
          title="Todavía no hay sponsors"
          text="Cuando alguien complete “Quiero participar”, aparece acá."
        />
      ) : (
        <div className="xplora-admin-table-scroll" style={{ marginTop: 4 }}>
          <table style={{ ...table, minWidth: 980 }}>
            <thead>
              <tr>
                <th style={th}>Fecha</th>
                <th style={th}>Empresa</th>
                <th style={th}>Contacto</th>
                <th style={th}>Email</th>
                <th style={th}>Interés</th>
                <th style={th}>Teléfono</th>
                <th style={th}>Mensaje</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.id}
                  onClick={() => setOpen(r)}
                  style={{ cursor: 'pointer' }}
                  title="Ver detalle"
                >
                  <td style={{ ...td, fontSize: 12, color: 'var(--ink-muted)' }}>
                    {new Date(r.created_at).toLocaleString('es-AR', {
                      dateStyle: 'short',
                      timeStyle: 'short',
                    })}
                  </td>
                  <td style={td}>
                    <strong>{r.empresa}</strong>
                  </td>
                  <td style={td}>{r.nombre_contacto}</td>
                  <td style={{ ...td, wordBreak: 'break-all' }}>{r.email}</td>
                  <td style={td}>
                    <span style={badge}>{r.interes}</span>
                  </td>
                  <td style={td}>{r.telefono ?? '—'}</td>
                  <td style={{ ...td, maxWidth: 220 }}>
                    {r.mensaje
                      ? r.mensaje.length > 80
                        ? `${r.mensaje.slice(0, 77).trim()}…`
                        : r.mensaje
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {open ? <SponsorDetailModal row={open} onClose={() => setOpen(null)} /> : null}
    </CrmSection>
  );
}

function SponsorDetailModal({ row, onClose }: { row: SponsorLeadRow; onClose: () => void }) {
  return (
    <div style={modalBackdrop} role="dialog" aria-modal onClick={onClose}>
      <div style={modalCard} onClick={(e) => e.stopPropagation()}>
        <div style={modalHead}>
          <div>
            <div style={modalKicker}>Sponsor</div>
            <div style={modalTitle}>{row.empresa}</div>
            <div style={modalSub}>
              {new Date(row.created_at).toLocaleString('es-AR', {
                dateStyle: 'full',
                timeStyle: 'short',
              })}
            </div>
          </div>
          <button type="button" style={xBtn} onClick={onClose} aria-label="Cerrar">
            ×
          </button>
        </div>

        <div style={modalBody}>
          <div style={grid2}>
            <Info label="Contacto" value={row.nombre_contacto} />
            <Info label="Interés" value={row.interes} />
            <Info label="Email" value={row.email} />
            <Info label="Teléfono" value={row.telefono || '—'} />
          </div>
          <div style={{ marginTop: 16 }}>
            <div style={longLabel}>Mensaje</div>
            <div style={longText}>{row.mensaje?.trim() || 'Sin mensaje.'}</div>
          </div>
        </div>

        <div style={modalFoot}>
          <a href={`mailto:${row.email}`} style={{ ...crm.primaryBtn, textDecoration: 'none' }}>
            Responder por mail
          </a>
          <button type="button" style={crm.secondaryBtn} onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div style={infoBox}>
      <div style={infoLabel}>{label}</div>
      <div style={infoValue}>{value}</div>
    </div>
  );
}

const table: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: 14,
};

const th: React.CSSProperties = {
  textAlign: 'left',
  padding: '10px 12px',
  borderBottom: '1px solid rgba(26,16,40,0.12)',
  fontSize: 11,
  fontWeight: 800,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: 'var(--ink-muted)',
  whiteSpace: 'nowrap',
};

const td: React.CSSProperties = {
  padding: '12px',
  borderBottom: '1px solid rgba(26,16,40,0.08)',
  color: 'var(--ink)',
  verticalAlign: 'top',
};

const badge: React.CSSProperties = {
  ...crm.chipBtn,
  display: 'inline-block',
  fontSize: 12,
  padding: '6px 10px',
};

const modalBackdrop: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(26,16,40,0.45)',
  backdropFilter: 'blur(6px)',
  WebkitBackdropFilter: 'blur(6px)',
  zIndex: 99999,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 18,
};

const modalCard: React.CSSProperties = {
  width: '100%',
  maxWidth: 720,
  background: '#fff',
  borderRadius: 16,
  border: '1px solid rgba(26,16,40,0.1)',
  boxShadow: '0 24px 70px rgba(26,16,40,0.22)',
  overflow: 'hidden',
  fontFamily: "'Instrument Sans', sans-serif",
};

const modalHead: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: 12,
  padding: 18,
  borderBottom: '1px solid rgba(26,16,40,0.08)',
  background: 'linear-gradient(135deg, rgba(96,62,249,0.08) 0%, rgba(255,255,255,0.95) 55%)',
};

const modalKicker: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 800,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: 'var(--purple)',
  marginBottom: 6,
};

const modalTitle: React.CSSProperties = {
  fontFamily: "'Syne', sans-serif",
  fontSize: 22,
  fontWeight: 800,
  color: 'var(--ink)',
  letterSpacing: '-0.03em',
};

const modalSub: React.CSSProperties = { marginTop: 6, fontSize: 12, color: 'var(--ink-muted)' };

const xBtn: React.CSSProperties = {
  border: 'none',
  background: 'transparent',
  cursor: 'pointer',
  fontSize: 22,
  lineHeight: 1,
  padding: 6,
  color: 'var(--ink-muted)',
};

const modalBody: React.CSSProperties = { padding: 18 };

const grid2: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: 12,
};

const infoBox: React.CSSProperties = {
  borderRadius: 12,
  border: '1px solid rgba(26,16,40,0.1)',
  background: 'rgba(250,248,245,0.7)',
  padding: 12,
};
const infoLabel: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 800,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: 'var(--ink-muted)',
};
const infoValue: React.CSSProperties = {
  marginTop: 8,
  fontSize: 14,
  color: 'var(--ink)',
  wordBreak: 'break-word',
};

const longLabel: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 800,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: 'var(--ink-muted)',
  marginBottom: 8,
};
const longText: React.CSSProperties = {
  borderRadius: 12,
  border: '1px solid rgba(26,16,40,0.1)',
  background: 'white',
  padding: 14,
  color: 'var(--ink)',
  lineHeight: 1.65,
  whiteSpace: 'pre-wrap',
};

const modalFoot: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 10,
  padding: 18,
  borderTop: '1px solid rgba(26,16,40,0.08)',
  background: 'rgba(250,248,245,0.85)',
  flexWrap: 'wrap',
};
