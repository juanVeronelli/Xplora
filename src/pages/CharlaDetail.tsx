import type { Charla } from '../types';
import Tag from '../components/Tag';
import Footer from '../components/Footer';
import { BackBtn } from './EventoDetail';
import { useIsMobile } from '../hooks/useIsMobile';

interface Props {
  charla: Charla;
  goBack: () => void;
}

export default function CharlaDetail({ charla: ch, goBack }: Props) {
  const isMobile = useIsMobile();

  // Nombre limpio del speaker (puede venir con " · Rol")
  const speakerDisplayName = ch.speakerName?.split(' · ')[0] ?? '';

  return (
    <>
      <BackBtn onClick={goBack} label="Volver al Archivo" />
      {ch.thumbnailUrl ? (
        <div style={{ padding: isMobile ? '12px 16px 0' : '12px 80px 0' }}>
          <div style={{ borderRadius: 16, overflow: 'hidden', border: '1.5px solid var(--border-warm)' }}>
            <img
              src={ch.thumbnailUrl}
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
          <Tag type={ch.tagType} style={{ marginBottom: 14, display: 'inline-flex' }}>
            Charla · {ch.tagLabel}
          </Tag>
          <h1 style={{ ...s.h1, fontSize: isMobile ? 26 : 36 }}>{ch.title}</h1>

          {/* Speaker card */}
          {speakerDisplayName && (
            <div style={s.oraCard}>
              <div style={s.avatar}>
                {ch.speakerInitials || speakerDisplayName.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <h3 style={s.oraName}>{speakerDisplayName}</h3>
                {ch.speakerBio && <p style={s.oraBio}>{ch.speakerBio}</p>}
              </div>
            </div>
          )}

          {/* Sobre la charla */}
          {ch.about && <DtSec title="Sobre la charla">{ch.about}</DtSec>}

          {/* Temas — solo si hay topics cargados */}
          {ch.topics?.length > 0 && (
            <DtSec title="Temas abordados">
              {ch.topics.map(t => `— ${t}`).join('\n')}
            </DtSec>
          )}

          {/* Por qué Xplora — solo si está cargado */}
          {ch.whyXplora && <DtSec title="¿Por qué en Xplora?">{ch.whyXplora}</DtSec>}

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
            <h4 style={s.sbTitle}>Información</h4>
            {ch.date && <SbItem label="Fecha" value={ch.date} />}
            {speakerDisplayName && <SbItem label="Oradora/or" value={speakerDisplayName} />}
            {ch.duration && <SbItem label="Duración" value={ch.duration} />}
            {ch.attendees && <SbItem label="Asistentes" value={ch.attendees} />}

            {/* Botón grabación */}
            {ch.recordingLink ? (
              <a
                href={ch.recordingLink}
                target="_blank"
                rel="noopener noreferrer"
                style={{ ...s.sbFull, display: 'block', textAlign: 'center', textDecoration: 'none', marginTop: 8 }}
                onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.background = 'var(--purple)'}
                onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.background = 'var(--ink)'}
              >
                ▶ Ver Grabación
              </a>
            ) : (
              <button style={{ ...s.sbFull, opacity: 0.45, cursor: 'default', marginTop: 8 }} disabled>
                ▶ Grabación no disponible
              </button>
            )}

            {/* Botón material */}
            {ch.materialLink ? (
              <a
                href={ch.materialLink}
                target="_blank"
                rel="noopener noreferrer"
                style={{ ...s.sbSec, display: 'block', textAlign: 'center', textDecoration: 'none', marginTop: 8 }}
                onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = 'var(--purple)'; (e.currentTarget as HTMLAnchorElement).style.color = 'var(--purple)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = 'var(--border-warm)'; (e.currentTarget as HTMLAnchorElement).style.color = 'var(--ink-soft)'; }}
              >
                ↓ Descargar Material
              </a>
            ) : null}
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

function SbItem({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--ink-faint)', display: 'block', marginBottom: 3 }}>{label}</label>
      <span style={{ fontSize: 14, color: 'var(--ink)', fontWeight: 500 }}>{value}</span>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  h1: {
    fontFamily: "'Fraunces', serif",
    fontSize: 36, fontWeight: 700, letterSpacing: '-1.5px',
    marginBottom: 16, lineHeight: 1.1, color: 'var(--ink)',
  },
  oraCard: {
    display: 'flex', alignItems: 'flex-start', gap: 16, padding: 20,
    borderRadius: 14, border: '1.5px solid var(--border-warm)',
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
    fontSize: 16, fontWeight: 700, marginBottom: 4, color: 'var(--ink)',
  },
  oraBio: { color: 'var(--ink-muted)', fontSize: 13, lineHeight: 1.6 },
  xploraBox: {
    borderRadius: 14, border: '1.5px solid rgba(96,62,249,.2)',
    background: 'var(--purple-soft)', padding: 20,
  },
  xBoxTitle: {
    fontFamily: "'Fraunces', serif",
    fontSize: 14, fontWeight: 700, marginBottom: 8, color: 'var(--ink)',
  },
  xBoxP: { fontSize: 12, color: 'var(--ink-muted)', lineHeight: 1.75 },
  sbCard: {
    borderRadius: 16, border: '1.5px solid var(--border-warm)',
    background: 'var(--white)', padding: 24,
  },
  sbTitle: {
    fontFamily: "'Fraunces', serif",
    fontSize: 15, fontWeight: 700, marginBottom: 16, color: 'var(--ink)',
  },
  sbFull: {
    width: '100%', padding: 13, borderRadius: 12,
    background: 'var(--ink)', color: 'white', border: 'none',
    cursor: 'pointer', fontFamily: "'Instrument Sans', sans-serif",
    fontSize: 14, fontWeight: 700, transition: 'background .2s',
    boxSizing: 'border-box',
  },
  sbSec: {
    width: '100%', padding: 11, borderRadius: 12,
    background: 'var(--warm)', color: 'var(--ink-soft)',
    border: '1.5px solid var(--border-warm)',
    cursor: 'pointer', fontFamily: "'Instrument Sans', sans-serif",
    fontSize: 13, fontWeight: 600, transition: 'all .2s',
    boxSizing: 'border-box',
  },
};
