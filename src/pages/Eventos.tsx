import { useMemo, useState, useEffect } from 'react';
import type { Evento, Charla } from '../types';
import { fetchCharlas, fetchEventos } from '../lib/db';
import Tag from '../components/Tag';
import Footer from '../components/Footer';
import EmptyState from '../components/EmptyState';
import { useInView } from '../hooks/useInView';
import { useIsMobile } from '../hooks/useIsMobile';

interface Props {
  openEvento: (e: Evento) => void;
  openCharla: (c: Charla) => void;
}

type TabId = 'proximos' | 'archivo';

export default function Eventos({ openEvento, openCharla }: Props) {
  const isMobile = useIsMobile();
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [charlas, setCharlas] = useState<Charla[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabId>('proximos');

  useEffect(() => {
    Promise.all([fetchEventos(), fetchCharlas()]).then(([evs, chs]) => {
      setEventos(evs);
      setCharlas(chs);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    const applyHash = () => {
      const h = (window.location.hash || '').replace('#', '').trim().toLowerCase();
      if (h === 'archivo') setTab('archivo');
      if (h === 'proximos') setTab('proximos');
    };
    applyHash();
    window.addEventListener('hashchange', applyHash);
    return () => window.removeEventListener('hashchange', applyHash);
  }, []);

  const tabs = useMemo(() => {
    return [
      { id: 'proximos' as const, label: 'Próximos' },
      { id: 'archivo' as const, label: 'Archivo' },
    ];
  }, []);

  return (
    <>
      <PageHeader
        label={tab === 'proximos' ? 'Próximas actividades' : 'Archivo de contenido'}
        title="Eventos"
        sub={
          tab === 'proximos'
            ? 'Inscribite y formá parte de la próxima charla, workshop o encuentro.'
            : 'Charlas, paneles y materiales de eventos ya realizados.'
        }
      />
      <div
        style={{
          padding: isMobile ? '14px 16px 0' : '16px 80px 0',
          display: 'flex',
          gap: 8,
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        {tabs.map(t => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setTab(t.id);
                try {
                  window.location.hash = t.id === 'archivo' ? 'archivo' : 'proximos';
                } catch {
                  /* ignore */
                }
              }}
              style={{
                padding: '8px 14px',
                borderRadius: 999,
                border: `1.5px solid ${active ? 'rgba(96,62,249,.30)' : 'var(--border-warm)'}`,
                background: active ? 'rgba(96,62,249,.10)' : 'var(--warm)',
                color: active ? 'var(--purple)' : 'var(--ink-soft)',
                fontWeight: 800,
                fontSize: 12,
                cursor: 'pointer',
                fontFamily: "'Instrument Sans', sans-serif",
                transition: 'all .18s',
              }}
            >
              {t.label}
            </button>
          );
        })}
      </div>
      {loading ? (
        <PageLoading />
      ) : (
        <>
          {tab === 'proximos' ? (
            eventos.length === 0 ? (
              <EmptyState variant="eventos" />
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
                  gap: isMobile ? 16 : 20,
                  padding: isMobile ? '20px 16px 40px' : '24px 80px 60px',
                }}
              >
                {eventos.map((ev, i) => (
                  <EventCard key={ev.id} evento={ev} index={i} onClick={() => openEvento(ev)} />
                ))}
              </div>
            )
          ) : charlas.length === 0 ? (
            <EmptyState variant="charlas" />
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
                gap: isMobile ? 14 : 18,
                padding: isMobile ? '18px 16px 40px' : '24px 80px 60px',
              }}
            >
              {charlas.map((ch, i) => (
                <CharlaCard key={ch.id} charla={ch} index={i} onClick={() => openCharla(ch)} />
              ))}
            </div>
          )}

          {tab === 'proximos' ? (
            <div style={{ margin: isMobile ? '0 16px 40px' : '0 80px 72px' }}>
              <div
                style={{
                  borderRadius: 16,
                  overflow: 'hidden',
                  border: '1.5px solid var(--border-warm)',
                }}
              >
                <iframe
                  title="Sede Xplora UCEMA"
                  src="https://maps.google.com/maps?q=Reconquista+775,+Buenos+Aires,+Argentina&hl=es&output=embed"
                  width="100%"
                  height={isMobile ? 220 : 300}
                  style={{ border: 0, display: 'block' }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '12px 4px 0',
                }}
              >
                <span style={{ fontSize: 14 }}>📍</span>
                <span style={{ fontSize: 13, color: 'var(--ink-muted)', fontWeight: 500 }}>
                  Auditorio UCEMA · Reconquista 775, CABA
                </span>
              </div>
            </div>
          ) : null}
        </>
      )}
      <Footer minimal />
    </>
  );
}

function CharlaCard({ charla: ch, index, onClick }: { charla: Charla; index: number; onClick: () => void }) {
  const { ref, inView } = useInView(0.1);
  return (
    <div
      ref={ref as React.Ref<HTMLDivElement>}
      style={{
        ...cs.card,
        opacity: inView ? 1 : 0,
        transform: inView ? 'none' : 'translateY(20px)',
        transition: `opacity 0.6s ease ${index * 60}ms, transform 0.6s ease ${index * 60}ms`,
      }}
      onClick={onClick}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'rgba(96,62,249,.3)';
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 12px 36px rgba(26,16,40,.1)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'var(--border-warm)';
        e.currentTarget.style.transform = inView ? 'none' : 'translateY(20px)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div style={cs.thumb}>
        {ch.thumbnailUrl ? (
          <>
            <img src={ch.thumbnailUrl} alt="" style={cs.thumbImg} />
            <div style={cs.thumbOverlay} aria-hidden />
          </>
        ) : ch.emoji ? (
          <span style={{ ...cs.ico, position: 'relative', zIndex: 1 }}>{ch.emoji}</span>
        ) : (
          <span
            style={{
              ...cs.ico,
              position: 'relative',
              zIndex: 1,
              fontSize: 20,
              fontWeight: 700,
              color: 'rgba(255,255,255,0.9)',
            }}
          >
            {ch.title.slice(0, 1).toUpperCase()}
          </span>
        )}
        <div style={{ ...cs.playBtn, zIndex: 2 }} />
      </div>
      <div style={cs.body}>
        <div style={cs.date}>{ch.date}</div>
        <h3 style={cs.title}>{ch.title}</h3>
        <div style={cs.oraRow}>
          <div style={cs.avatar}>{ch.speakerInitials}</div>
          <span style={cs.oraName}>{ch.speakerName}</span>
        </div>
        <div style={cs.actions}>
          <SmBtn primary onClick={e => { e.stopPropagation(); onClick(); }}>▶ Ver grabación</SmBtn>
          <SmBtn onClick={e => { e.stopPropagation(); }}>↓ Material</SmBtn>
        </div>
      </div>
    </div>
  );
}

function SmBtn({
  primary,
  children,
  onClick,
}: {
  primary?: boolean;
  children: React.ReactNode;
  onClick: (e: React.MouseEvent) => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '7px 12px',
        borderRadius: 100,
        fontSize: 11,
        fontWeight: 700,
        cursor: 'pointer',
        fontFamily: "'Instrument Sans', sans-serif",
        transition: 'all .2s',
        ...(primary
          ? { background: 'var(--purple-soft)', color: 'var(--purple)', border: '1.5px solid rgba(96,62,249,.2)' }
          : { background: 'var(--warm)', color: 'var(--ink-soft)', border: '1.5px solid var(--border-warm)' }),
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = primary ? 'var(--purple)' : 'var(--ink)';
        e.currentTarget.style.color = 'white';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = primary ? 'var(--purple-soft)' : 'var(--warm)';
        e.currentTarget.style.color = primary ? 'var(--purple)' : 'var(--ink-soft)';
      }}
    >
      {children}
    </button>
  );
}

function EventCard({ evento: ev, index, onClick }: { evento: Evento; index: number; onClick: () => void }) {
  const { ref, inView } = useInView(0.1);
  return (
    <div
      ref={ref as React.Ref<HTMLDivElement>}
      style={{
        ...s.card,
        opacity: inView ? 1 : 0,
        transform: inView ? 'none' : 'translateY(24px)',
        transition: `opacity 0.6s ease ${index * 80}ms, transform 0.6s ease ${index * 80}ms`,
      }}
      onClick={onClick}
      onMouseEnter={e => {
        (e.currentTarget).style.transform = 'translateY(-3px)';
        (e.currentTarget).style.boxShadow = '0 20px 48px rgba(26,16,40,.1)';
        (e.currentTarget).style.borderColor = 'rgba(96,62,249,.3)';
      }}
      onMouseLeave={e => {
        (e.currentTarget).style.transform = inView ? 'none' : 'translateY(24px)';
        (e.currentTarget).style.boxShadow = 'none';
        (e.currentTarget).style.borderColor = 'var(--border-warm)';
      }}
    >
      <div style={s.top}>
        {ev.thumbnailUrl ? (
          <>
            <img src={ev.thumbnailUrl} alt="" style={s.thumbImg} />
            <div style={s.thumbOverlay} aria-hidden />
          </>
        ) : ev.emoji ? (
          <span style={{ ...s.ico, position: 'relative', zIndex: 1 }}>{ev.emoji}</span>
        ) : (
          <span style={{ ...s.ico, position: 'relative', zIndex: 1, fontSize: 22, fontWeight: 700, color: 'rgba(255,255,255,0.9)' }}>
            {ev.title.slice(0, 1).toUpperCase()}
          </span>
        )}
        <div style={{ ...s.badge, zIndex: 2 }}>
          <span style={s.badgeDay}>{ev.day}</span>
          <span style={s.badgeMon}>{ev.month}</span>
        </div>
      </div>
      <div style={s.body}>
        <Tag type={ev.tagType} style={{ marginBottom: 10, display: 'inline-block' }}>{ev.tagLabel}</Tag>
        <h3 style={s.cardTitle}>{ev.title}</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 12 }}>
          <MetaRow icon="📅" text={ev.date} />
          <MetaRow icon="📍" text={ev.location} />
        </div>
        <p style={s.desc}>{ev.desc}</p>
        <div style={s.foot}>
          <div style={s.speaker}>
            <div style={s.avatar}>{ev.speakerInitials}</div>
            <div>
              <div style={s.spName}>{ev.speakerName}</div>
              <div style={s.spRole}>{ev.speakerRole}</div>
            </div>
          </div>
          <button
            style={s.inscBtn}
            onClick={e => { e.stopPropagation(); onClick(); }}
            onMouseEnter={e => (e.currentTarget).style.background = 'var(--purple)'}
            onMouseLeave={e => (e.currentTarget).style.background = 'var(--ink)'}
          >
            Inscribirme
          </button>
        </div>
      </div>
    </div>
  );
}

function MetaRow({ icon, text }: { icon: string; text: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: 'var(--ink-muted)', fontWeight: 500 }}>
      <span>{icon}</span>{text}
    </div>
  );
}

function PageLoading() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
      <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid var(--purple-soft)', borderTopColor: 'var(--purple)', animation: 'spin 0.8s linear infinite' }} />
    </div>
  );
}

export function PageHeader({ label, title, sub }: { label: string; title: string; sub: string }) {
  const isMobile = useIsMobile();
  return (
    <div style={{
      padding: isMobile ? '32px 24px 24px' : '52px 80px 36px',
      borderBottom: '1px solid var(--border-warm)',
      background: 'var(--white)',
    }}>
      <div style={s.hdrLabel}>{label}</div>
      <h1 style={{ ...s.hdrTitle, fontSize: isMobile ? 36 : 48 }}>{title}</h1>
      <p style={s.hdrSub}>{sub}</p>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  hdrLabel: {
    fontSize: 11, fontWeight: 700, letterSpacing: '2.5px',
    textTransform: 'uppercase', color: 'var(--purple)', marginBottom: 8,
  },
  hdrTitle: {
    fontFamily: "'Fraunces', serif",
    fontSize: 48, fontWeight: 700, letterSpacing: '-2px', marginBottom: 6, color: 'var(--ink)',
  },
  hdrSub: { color: 'var(--ink-muted)', fontSize: 15 },
  card: {
    borderRadius: 18, border: '1.5px solid var(--border-warm)',
    background: 'var(--white)', overflow: 'hidden', cursor: 'pointer',
    transition: 'all .3s',
  },
  top: {
    height: 148,
    background: 'linear-gradient(135deg, #1A1028, #2D1B50)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    position: 'relative',
  },
  thumbImg: {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  thumbOverlay: {
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(180deg, rgba(26,16,40,0.15) 0%, rgba(26,16,40,0.55) 100%)',
  },
  ico: { fontSize: 40, position: 'relative', zIndex: 1 },
  badge: {
    position: 'absolute', top: 16, right: 16,
    background: 'white', borderRadius: 10,
    padding: '8px 13px', textAlign: 'center',
  },
  badgeDay: {
    fontFamily: "'Fraunces', serif",
    fontSize: 20, fontWeight: 700, display: 'block', lineHeight: 1,
  },
  badgeMon: {
    fontSize: 10, fontWeight: 700, letterSpacing: 1,
    textTransform: 'uppercase', color: 'var(--ink-muted)',
  },
  body: { padding: 24 },
  cardTitle: {
    fontFamily: "'Fraunces', serif",
    fontSize: 18, fontWeight: 700, marginBottom: 10,
    lineHeight: 1.3, color: 'var(--ink)', letterSpacing: '-0.3px',
  },
  desc: { fontSize: 13, color: 'var(--ink-muted)', lineHeight: 1.7, marginBottom: 20 },
  foot: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  speaker: { display: 'flex', alignItems: 'center', gap: 9 },
  avatar: {
    width: 32, height: 32, borderRadius: '50%',
    background: 'linear-gradient(135deg, var(--purple), #A08BFF)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 12, fontWeight: 700, color: 'white', flexShrink: 0,
  },
  spName: { fontSize: 12, fontWeight: 700, color: 'var(--ink)' },
  spRole: { fontSize: 11, color: 'var(--ink-muted)' },
  inscBtn: {
    padding: '8px 18px', borderRadius: 100, fontSize: 12, fontWeight: 700,
    fontFamily: "'Instrument Sans', sans-serif",
    background: 'var(--ink)', color: 'white', border: 'none',
    cursor: 'pointer', transition: 'background .2s',
  },
};

const cs: Record<string, React.CSSProperties> = {
  card: {
    borderRadius: 16,
    border: '1.5px solid var(--border-warm)',
    background: 'var(--white)',
    overflow: 'hidden',
    cursor: 'pointer',
    transition: 'all .3s',
  },
  thumb: {
    height: 120,
    background: 'linear-gradient(135deg, #1A1028, #2D1B50)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  thumbImg: {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  thumbOverlay: {
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(180deg, rgba(26,16,40,0.12) 0%, rgba(26,16,40,0.55) 100%)',
  },
  ico: { fontSize: 34 },
  playBtn: {
    position: 'absolute',
    bottom: -15,
    right: 16,
    width: 30,
    height: 30,
    borderRadius: '50%',
    background: 'white',
    boxShadow: '0 4px 12px rgba(26,16,40,.2)',
    backgroundImage: 'none',
  },
  body: { padding: '24px 16px 16px' },
  date: { fontSize: 11, color: 'var(--ink-faint)', marginBottom: 6, fontWeight: 600, letterSpacing: '.3px' },
  title: {
    fontFamily: "'Fraunces', serif",
    fontSize: 15,
    fontWeight: 700,
    marginBottom: 8,
    lineHeight: 1.4,
    color: 'var(--ink)',
    letterSpacing: '-0.2px',
  },
  oraRow: { display: 'flex', alignItems: 'center', gap: 7, marginBottom: 16 },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, var(--purple), #A08BFF)',
    fontSize: 9,
    fontWeight: 700,
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  oraName: { fontSize: 11, color: 'var(--ink-muted)', fontWeight: 600 },
  actions: { display: 'flex', gap: 6 },
};
