import { useEffect, useRef } from 'react';
import type { Page } from '../types';
import { useSiteMedia } from '../context/SiteMediaContext';
import { useIsMobile } from '../hooks/useIsMobile';

interface Props { goTo: (p: Page) => void; }

export default function Hero({ goTo }: Props) {
  const { heroUrl } = useSiteMedia();
  const isMobile = useIsMobile();
  const colRef = useRef<HTMLDivElement>(null);

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
        <div style={s.glowTop} />

        <div ref={colRef} style={{ ...s.col, padding: isMobile ? 0 : undefined }}>
          <div style={s.kickerWrap}>
            <p style={s.kicker}>Universidad del CEMA</p>
            <span style={s.kickerLine} aria-hidden />
          </div>

          <h1 style={s.h1}>
            <span
              style={{
                ...s.h1Line1,
                fontSize: isMobile ? 'clamp(34px, 8.5vw, 46px)' : 'clamp(44px, 4.2vw, 62px)',
                letterSpacing: isMobile ? '-1.4px' : '-2.4px',
              }}
            >
              Workshops y charlas top
            </span>
            <span
              style={{
                ...s.h1Line2,
                fontSize: isMobile ? 'clamp(30px, 7.5vw, 42px)' : 'clamp(38px, 3.5vw, 52px)',
                letterSpacing: isMobile ? '-1px' : '-1.8px',
              }}
            >
              con oportunidades reales.
            </span>
          </h1>

          <div style={s.bodyRule} aria-hidden />

          <p style={{ ...s.body, fontSize: isMobile ? 15 : 17 }}>
            Somos el club de emprendedores de UCEMA: comunidad, herramientas y contactos
            para pasar de la idea al plan y hacerlo con gente que empuja en serio.
          </p>

          <div style={{ ...s.btns, flexDirection: isMobile ? 'column' : 'row' }}>
            <button
              type="button"
              style={{ ...s.btnPrimary, width: isMobile ? '100%' : 'auto' }}
              onClick={() => goTo('eventos')}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'var(--purple)';
                e.currentTarget.style.boxShadow = '0 8px 32px rgba(96,62,249,0.55)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'white';
                e.currentTarget.style.boxShadow = s.btnPrimary.boxShadow as string;
              }}
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
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'rgba(160,139,255,0.65)';
                e.currentTarget.style.color = 'white';
                e.currentTarget.style.background = 'rgba(96,62,249,0.12)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.22)';
                e.currentTarget.style.color = 'rgba(255,255,255,0.78)';
                e.currentTarget.style.background = 'transparent';
              }}
            >
              Archivo
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

const s: Record<string, React.CSSProperties> = {
  hero: { display: 'flex', overflow: 'hidden' },
  left: {
    background:
      'linear-gradient(168deg, #2a2242 0%, #1e1530 28%, var(--ink) 58%, #120a1c 100%)',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  grain: {
    position: 'absolute', inset: 0, zIndex: 0, opacity: 0.048,
    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'repeat', backgroundSize: '180px',
  },
  glow: {
    position: 'absolute', bottom: -140, right: '-12%',
    width: 480, height: 480, borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(96,62,249,0.32) 0%, rgba(96,62,249,0.06) 45%, transparent 70%)',
    zIndex: 0,
  },
  glowTop: {
    position: 'absolute', top: '-25%', left: '-15%',
    width: 380, height: 380, borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(160,139,255,0.14) 0%, transparent 65%)',
    zIndex: 0,
    pointerEvents: 'none',
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
    marginBottom: 26,
  },
  kicker: {
    margin: 0,
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '0.22em',
    textTransform: 'uppercase',
    color: 'rgba(220, 210, 255, 0.95)',
    padding: '8px 16px',
    borderRadius: 100,
    border: '1px solid rgba(160, 139, 255, 0.38)',
    background: 'linear-gradient(135deg, rgba(96,62,249,0.2) 0%, rgba(96,62,249,0.06) 100%)',
    boxShadow: '0 0 0 1px rgba(0,0,0,0.12) inset, 0 12px 40px rgba(96,62,249,0.12)',
  },
  kickerLine: {
    flex: 1,
    height: 2,
    maxWidth: 100,
    borderRadius: 2,
    background: 'linear-gradient(90deg, rgba(160,139,255,0.55) 0%, rgba(160,139,255,0.08) 100%)',
  },
  h1: {
    margin: 0,
    marginBottom: 22,
    maxWidth: '100%',
  },
  h1Line1: {
    display: 'block',
    fontFamily: "'Fraunces', serif",
    fontWeight: 700,
    lineHeight: 1.05,
    color: '#FFFFFF',
    textShadow:
      '0 1px 0 rgba(255,255,255,0.06), 0 20px 48px rgba(0,0,0,0.45), 0 0 60px rgba(96,62,249,0.12)',
  },
  h1Line2: {
    display: 'block',
    marginTop: 12,
    fontFamily: "'Fraunces', serif",
    fontWeight: 700,
    fontStyle: 'italic',
    lineHeight: 1.12,
    color: 'transparent',
    backgroundImage: 'linear-gradient(105deg, #FFFFFF 0%, #D4C8FF 38%, #A08BFF 72%, #8870F0 100%)',
    WebkitBackgroundClip: 'text',
    backgroundClip: 'text',
    textShadow: 'none',
    filter: 'drop-shadow(0 14px 28px rgba(0,0,0,0.35))',
  },
  bodyRule: {
    width: 56,
    height: 4,
    borderRadius: 4,
    marginBottom: 22,
    background: 'linear-gradient(90deg, var(--purple) 0%, rgba(160,139,255,0.35) 100%)',
    boxShadow: '0 0 24px rgba(96,62,249,0.35)',
  },
  body: {
    color: 'rgba(255,255,255,0.74)',
    lineHeight: 1.78,
    maxWidth: '48ch',
    marginBottom: 30,
    fontWeight: 400,
    textShadow: '0 1px 18px rgba(0,0,0,0.25)',
  },
  btns: { display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginBottom: 0, width: '100%' },
  btnPrimary: {
    padding: '14px 28px', borderRadius: 100, fontSize: 14, fontWeight: 700,
    fontFamily: "'Instrument Sans', sans-serif", cursor: 'pointer',
    background: 'white', color: 'var(--ink)', border: 'none', transition: 'all .25s',
    textAlign: 'center',
    boxShadow: '0 4px 20px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.12) inset, 0 12px 36px rgba(96,62,249,0.22)',
  },
  btnGhost: {
    padding: '13px 24px', borderRadius: 100, fontSize: 14, fontWeight: 600,
    fontFamily: "'Instrument Sans', sans-serif", cursor: 'pointer',
    background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.78)',
    border: '1.5px solid rgba(255,255,255,0.22)', transition: 'all .22s',
    textAlign: 'center',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
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
