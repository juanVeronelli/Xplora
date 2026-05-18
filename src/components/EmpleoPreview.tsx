import { useEffect, useState } from 'react';
import type { Page, Empleo } from '../types';
import { fetchEmpleos } from '../lib/db';
import { PUBLIC_BOLSA_ENABLED } from '../config/publicFeatures';
import { useInView } from '../hooks/useInView';
import { useIsMobile } from '../hooks/useIsMobile';
import Tag from './Tag';
import EmptyState from './EmptyState';

interface Props { goTo: (p: Page) => void; }

export default function EmpleoPreview({ goTo }: Props) {
  const { ref, inView } = useInView();
  const isMobile = useIsMobile();
  const [empleos, setEmpleos] = useState<Empleo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!PUBLIC_BOLSA_ENABLED) return;
    fetchEmpleos().then(data => {
      setEmpleos(data);
      setLoading(false);
    });
  }, []);

  if (!PUBLIC_BOLSA_ENABLED) return null;

  return (
    <section
      ref={ref as React.Ref<HTMLElement>}
      style={{
        ...s.section,
        padding: isMobile ? '56px 24px' : '88px 80px',
        opacity: inView ? 1 : 0,
        transform: inView ? 'none' : 'translateY(28px)',
        transition: 'opacity 0.8s ease, transform 0.8s ease',
      }}
    >
      <div style={{ ...s.top, flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? 16 : 0 }}>
        <div>
          <div style={s.label}>Oportunidades</div>
          <div style={s.title}>Descubrí oportunidades laborales</div>
          <div style={s.sub}>Empresas del ecosistema buscan talento UCEMA. Las publicamos acá para vos.</div>
        </div>
        <button
          style={{ ...s.btn, width: isMobile ? '100%' : 'auto', marginTop: isMobile ? 0 : 8 }}
          onClick={() => goTo('bolsa')}
          onMouseEnter={e => { (e.currentTarget).style.borderColor = 'var(--purple)'; (e.currentTarget).style.color = 'var(--purple)'; }}
          onMouseLeave={e => { (e.currentTarget).style.borderColor = 'var(--border-warm)'; (e.currentTarget).style.color = 'var(--ink-soft)'; }}
        >
          Ver todas →
        </button>
      </div>

      {loading ? (
        <div style={s.loadingWrap}>
          <div style={s.spinner} />
        </div>
      ) : empleos.length === 0 ? (
        <EmptyState variant="empleos" />
      ) : (
        <div style={s.list}>
          {empleos.slice(0, 3).map((emp, i) => (
            <div
              key={emp.id}
              style={{
                ...s.row,
                opacity: inView ? 1 : 0,
                transform: inView ? 'none' : 'translateY(16px)',
                transition: `opacity 0.5s ease ${i * 80 + 200}ms, transform 0.5s ease ${i * 80 + 200}ms`,
              }}
              onClick={() => goTo('bolsa')}
              onMouseEnter={e => {
                (e.currentTarget).style.borderColor = 'var(--purple)';
                (e.currentTarget).style.boxShadow = '0 4px 16px rgba(96,62,249,.1)';
              }}
              onMouseLeave={e => {
                (e.currentTarget).style.borderColor = 'var(--border-warm)';
                (e.currentTarget).style.boxShadow = 'none';
              }}
            >
              <div style={s.ico}>
                {emp.thumbnailUrl ? (
                  <img src={emp.thumbnailUrl} alt="" style={s.icoImg} />
                ) : emp.emoji ? (
                  <span>{emp.emoji}</span>
                ) : (
                  <span style={s.icoLetter}>{emp.title.slice(0, 1).toUpperCase()}</span>
                )}
              </div>
              <div style={s.info}>
                <h4 style={s.empTitle}>{emp.title}</h4>
                <p style={s.empSub}>{emp.company} · {emp.location}</p>
              </div>
              <div style={s.tags}>
                <Tag type={emp.typeTag}>{emp.type}</Tag>
                <Tag type="n">{emp.area}</Tag>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

const s: Record<string, React.CSSProperties> = {
  section: { padding: '88px 80px' },
  top: {
    display: 'flex', alignItems: 'flex-start',
    justifyContent: 'space-between', marginBottom: 40,
  },
  label: {
    fontSize: 11, fontWeight: 700, letterSpacing: '2.5px',
    textTransform: 'uppercase', color: 'var(--purple)', marginBottom: 12,
  },
  title: {
    fontFamily: "'Fraunces', serif",
    fontSize: 'clamp(28px, 3.5vw, 46px)', fontWeight: 700,
    letterSpacing: '-1.5px', lineHeight: 1.1, color: 'var(--ink)', marginBottom: 12,
  },
  sub: { fontSize: 15, color: 'var(--ink-muted)', lineHeight: 1.8, maxWidth: 500 },
  btn: {
    padding: '12px 28px', borderRadius: 100, fontSize: 14, fontWeight: 700,
    fontFamily: "'Instrument Sans', sans-serif", cursor: 'pointer',
    background: 'transparent', color: 'var(--ink-soft)',
    border: '1.5px solid var(--border-warm)', transition: 'all .25s',
    marginTop: 8, whiteSpace: 'nowrap',
  },
  list: { display: 'flex', flexDirection: 'column', gap: 12 },
  row: {
    display: 'flex', alignItems: 'center', gap: 16,
    padding: '16px 20px', borderRadius: 14,
    background: 'var(--white)', border: '1.5px solid var(--border-warm)',
    cursor: 'pointer', transition: 'all .2s',
  },
  ico: {
    width: 40, height: 40, borderRadius: 10,
    background: 'var(--warm)', display: 'flex',
    alignItems: 'center', justifyContent: 'center',
    fontSize: 18, flexShrink: 0,
    overflow: 'hidden',
  },
  icoImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  icoLetter: {
    fontSize: 15,
    fontWeight: 700,
    fontFamily: "'Fraunces', serif",
    color: 'var(--ink)',
  },
  info: { flex: 1 },
  empTitle: { fontSize: 14, fontWeight: 700, color: 'var(--ink)', marginBottom: 2, fontFamily: "'Instrument Sans', sans-serif" },
  empSub: { fontSize: 12, color: 'var(--ink-muted)' },
  tags: { display: 'flex', gap: 6, flexWrap: 'wrap' },
  loadingWrap: {
    display: 'flex', justifyContent: 'center', alignItems: 'center',
    padding: '40px 0',
  },
  spinner: {
    width: 32, height: 32, borderRadius: '50%',
    border: '3px solid var(--border-warm)',
    borderTopColor: 'var(--purple)',
    animation: 'spin 0.8s linear infinite',
  },
};
