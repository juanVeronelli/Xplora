import type { Empleo } from '../types';
import Footer from '../components/Footer';
import { BackBtn } from './EventoDetail';
import Tag from '../components/Tag';
import { useIsMobile } from '../hooks/useIsMobile';

interface Props {
  empleo: Empleo;
  goBack: () => void;
}

export default function EmpleoDetail({ empleo: emp, goBack }: Props) {
  const isMobile = useIsMobile();

  return (
    <>
      <BackBtn onClick={goBack} label="Volver a Bolsa de Empleo" />
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '1fr 320px',
        gap: isMobile ? 24 : 40,
        padding: isMobile ? '16px 16px 40px' : '28px 80px 80px',
        alignItems: 'start',
      }}>
        {/* Main */}
        <div>
          <div style={s.header}>
            <div style={s.ico}>
              {emp.thumbnailUrl ? (
                <img src={emp.thumbnailUrl} alt="" style={s.icoImg} />
              ) : emp.emoji ? (
                <span>{emp.emoji}</span>
              ) : (
                <span style={s.icoLetter}>{emp.title.slice(0, 1).toUpperCase()}</span>
              )}
            </div>
            <div>
              <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                <Tag type={emp.typeTag}>{emp.type}</Tag>
                <Tag type="n">{emp.area}</Tag>
              </div>
              <h1 style={{ ...s.h1, fontSize: isMobile ? 24 : 32 }}>{emp.title}</h1>
              <p style={s.company}>{emp.company} · {emp.location}</p>
            </div>
          </div>

          {emp.description && <Section title="Sobre el puesto"><p style={s.body}>{emp.description}</p></Section>}

          {emp.requirements && (
            <Section title="Requisitos">
              <ul style={s.ul}>
                {emp.requirements.split('\n').filter(Boolean).map((r, i) => (
                  <li key={i} style={s.li}>{r.replace(/^[-–•]\s*/, '')}</li>
                ))}
              </ul>
            </Section>
          )}

          {emp.benefits && (
            <Section title="¿Qué ofrecemos?">
              <ul style={s.ul}>
                {emp.benefits.split('\n').filter(Boolean).map((b, i) => (
                  <li key={i} style={s.li}>{b.replace(/^[-–•]\s*/, '')}</li>
                ))}
              </ul>
            </Section>
          )}

          <div style={s.xploraBox}>
            <h4 style={s.xBoxTitle}>Sobre Xplora UCEMA</h4>
            <p style={s.xBoxP}>
              Xplora es el club de emprendedores de la Universidad del CEMA. Esta oferta fue publicada
              especialmente para nuestra comunidad de estudiantes y egresados.
            </p>
          </div>
        </div>

        {/* Sidebar */}
        <div>
          <div style={{ ...s.sbCard, position: isMobile ? 'static' : 'sticky' }}>
            <h4 style={s.sbTitle}>Detalles</h4>
            <SbItem label="Empresa" value={emp.company || '—'} />
            <SbItem label="Ubicación" value={emp.location || '—'} />
            <SbItem label="Modalidad" value={emp.type || '—'} />
            <SbItem label="Área" value={emp.area || '—'} />

            {emp.applicationLink ? (
              <a
                href={emp.applicationLink}
                target="_blank"
                rel="noopener noreferrer"
                style={s.applyBtn}
              >
                Aplicar ahora →
              </a>
            ) : (
              <div style={{ ...s.applyBtn, opacity: 0.5, cursor: 'default', textDecoration: 'none', textAlign: 'center' }}>
                Sin link de aplicación
              </div>
            )}
            <p style={s.sbNote}>Serás redirigido al formulario de aplicación</p>
          </div>
        </div>
      </div>
      <Footer minimal />
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <h4 style={{ fontFamily: "'Fraunces', serif", fontSize: 16, fontWeight: 700, marginBottom: 10, color: 'var(--ink)', letterSpacing: '-0.3px' }}>{title}</h4>
      {children}
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
  header: { display: 'flex', alignItems: 'flex-start', gap: 20, marginBottom: 28 },
  ico: {
    width: 64, height: 64, borderRadius: 16, background: 'var(--warm)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 28, flexShrink: 0,
    overflow: 'hidden',
  },
  icoImg: { width: '100%', height: '100%', objectFit: 'cover' },
  icoLetter: {
    fontFamily: "'Fraunces', serif",
    fontSize: 26,
    fontWeight: 700,
    color: 'var(--ink)',
  },
  h1: {
    fontFamily: "'Fraunces', serif",
    fontWeight: 700, letterSpacing: '-1px',
    marginBottom: 4, lineHeight: 1.15, color: 'var(--ink)',
  },
  company: { fontSize: 14, color: 'var(--ink-muted)' },
  body: { color: 'var(--ink-muted)', lineHeight: 1.85, fontSize: 14 },
  ul: { paddingLeft: 0, margin: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 },
  li: {
    color: 'var(--ink-muted)', fontSize: 14, lineHeight: 1.6,
    paddingLeft: 18, position: 'relative',
  },
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
    background: 'var(--white)', padding: 24, top: 82,
  },
  sbTitle: {
    fontFamily: "'Fraunces', serif",
    fontSize: 15, fontWeight: 700, marginBottom: 16, color: 'var(--ink)',
  },
  applyBtn: {
    display: 'block', width: '100%', marginTop: 16, padding: 13,
    borderRadius: 12, background: 'var(--purple)', color: 'white',
    textAlign: 'center', textDecoration: 'none', fontWeight: 700,
    fontSize: 14, fontFamily: "'Instrument Sans', sans-serif",
    boxSizing: 'border-box',
  },
  sbNote: { textAlign: 'center', marginTop: 10, fontSize: 11, color: 'var(--ink-faint)' },
};
