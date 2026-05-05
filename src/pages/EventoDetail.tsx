import type { Evento } from '../types';
import Tag from '../components/Tag';
import Footer from '../components/Footer';
import { useIsMobile } from '../hooks/useIsMobile';

interface Props {
  evento: Evento;
  goBack: () => void;
}

export default function EventoDetail({ evento: ev, goBack }: Props) {
  const isMobile = useIsMobile();

  return (
    <>
      <BackBtn onClick={goBack} label="Volver a Eventos" />
      {ev.thumbnailUrl ? (
        <div style={{ padding: isMobile ? '12px 16px 0' : '12px 80px 0' }}>
          <div style={{ borderRadius: 16, overflow: 'hidden', border: '1.5px solid var(--border-warm)' }}>
            <img
              src={ev.thumbnailUrl}
              alt=""
              style={{ width: '100%', maxHeight: 300, objectFit: 'cover', display: 'block' }}
            />
          </div>
        </div>
      ) : null}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '1fr 340px',
        gap: isMobile ? 24 : 40,
        padding: isMobile ? '16px 16px 40px' : '28px 80px 80px',
        alignItems: 'start',
      }}>
        {/* Main */}
        <div>
          <Tag type={ev.tagType} style={{ marginBottom: 14, display: 'inline-flex' }}>
            {ev.tagLabel}
          </Tag>
          <h1 style={{ ...s.h1, fontSize: isMobile ? 26 : 36 }}>{ev.title}</h1>

          {/* Oradores — usa el array si existe, sino el campo único */}
          {(ev.speakers && ev.speakers.length > 0 ? ev.speakers : ev.speakerName ? [{ name: ev.speakerName, role: ev.speakerRole, initials: ev.speakerInitials, bio: ev.speakerBio || '' }] : []).map((sp, i) => (
            <div key={i} style={{ ...s.oraCard, marginBottom: i < (ev.speakers?.length ?? 1) - 1 ? 12 : 28 }}>
              <div style={s.avatar}>{sp.initials || sp.name.slice(0, 2).toUpperCase()}</div>
              <div>
                <h3 style={s.oraName}>{sp.name}</h3>
                {sp.role && <p style={s.oraRole}>{sp.role}</p>}
                {sp.bio && <p style={s.oraBio}>{sp.bio}</p>}
              </div>
            </div>
          ))}

          {/* Sobre el evento */}
          {ev.about && <DtSec title="Sobre el evento">{ev.about}</DtSec>}

          {/* Desc / resumen */}
          {ev.desc && !ev.about && <DtSec title="Descripción">{ev.desc}</DtSec>}

          {/* Xplora box */}
          <div style={s.xploraBox}>
            <h4 style={s.xBoxTitle}>Sobre Xplora UCEMA</h4>
            <p style={s.xBoxP}>
              Xplora es el club de emprendedores de la Universidad del CEMA. Organizamos charlas,
              workshops, hackathons y conectamos estudiantes con oportunidades y mentores del
              ecosistema emprendedor.
            </p>
          </div>
        </div>

        {/* Sidebar */}
        <div>
          <div style={{ ...s.sbCard, position: isMobile ? 'static' : 'sticky', top: 82 }}>
            <h4 style={s.sbTitle}>Detalles del evento</h4>

            {(ev.day || ev.month) && (
              <SbItem label="Fecha" value={[ev.day, ev.month, ev.date].filter(Boolean).join(' ')} />
            )}
            {ev.location && <SbItem label="Lugar" value={ev.location} />}
            {ev.modality && <SbItem label="Modalidad" value={ev.modality} />}
            {ev.capacity && (
              <SbItem label="Cupos" value={ev.capacity} valueColor="var(--green)" />
            )}
            {ev.cost && <SbItem label="Costo" value={ev.cost} />}

            {ev.registrationLink && (
              <>
                <a
                  href={ev.registrationLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ ...s.sbFull, display: 'block', textAlign: 'center', textDecoration: 'none' }}
                  onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.background = 'var(--purple)'}
                  onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.background = 'var(--ink)'}
                >
                  Inscribirme al evento
                </a>
                <p style={s.sbNote}>Confirmación por email</p>
              </>
            )}
          </div>
        </div>
      </div>
      <Footer minimal />
    </>
  );
}

function DtSec({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <h4 style={{ fontFamily: "'Fraunces', serif", fontSize: 16, fontWeight: 700, marginBottom: 10, color: 'var(--ink)', letterSpacing: '-0.3px' }}>{title}</h4>
      <p style={{ color: 'var(--ink-muted)', lineHeight: 1.85, fontSize: 14, whiteSpace: 'pre-line' }}>{children}</p>
    </div>
  );
}

function SbItem({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--ink-faint)', display: 'block', marginBottom: 3 }}>{label}</label>
      <span style={{ fontSize: 14, color: valueColor ?? 'var(--ink)', fontWeight: 500 }}>{value}</span>
    </div>
  );
}

export function BackBtn({ onClick, label }: { onClick: () => void; label: string }) {
  const isMobile = useIsMobile();
  return (
    <button
      style={{
        display: 'flex', alignItems: 'center', gap: 7,
        padding: isMobile ? '16px 16px 0' : '20px 80px 0',
        cursor: 'pointer',
        color: 'var(--ink-muted)', fontSize: 13, fontWeight: 600,
        transition: 'color .2s', background: 'none', border: 'none',
      }}
      onClick={onClick}
      onMouseEnter={e => (e.currentTarget).style.color = 'var(--purple)'}
      onMouseLeave={e => (e.currentTarget).style.color = 'var(--ink-muted)'}
    >
      ← {label}
    </button>
  );
}

const s: Record<string, React.CSSProperties> = {
  h1: {
    fontFamily: "'Fraunces', serif",
    fontSize: 36, fontWeight: 700, letterSpacing: '-1.5px',
    marginBottom: 16, lineHeight: 1.1, color: 'var(--ink)',
  },
  oraCard: {
    display: 'flex', alignItems: 'flex-start', gap: 16,
    padding: 20, borderRadius: 14,
    border: '1.5px solid var(--border-warm)',
    background: 'var(--warm)', marginBottom: 28,
  },
  avatar: {
    width: 64, height: 64, borderRadius: '50%',
    background: 'linear-gradient(135deg, var(--purple), #A08BFF)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 22, fontWeight: 700, color: 'white', flexShrink: 0,
    fontFamily: "'Fraunces', serif",
  },
  oraName: {
    fontFamily: "'Fraunces', serif",
    fontSize: 16, fontWeight: 700, marginBottom: 2, color: 'var(--ink)', letterSpacing: '-0.3px',
  },
  oraRole: {
    fontSize: 12, color: 'var(--purple)', fontWeight: 600, marginBottom: 4,
  },
  oraBio: { color: 'var(--ink-muted)', fontSize: 13, lineHeight: 1.6 },
  xploraBox: {
    borderRadius: 14, border: '1.5px solid rgba(96,62,249,.2)',
    background: 'var(--purple-soft)', padding: 20,
  },
  xBoxTitle: {
    fontFamily: "'Fraunces', serif",
    fontSize: 14, fontWeight: 700, marginBottom: 8,
    color: 'var(--ink)',
  },
  xBoxP: { fontSize: 12, color: 'var(--ink-muted)', lineHeight: 1.75 },
  sbCard: {
    borderRadius: 16, border: '1.5px solid var(--border-warm)',
    background: 'var(--white)', padding: 24,
  },
  sbTitle: {
    fontFamily: "'Fraunces', serif",
    fontSize: 15, fontWeight: 700, marginBottom: 16, color: 'var(--ink)', letterSpacing: '-0.3px',
  },
  sbFull: {
    width: '100%', marginTop: 4, padding: 13, borderRadius: 12,
    background: 'var(--ink)', color: 'white', border: 'none',
    cursor: 'pointer', fontFamily: "'Instrument Sans', sans-serif",
    fontSize: 14, fontWeight: 700, transition: 'background .2s',
  },
  sbNote: { textAlign: 'center', marginTop: 10, fontSize: 11, color: 'var(--ink-faint)' },
};
