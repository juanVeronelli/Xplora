import type { Evento } from '../types';
import type { Page } from '../types';
import Tag from './Tag';
import { useInView } from '../hooks/useInView';
import { useIsMobile } from '../hooks/useIsMobile';

interface Props {
  evento: Evento;
  openEvento: (e: Evento) => void;
  goTo: (p: Page) => void;
}

export default function ProximoEvento({ evento: ev, openEvento, goTo }: Props) {
  const { ref, inView } = useInView(0.15);
  const isMobile = useIsMobile();

  return (
    <section
      ref={ref as React.Ref<HTMLElement>}
      style={{
        padding: isMobile ? '20px 24px 48px' : '24px 80px 64px',
        background: 'linear-gradient(180deg, var(--cream) 0%, #f5f0e8 100%)',
        opacity: inView ? 1 : 0,
        transform: inView ? 'none' : 'translateY(20px)',
        transition: 'opacity 0.75s ease, transform 0.75s ease',
      }}
    >
      <div style={{ maxWidth: 1080, margin: '0 auto' }}>
        <p style={s.kicker}>Próximo evento</p>
        <button
          type="button"
          style={{
            ...s.card,
            padding: isMobile ? 20 : 28,
            width: '100%',
            textAlign: 'left',
            cursor: 'pointer',
            border: 'none',
            font: 'inherit',
          }}
          onClick={() => openEvento(ev)}
          onMouseEnter={e => {
            e.currentTarget.style.boxShadow = '0 20px 56px rgba(26,16,40,.12)';
            e.currentTarget.style.borderColor = 'rgba(96,62,249,.35)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.boxShadow = '0 12px 40px rgba(26,16,40,.08)';
            e.currentTarget.style.borderColor = 'var(--border-warm)';
          }}
        >
          <div style={{ ...s.row, flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'stretch' : 'center' }}>
            <div style={s.dateCol}>
              <span style={s.day}>{ev.day || '—'}</span>
              <span style={s.month}>{ev.month || ''}</span>
            </div>
            <div style={s.main}>
              <div style={s.topMeta}>
                <Tag type={ev.tagType}>{ev.tagLabel || 'Evento'}</Tag>
              </div>
              <h2 style={s.title}>{ev.title}</h2>
              <p style={s.meta}>
                {ev.date}
                {ev.location ? ` · ${ev.location}` : ''}
                {ev.modality ? ` · ${ev.modality}` : ''}
              </p>
              <p style={s.desc}>{ev.desc}</p>
              <div style={s.actions}>
                <span style={s.cta}>Ver detalle e inscripción →</span>
                <button
                  type="button"
                  style={s.secondary}
                  onClick={e => {
                    e.stopPropagation();
                    goTo('eventos');
                  }}
                >
                  Todos los eventos
                </button>
              </div>
            </div>
          </div>
        </button>
      </div>
    </section>
  );
}

const s: Record<string, React.CSSProperties> = {
  kicker: {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '2.5px',
    textTransform: 'uppercase',
    color: 'var(--purple)',
    marginBottom: 16,
  },
  card: {
    background: 'var(--white)',
    borderRadius: 18,
    border: '1.5px solid var(--border-warm)',
    boxShadow: '0 12px 40px rgba(26,16,40,.08)',
    transition: 'box-shadow .25s, border-color .25s',
  },
  row: { display: 'flex', gap: 28 },
  dateCol: {
    flexShrink: 0,
    width: 72,
    height: 88,
    borderRadius: 14,
    background: 'var(--ink)',
    color: '#fff',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  day: { fontSize: 28, fontWeight: 800, fontFamily: "'Fraunces', serif", lineHeight: 1 },
  month: { fontSize: 11, fontWeight: 700, letterSpacing: '2px', opacity: 0.9 },
  main: { flex: 1, minWidth: 0 },
  topMeta: { display: 'flex', alignItems: 'center', marginBottom: 10 },
  title: {
    fontFamily: "'Fraunces', serif",
    fontSize: 'clamp(22px, 3vw, 30px)',
    fontWeight: 700,
    letterSpacing: '-0.5px',
    color: 'var(--ink)',
    marginBottom: 8,
    lineHeight: 1.15,
  },
  meta: { fontSize: 14, color: 'var(--ink-muted)', marginBottom: 10 },
  desc: {
    fontSize: 15,
    color: 'var(--ink-soft)',
    lineHeight: 1.55,
    marginBottom: 16,
    display: '-webkit-box',
    WebkitLineClamp: 3,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },
  actions: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cta: { fontSize: 14, fontWeight: 700, color: 'var(--purple)' },
  secondary: {
    fontSize: 13,
    fontWeight: 600,
    padding: '8px 16px',
    borderRadius: 100,
    border: '1.5px solid var(--border-warm)',
    background: 'var(--cream)',
    color: 'var(--ink-soft)',
    cursor: 'pointer',
    fontFamily: "'Instrument Sans', sans-serif",
  },
};
