import { useEffect, useRef, type ReactNode } from 'react';
import type { Page } from '../types';
import { useSiteMedia } from '../context/SiteMediaContext';
import { useInView } from '../hooks/useInView';
import { useIsMobile } from '../hooks/useIsMobile';
import Counter from './Counter';

interface Props { goTo: (p: Page) => void; }

export default function Hero({ goTo }: Props) {
  const { heroUrl } = useSiteMedia();
  const isMobile = useIsMobile();
  const colRef = useRef<HTMLDivElement>(null);
  const { ref: statsRef, inView: statsInView } = useInView(0.1);

  useEffect(() => {
    const col = colRef.current;
    if (!col) return;
    const kids = Array.from(col.children) as HTMLElement[];
    kids.forEach((el, i) => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(18px)';
      el.style.transition = `opacity 0.65s cubic-bezier(0.22,1,0.36,1) ${i * 100 + 60}ms,
                              transform 0.65s cubic-bezier(0.22,1,0.36,1) ${i * 100 + 60}ms`;
    });
    requestAnimationFrame(() =>
      requestAnimationFrame(() =>
        kids.forEach(el => { el.style.opacity = '1'; el.style.transform = 'none'; })
      )
    );
  }, []);

  return (
    <section style={{ ...s.hero, flexDirection: 'row', height: isMobile ? 'auto' : 'calc(100vh - 60px)', minHeight: isMobile ? 'auto' : 620 }}>

      {/* ── PHOTO — hidden on mobile, right on desktop ── */}
      {!isMobile && (
        <div style={{ ...s.right, order: 1, flex: '0 0 42%', height: '100%' }}>
          <img src={heroUrl} alt="Evento Xplora UCEMA" style={{ ...s.photo, objectPosition: 'center 30%' }} />
          <div style={s.blendLeft} />
          <div style={{ ...s.dimBottom, height: '40%', background: 'linear-gradient(to top, rgba(10,6,20,.75) 0%, transparent 100%)' }} />
        </div>
      )}

      {/* ── LEFT — dark content panel ── */}
      <div style={{
        ...s.left,
        flex: isMobile ? '1 1 100%' : '0 0 58%',
        padding: isMobile ? '40px 24px 52px' : 'clamp(48px, 8vh, 72px) clamp(48px, 6vw, 96px)',
        minHeight: isMobile ? '100svh' : undefined,
      }}>
        <div style={s.grain} />
        <div style={s.glow} />

        <div ref={colRef} style={{ ...s.col, padding: isMobile ? 0 : undefined }}>
          <div style={s.kickerWrap}>
            <p style={s.kicker}>Universidad del CEMA</p>
            <span style={s.kickerLine} aria-hidden />
          </div>

          <h1
            style={{
              ...s.h1,
              fontSize: isMobile ? 'clamp(36px, 9vw, 48px)' : 'clamp(42px, 3.8vw, 56px)',
              letterSpacing: isMobile ? '-1.2px' : '-2px',
            }}
          >
            Donde las ideas
            <br />
            se vuelven <em style={s.em}>reales.</em>
          </h1>

          <p style={{ ...s.body, fontSize: isMobile ? 14 : 16 }}>
            Somos el club de emprendimiento de UCEMA: un espacio hecho por y para
            estudiantes que quieren pasar de la idea al plan — con encuentros,
            charlas y contactos que sí se usan después.
          </p>

          <div style={{ ...s.btns, flexDirection: isMobile ? 'column' : 'row' }}>
            <button
              type="button"
              style={{ ...s.btnPrimary, width: isMobile ? '100%' : 'auto' }}
              onClick={() => goTo('eventos')}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--purple)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'white'; }}
            >
              Ver eventos →
            </button>
            <button
              type="button"
              style={{ ...s.btnGhost, width: isMobile ? '100%' : 'auto' }}
              onClick={() => {
                goTo('eventos');
                // Seleccionar tab "Archivo" en la vista unificada.
                setTimeout(() => {
                  try {
                    window.location.hash = 'archivo';
                  } catch {
                    /* ignore */
                  }
                }, 50);
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.5)'; e.currentTarget.style.color = 'white'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)'; e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; }}
            >
              Archivo
            </button>
          </div>

          <div ref={statsRef as React.Ref<HTMLDivElement>} style={s.statsRail}>
            <p style={s.statsLabel}>La comunidad en números</p>
            <div style={s.statsCard}>
              <HeroStat
                figure={
                  <>
                    +<Counter target={2200} triggered={statsInView} />
                  </>
                }
                caption="personas en la comunidad"
              />
              <span style={s.statDot} aria-hidden>
                ·
              </span>
              <HeroStat
                figure={
                  <>
                    +<Counter target={40} triggered={statsInView} />
                  </>
                }
                caption="encuentros y charlas"
              />
              <span style={s.statDot} aria-hidden>
                ·
              </span>
              <HeroStat figure="2022" caption="primer año del club" />
              <span style={s.statDot} aria-hidden>
                ·
              </span>
              <HeroStat
                figure={
                  <>
                    +<Counter target={120} triggered={statsInView} />
                  </>
                }
                caption="asistentes por evento"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function HeroStat({ figure, caption }: { figure: ReactNode; caption: string }) {
  return (
    <div style={s.statBlock}>
      <div style={s.statFigure}>{figure}</div>
      <div style={s.statCaption}>{caption}</div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  hero: { display: 'flex', overflow: 'hidden' },
  left: {
    background: 'var(--ink)',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  grain: {
    position: 'absolute', inset: 0, zIndex: 0, opacity: 0.035,
    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'repeat', backgroundSize: '180px',
  },
  glow: {
    position: 'absolute', bottom: -120, right: -80,
    width: 400, height: 400, borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(96,62,249,0.22) 0%, transparent 68%)',
    zIndex: 0,
  },
  col: {
    position: 'relative',
    zIndex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    width: '100%',
    maxWidth: '100%',
    boxSizing: 'border-box',
  },
  kickerWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    marginBottom: 22,
  },
  kicker: {
    margin: 0,
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.2em',
    textTransform: 'uppercase',
    color: 'rgba(160, 139, 255, 0.92)',
  },
  kickerLine: {
    flex: 1,
    height: 1,
    maxWidth: 120,
    background: 'linear-gradient(90deg, rgba(160,139,255,0.45), transparent)',
    borderRadius: 1,
  },
  h1: {
    fontFamily: "'Fraunces', serif",
    fontWeight: 700,
    lineHeight: 1.14,
    color: 'white',
    marginBottom: 24,
    maxWidth: '100%',
  },
  em: { fontStyle: 'italic', color: '#A08BFF' },
  body: {
    color: 'rgba(255,255,255,0.58)',
    lineHeight: 1.82,
    maxWidth: '52ch',
    marginBottom: 28,
    fontWeight: 400,
  },
  btns: { display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginBottom: 28, width: '100%' },
  btnPrimary: {
    padding: '13px 26px', borderRadius: 100, fontSize: 14, fontWeight: 700,
    fontFamily: "'Instrument Sans', sans-serif", cursor: 'pointer',
    background: 'white', color: 'var(--ink)', border: 'none', transition: 'all .25s',
    textAlign: 'center',
  },
  btnGhost: {
    padding: '12px 22px', borderRadius: 100, fontSize: 14, fontWeight: 600,
    fontFamily: "'Instrument Sans', sans-serif", cursor: 'pointer',
    background: 'transparent', color: 'rgba(255,255,255,0.7)',
    border: '1.5px solid rgba(255,255,255,0.18)', transition: 'all .22s',
    textAlign: 'center',
  },
  statsRail: {
    width: '100%',
    marginTop: 8,
    paddingTop: 28,
    borderTop: '1px solid rgba(255,255,255,0.12)',
  },
  statsLabel: {
    margin: '0 0 14px',
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.38)',
  },
  statsCard: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '12px 10px',
    rowGap: 16,
    padding: '18px 22px',
    borderRadius: 16,
    border: '1px solid rgba(255,255,255,0.1)',
    background: 'rgba(255,255,255,0.05)',
    boxShadow: '0 12px 40px rgba(0,0,0,0.18)',
    width: '100%',
    boxSizing: 'border-box',
  },
  statBlock: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    minWidth: 0,
  },
  statFigure: {
    fontFamily: "'Fraunces', serif",
    fontSize: 'clamp(24px, 2.8vw, 30px)',
    fontWeight: 700,
    color: 'white',
    letterSpacing: '-0.6px',
    lineHeight: 1.05,
    fontVariantNumeric: 'tabular-nums',
  },
  statCaption: {
    fontSize: 12,
    lineHeight: 1.4,
    color: 'rgba(255,255,255,0.52)',
    fontWeight: 500,
    letterSpacing: '0.02em',
    maxWidth: 168,
  },
  statDot: {
    color: 'rgba(255,255,255,0.28)',
    fontSize: 22,
    lineHeight: 1,
    paddingBottom: 4,
    userSelect: 'none',
  },
  right: { position: 'relative', overflow: 'hidden' },
  photo: { width: '100%', height: '100%', objectFit: 'cover', display: 'block' },
  blendLeft: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: 160,
    background: 'linear-gradient(to right, var(--ink) 0%, rgba(26,16,40,0) 100%)',
    zIndex: 2,
  },
  dimBottom: {
    position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 2,
  },
};
