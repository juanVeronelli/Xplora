import { useState, useEffect } from 'react';
import type { Charla } from '../types';
import { fetchCharlas } from '../lib/db';
import { PageHeader } from './Eventos';
import Footer from '../components/Footer';
import EmptyState from '../components/EmptyState';
import { useInView } from '../hooks/useInView';
import { useIsMobile } from '../hooks/useIsMobile';

interface Props { openCharla: (c: Charla) => void; }

export default function Charlas({ openCharla }: Props) {
  const isMobile = useIsMobile();
  const [charlas, setCharlas] = useState<Charla[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCharlas().then(data => { setCharlas(data); setLoading(false); });
  }, []);

  return (
    <>
      <PageHeader
        label="Agenda del club"
        title="Pasados"
        sub="Grabaciones y materiales de encuentros ya realizados."
      />
      {loading ? (
        <PageLoading />
      ) : charlas.length === 0 ? (
        <EmptyState variant="charlas" />
      ) : (
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
        gap: isMobile ? 14 : 18,
        padding: isMobile ? '20px 16px 40px' : '32px 80px 80px',
      }}>
        {charlas.map((ch, i) => (
          <CharlaCard key={ch.id} charla={ch} index={i} onClick={() => openCharla(ch)} />
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

function CharlaCard({ charla: ch, index, onClick }: { charla: Charla; index: number; onClick: () => void }) {
  const { ref, inView } = useInView(0.1);
  return (
    <div
      ref={ref as React.Ref<HTMLDivElement>}
      style={{
        ...s.card,
        opacity: inView ? 1 : 0,
        transform: inView ? 'none' : 'translateY(20px)',
        transition: `opacity 0.6s ease ${index * 60}ms, transform 0.6s ease ${index * 60}ms`,
      }}
      onClick={onClick}
      onMouseEnter={e => {
        (e.currentTarget).style.borderColor = 'rgba(96,62,249,.3)';
        (e.currentTarget).style.transform = 'translateY(-2px)';
        (e.currentTarget).style.boxShadow = '0 12px 36px rgba(26,16,40,.1)';
      }}
      onMouseLeave={e => {
        (e.currentTarget).style.borderColor = 'var(--border-warm)';
        (e.currentTarget).style.transform = inView ? 'none' : 'translateY(20px)';
        (e.currentTarget).style.boxShadow = 'none';
      }}
    >
      <div style={s.thumb}>
        {ch.thumbnailUrl ? (
          <>
            <img src={ch.thumbnailUrl} alt="" style={s.thumbImg} />
            <div style={s.thumbOverlay} aria-hidden />
          </>
        ) : ch.emoji ? (
          <span style={{ ...s.ico, position: 'relative', zIndex: 1 }}>{ch.emoji}</span>
        ) : (
          <span style={{ ...s.ico, position: 'relative', zIndex: 1, fontSize: 20, fontWeight: 700, color: 'rgba(255,255,255,0.9)' }}>
            {ch.title.slice(0, 1).toUpperCase()}
          </span>
        )}
        <div style={{ ...s.playBtn, zIndex: 2 }} />
      </div>
      <div style={s.body}>
        <div style={s.date}>{ch.date}</div>
        <h3 style={s.title}>{ch.title}</h3>
        <div style={s.oraRow}>
          <div style={s.avatar}>{ch.speakerInitials}</div>
          <span style={s.oraName}>{ch.speakerName}</span>
        </div>
        <div style={s.actions}>
          <SmBtn primary onClick={e => { e.stopPropagation(); onClick(); }}>▶ Ver grabación</SmBtn>
          <SmBtn onClick={e => { e.stopPropagation(); }}>↓ Material</SmBtn>
        </div>
      </div>
    </div>
  );
}

function SmBtn({ primary, children, onClick }: { primary?: boolean; children: React.ReactNode; onClick: (e: React.MouseEvent) => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '7px 12px', borderRadius: 100, fontSize: 11, fontWeight: 700,
        cursor: 'pointer', fontFamily: "'Instrument Sans', sans-serif",
        transition: 'all .2s',
        ...(primary
          ? { background: 'var(--purple-soft)', color: 'var(--purple)', border: '1.5px solid rgba(96,62,249,.2)' }
          : { background: 'var(--warm)', color: 'var(--ink-soft)', border: '1.5px solid var(--border-warm)' }
        ),
      }}
      onMouseEnter={e => {
        (e.currentTarget).style.background = primary ? 'var(--purple)' : 'var(--ink)';
        (e.currentTarget).style.color = 'white';
      }}
      onMouseLeave={e => {
        (e.currentTarget).style.background = primary ? 'var(--purple-soft)' : 'var(--warm)';
        (e.currentTarget).style.color = primary ? 'var(--purple)' : 'var(--ink-soft)';
      }}
    >
      {children}
    </button>
  );
}

const s: Record<string, React.CSSProperties> = {
  card: {
    borderRadius: 16, border: '1.5px solid var(--border-warm)',
    background: 'var(--white)', overflow: 'hidden', cursor: 'pointer',
    transition: 'all .3s',
  },
  thumb: {
    height: 120,
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
    background: 'linear-gradient(180deg, rgba(26,16,40,0.12) 0%, rgba(26,16,40,0.55) 100%)',
  },
  ico: { fontSize: 34 },
  playBtn: {
    position: 'absolute', bottom: -15, right: 16,
    width: 30, height: 30, borderRadius: '50%',
    background: 'white', boxShadow: '0 4px 12px rgba(26,16,40,.2)',
    backgroundImage: 'none',
  },
  body: { padding: '24px 16px 16px' },
  date: { fontSize: 11, color: 'var(--ink-faint)', marginBottom: 6, fontWeight: 600, letterSpacing: '.3px' },
  title: {
    fontFamily: "'Fraunces', serif",
    fontSize: 15, fontWeight: 700, marginBottom: 8, lineHeight: 1.4,
    color: 'var(--ink)', letterSpacing: '-0.2px',
  },
  oraRow: { display: 'flex', alignItems: 'center', gap: 7, marginBottom: 16 },
  avatar: {
    width: 24, height: 24, borderRadius: '50%',
    background: 'linear-gradient(135deg, var(--purple), #A08BFF)',
    fontSize: 9, fontWeight: 700, color: 'white',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  oraName: { fontSize: 11, color: 'var(--ink-muted)', fontWeight: 600 },
  actions: { display: 'flex', gap: 6 },
};
