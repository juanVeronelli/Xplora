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
  const heroImg = (ev.homePosterUrl?.trim() || ev.thumbnailUrl?.trim()) ?? '';
  const hasThumb = Boolean(heroImg);

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
            padding: 0,
            overflow: 'hidden',
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
          {hasThumb ? (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : 'minmax(0, 1fr) minmax(0, 1.05fr)',
                gap: 0,
                alignItems: 'stretch',
              }}
            >
              <div style={s.thumbShell}>
                <img src={heroImg} alt={ev.title} style={s.thumbImg} />
                <div style={s.thumbScrim} aria-hidden />
                <div style={s.dateFloat}>
                  <span style={s.dateFloatDay}>{ev.day || '—'}</span>
                  <span style={s.dateFloatMonth}>{ev.month || ''}</span>
                </div>
              </div>
              <div style={{ ...s.bodyPad, padding: isMobile ? '20px 20px 22px' : '28px 32px 28px 28px' }}>
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
          ) : (
            <div style={{ padding: isMobile ? 20 : 28 }}>
              <div
                style={{
                  ...s.row,
                  flexDirection: isMobile ? 'column' : 'row',
                  alignItems: isMobile ? 'stretch' : 'center',
                }}
              >
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
            </div>
          )}
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
  thumbShell: {
    position: 'relative',
    overflow: 'hidden',
    aspectRatio: '4 / 3',
    background: 'linear-gradient(145deg, #1A1028 0%, #2D1B50 100%)',
    alignSelf: 'stretch',
  },
  thumbImg: {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
  },
  thumbScrim: {
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(180deg, rgba(26,16,40,0.15) 0%, rgba(26,16,40,0.55) 100%)',
    pointerEvents: 'none',
  },
  dateFloat: {
    position: 'absolute',
    left: 16,
    bottom: 16,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    padding: '12px 14px',
    borderRadius: 14,
    background: 'rgba(255,255,255,0.94)',
    boxShadow: '0 8px 24px rgba(26,16,40,.2)',
    border: '1px solid rgba(255,255,255,0.6)',
    minWidth: 64,
  },
  dateFloatDay: {
    fontSize: 26,
    fontWeight: 800,
    fontFamily: "'Fraunces', serif",
    lineHeight: 1,
    color: 'var(--ink)',
  },
  dateFloatMonth: {
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '2px',
    textTransform: 'uppercase',
    color: 'var(--ink-muted)',
  },
  bodyPad: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    minWidth: 0,
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
