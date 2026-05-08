import { useState, useEffect } from 'react';
import type { Empleo } from '../types';
import { fetchEmpleos } from '../lib/db';
import { PageHeader } from './Eventos';
import Tag from '../components/Tag';
import Footer from '../components/Footer';
import EmptyState from '../components/EmptyState';
import { useInView } from '../hooks/useInView';
import { useIsMobile } from '../hooks/useIsMobile';
import { supabase } from '../lib/supabase';

type Filter = 'Todos' | 'Full-time' | 'Part-time' | 'Pasantía' | 'Remoto' | 'Finanzas' | 'Tech' | 'Consultoría';

const FILTERS: Filter[] = ['Todos', 'Full-time', 'Part-time', 'Pasantía', 'Remoto', 'Finanzas', 'Tech', 'Consultoría'];

interface Props {
  openEmpleo: (e: Empleo, opts?: { autoApply?: boolean }) => void;
  goToTalento: () => void;
}

export default function Bolsa({ openEmpleo, goToTalento }: Props) {
  const [active, setActive] = useState<Filter>('Todos');
  const isMobile = useIsMobile();
  const [empleos, setEmpleos] = useState<Empleo[]>([]);
  const [loading, setLoading] = useState(true);
  const [talentEmail, setTalentEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setTalentEmail(data.session?.user?.email ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, s) => setTalentEmail(s?.user?.email ?? null));
    fetchEmpleos().then(data => {
      setEmpleos(data);
      setLoading(false);
      // Si volvimos desde magic link, podemos reabrir el empleo y el modal.
      const hash = String(window.location.hash || '');
      const m = hash.match(/^#apply=([a-f0-9-]+)$/i);
      const jobId = m?.[1];
      if (jobId) {
        const job = data.find(e => e.id === jobId);
        if (job) {
          (openEmpleo as unknown as (e: Empleo, opts?: { autoApply?: boolean }) => void)(job, { autoApply: true });
          // Limpieza para no re-disparar.
          try {
            window.location.hash = '';
          } catch {
            /* ignore */
          }
        }
      }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const filtered = empleos.filter(e =>
    active === 'Todos' ||
    e.type === active ||
    e.area === active
  );

  return (
    <>
      <PageHeader
        label="Oportunidades laborales"
        title="Bolsa de Empleo"
        sub="Empresas del ecosistema buscan talento UCEMA."
      />
      <div
        style={{
          padding: isMobile ? '0 16px' : '0 80px',
          marginTop: -18,
          display: 'flex',
          justifyContent: 'flex-end',
        }}
      >
        <button
          type="button"
          style={{
            padding: '8px 14px',
            borderRadius: 999,
            border: '1.5px solid var(--border-warm)',
            background: '#fff',
            cursor: 'pointer',
            fontWeight: 700,
            fontSize: 13,
            color: 'var(--ink-soft)',
          }}
          onClick={goToTalento}
          title={talentEmail ? 'Ver/editar mi perfil' : 'Ingresar para completar mi perfil'}
        >
          Mi perfil →
        </button>
      </div>
      <div style={{
        display: 'flex', gap: 8,
        padding: isMobile ? '16px 16px 0' : '24px 80px 0',
        flexWrap: 'wrap',
        overflowX: isMobile ? 'auto' : undefined,
      }}>
        {FILTERS.map(f => (
          <button
            key={f}
            style={{
              ...s.fbtn,
              ...(active === f ? s.fbtnActive : {}),
              flexShrink: 0,
            }}
            onClick={() => setActive(f)}
            onMouseEnter={e => {
              if (active !== f) {
                (e.currentTarget).style.borderColor = 'var(--purple)';
                (e.currentTarget).style.color = 'var(--purple)';
              }
            }}
            onMouseLeave={e => {
              if (active !== f) {
                (e.currentTarget).style.borderColor = 'var(--border-warm)';
                (e.currentTarget).style.color = 'var(--ink-muted)';
              }
            }}
          >
            {f}
          </button>
        ))}
      </div>
      {loading ? (
        <PageLoading />
      ) : empleos.length === 0 ? (
        <EmptyState variant="empleos" />
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
          gap: isMobile ? 12 : 16,
          padding: isMobile ? '16px 16px 40px' : '20px 80px 80px',
        }}>
          {filtered.map((emp, i) => (
            <EmpleoCard key={emp.id} empleo={emp} index={i} onClick={() => openEmpleo(emp)} />
          ))}
        </div>
      )}
      <Footer minimal />
    </>
  );
}

function PageLoading() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
      <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid var(--purple-soft)', borderTopColor: 'var(--purple)', animation: 'spin 0.8s linear infinite' }} />
    </div>
  );
}

function EmpleoCard({ empleo: emp, index, onClick }: { empleo: Empleo; index: number; onClick: () => void }) {
  const { ref, inView } = useInView(0.05);
  return (
    <div
      ref={ref as React.Ref<HTMLDivElement>}
      style={{
        ...s.card,
        opacity: inView ? 1 : 0,
        transform: inView ? 'none' : 'translateY(16px)',
        transition: `opacity 0.5s ease ${index * 60}ms, transform 0.5s ease ${index * 60}ms`,
      }}
      onClick={onClick}
      onMouseEnter={e => {
        (e.currentTarget).style.borderColor = 'var(--purple)';
        (e.currentTarget).style.boxShadow = '0 8px 24px rgba(96,62,249,.1)';
        (e.currentTarget).style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={e => {
        (e.currentTarget).style.borderColor = 'var(--border-warm)';
        (e.currentTarget).style.boxShadow = 'none';
        (e.currentTarget).style.transform = inView ? 'none' : 'translateY(16px)';
      }}
    >
      <div style={s.cardTop}>
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
      </div>
      <div style={s.cardBottom}>
        <div style={s.tags}>
          <Tag type={emp.typeTag}>{emp.type}</Tag>
          <Tag type="n">{emp.area}</Tag>
        </div>
        <button
          style={s.applyBtn}
          onMouseEnter={e => (e.currentTarget).style.background = 'var(--purple)'}
          onMouseLeave={e => (e.currentTarget).style.background = 'var(--ink)'}
        >
          Ver más
        </button>
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  fbtn: {
    padding: '7px 16px', borderRadius: 100,
    border: '1.5px solid var(--border-warm)',
    background: 'var(--white)', color: 'var(--ink-muted)',
    fontFamily: "'Instrument Sans', sans-serif", fontSize: 12,
    fontWeight: 600, cursor: 'pointer', transition: 'all .2s',
  },
  fbtnActive: {
    background: 'var(--ink)', borderColor: 'var(--ink)',
    color: 'white',
  },
  card: {
    borderRadius: 16, border: '1.5px solid var(--border-warm)',
    background: 'var(--white)', padding: '20px 24px',
    cursor: 'pointer', transition: 'all .25s',
  },
  cardTop: { display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 },
  ico: {
    width: 48, height: 48, borderRadius: 12,
    background: 'var(--warm)', display: 'flex',
    alignItems: 'center', justifyContent: 'center',
    fontSize: 22, flexShrink: 0,
    overflow: 'hidden',
  },
  icoImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  icoLetter: {
    fontSize: 16,
    fontWeight: 700,
    color: 'var(--ink)',
    fontFamily: "'Fraunces', serif",
  },
  info: { flex: 1 },
  empTitle: {
    fontFamily: "'Instrument Sans', sans-serif",
    fontSize: 15, fontWeight: 700, color: 'var(--ink)', marginBottom: 3,
  },
  empSub: { fontSize: 13, color: 'var(--ink-muted)' },
  cardBottom: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  tags: { display: 'flex', gap: 6 },
  applyBtn: {
    padding: '8px 16px', borderRadius: 100, fontSize: 12, fontWeight: 700,
    fontFamily: "'Instrument Sans', sans-serif",
    background: 'var(--ink)', color: 'white', border: 'none',
    cursor: 'pointer', transition: 'background .2s',
  },
};
