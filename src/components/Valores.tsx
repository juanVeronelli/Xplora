import type { CSSProperties, Ref } from 'react';
import { useInView } from '../hooks/useInView';
import { useIsMobile } from '../hooks/useIsMobile';

const PILLARS = [
  {
    n: '01',
    title: 'Qué somos',
    text:
      'El club de emprendimiento de la Universidad del CEMA: un espacio estudiantil para conectar con speakers, pares y herramientas que en la carrera no siempre caben en un cronograma.',
  },
  {
    n: '02',
    title: 'Cómo trabajamos',
    text:
      'Charlas, talleres y eventos con fundadores, inversores y equipos del ecosistema. El foco es que te lleves contactos y criterio para avanzar con tu idea o proyecto, no solo asistir y listo.',
  },
  {
    n: '03',
    title: 'Comunidad',
    text:
      'Miles de personas en la red Xplora; cada año sumamos encuentros e inscripciones medibles. No es un slogan: es el campus y el club empujando en la misma dirección.',
  },
] as const;

export default function Valores() {
  const { ref, inView } = useInView();
  const isMobile = useIsMobile();

  return (
    <section
      ref={ref as Ref<HTMLElement>}
      style={{
        ...s.section,
        padding: isMobile ? '56px 24px 64px' : '88px 80px 96px',
        opacity: inView ? 1 : 0,
        transform: inView ? 'none' : 'translateY(28px)',
        transition: 'opacity 0.8s ease, transform 0.8s ease',
      }}
    >
      <div style={{ maxWidth: 1080, margin: '0 auto' }}>
        <p style={s.kicker}>Sobre el club</p>
        <h2 style={s.heading}>Lo que nos mueve en Xplora</h2>
        <p style={s.lead}>
          Desde 2022 organizamos el puente entre la facu y el mundo de equipos que construyen: acá no hace falta justificar
          que querés emprender; el resto del club ya está en la misma página.
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
            gap: isMobile ? 20 : 24,
            marginTop: isMobile ? 40 : 48,
          }}
        >
          {PILLARS.map((item, i) => (
            <article
              key={item.n}
              style={{
                ...s.card,
                padding: isMobile ? '22px 20px' : '26px 24px',
                opacity: inView ? 1 : 0,
                transform: inView ? 'none' : 'translateY(16px)',
                transition: `opacity 0.55s ease ${120 + i * 80}ms, transform 0.55s ease ${120 + i * 80}ms`,
              }}
            >
              <span style={s.num}>{item.n}</span>
              <h3 style={s.cardTitle}>{item.title}</h3>
              <p style={s.cardText}>{item.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

const s: Record<string, CSSProperties> = {
  section: {
    background: 'var(--white)',
  },
  kicker: {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '2.5px',
    textTransform: 'uppercase',
    color: 'var(--purple)',
    marginBottom: 12,
  },
  heading: {
    fontFamily: "'Fraunces', serif",
    fontSize: 'clamp(26px, 3.5vw, 42px)',
    fontWeight: 700,
    letterSpacing: '-1.2px',
    lineHeight: 1.12,
    color: 'var(--ink)',
    marginBottom: 20,
    maxWidth: 720,
  },
  lead: {
    fontSize: 16,
    color: 'var(--ink-muted)',
    lineHeight: 1.75,
    maxWidth: 640,
    margin: 0,
  },
  card: {
    borderRadius: 16,
    border: '1px solid var(--border-warm)',
    background: 'linear-gradient(180deg, var(--cream) 0%, var(--white) 100%)',
    boxSizing: 'border-box',
  },
  num: {
    display: 'block',
    fontFamily: "'Instrument Sans', sans-serif",
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: '0.2em',
    color: 'var(--purple)',
    marginBottom: 12,
  },
  cardTitle: {
    fontFamily: "'Fraunces', serif",
    fontSize: 18,
    fontWeight: 700,
    color: 'var(--ink)',
    marginBottom: 10,
    letterSpacing: '-0.3px',
  },
  cardText: {
    fontSize: 14,
    color: 'var(--ink-soft)',
    lineHeight: 1.7,
    margin: 0,
  },
};
