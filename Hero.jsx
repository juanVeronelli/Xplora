import { useEffect, useRef, useState } from 'react';

/* ── Keyframes injected once ── */
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,600;0,9..144,700;1,9..144,400;1,9..144,700&family=Instrument+Sans:wght@400;500;600;700&display=swap');

  :root {
    --ink:         #1A1028;
    --ink-soft:    #3D3060;
    --ink-muted:   #7A6E92;
    --ink-faint:   #B8B0CC;
    --purple:      #603EF9;
    --purple-soft: rgba(96,62,249,0.1);
    --border:      rgba(96,62,249,0.14);
    --border-warm: rgba(26,16,40,0.1);
    --cream:       #FAF8F5;
    --warm:        #EDE8E0;
    --white:       #FFFFFF;
  }

  @keyframes xp-blink {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0.35; }
  }

  @keyframes xp-float {
    0%, 100% { transform: translateY(0px); }
    50%       { transform: translateY(-10px); }
  }

  @keyframes xp-float-stat1 {
    0%, 100% { transform: translateY(0px) translateX(0px); }
    50%       { transform: translateY(-6px) translateX(3px); }
  }

  @keyframes xp-float-stat2 {
    0%, 100% { transform: translateY(0px); }
    50%       { transform: translateY(6px); }
  }

  @keyframes xp-glow-pulse {
    0%, 100% { opacity: 0.5; transform: scale(1); }
    50%       { opacity: 0.9; transform: scale(1.08); }
  }

  @keyframes xp-shimmer {
    0%   { background-position: -200% center; }
    100% { background-position: 200% center; }
  }

  /* Fade-in utilities */
  .xp-fade-up {
    opacity: 0;
    transform: translateY(28px);
    transition: opacity 0.7s cubic-bezier(.22,1,.36,1),
                transform 0.7s cubic-bezier(.22,1,.36,1);
  }
  .xp-fade-up.xp-visible {
    opacity: 1;
    transform: translateY(0);
  }
  .xp-fade-right {
    opacity: 0;
    transform: translateX(40px);
    transition: opacity 0.8s cubic-bezier(.22,1,.36,1),
                transform 0.8s cubic-bezier(.22,1,.36,1);
  }
  .xp-fade-right.xp-visible {
    opacity: 1;
    transform: translateX(0);
  }
`;

/* ── Animated counter ── */
function Counter({ target, duration = 1400 }) {
  const [value, setValue] = useState(0);
  const started = useRef(false);
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const start = performance.now();
          const tick = (now) => {
            const progress = Math.min((now - start) / duration, 1);
            const ease = 1 - Math.pow(1 - progress, 3);
            setValue(Math.round(ease * target));
            if (progress < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.5 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [target, duration]);

  return <span ref={ref}>{value.toLocaleString('es-AR')}</span>;
}

/* ── Main Hero component ── */
export default function Hero({ onGoToEventos, onGoToCharlas }) {
  const heroRef   = useRef(null);
  const leftRef   = useRef(null);
  const rightRef  = useRef(null);
  const scrollRef = useRef(null);

  /* Intersection observer triggers class-based CSS transitions */
  useEffect(() => {
    const targets = [
      { el: leftRef.current,   cls: 'xp-fade-up',    delay: 0 },
      { el: rightRef.current,  cls: 'xp-fade-right',  delay: 200 },
      { el: scrollRef.current, cls: 'xp-fade-up',     delay: 400 },
    ];

    const observers = targets.map(({ el, cls, delay }) => {
      if (!el) return null;
      el.classList.add(cls);
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setTimeout(() => el.classList.add('xp-visible'), delay);
            obs.disconnect();
          }
        },
        { threshold: 0.15 }
      );
      obs.observe(el);
      return obs;
    });

    /* Stagger children inside left column */
    if (leftRef.current) {
      const children = leftRef.current.children;
      Array.from(children).forEach((child, i) => {
        child.style.transitionDelay = `${i * 80}ms`;
      });
    }

    return () => observers.forEach((o) => o && o.disconnect());
  }, []);

  return (
    <>
      {/* Inject keyframes once */}
      <style>{STYLES}</style>

      <section ref={heroRef} style={s.hero}>

        {/* ── Inner grid ── */}
        <div style={s.inner}>

          {/* LEFT */}
          <div ref={leftRef} style={s.left}>

            {/* Eyebrow badge */}
            <div style={s.eyebrow}>
              <span style={s.dot} />
              Club activo · UCEMA 2025
            </div>

            {/* Headline */}
            <h1 style={s.h1}>
              El club donde las ideas<br />
              se vuelven{' '}
              <em style={s.hItalic}>reales</em>
            </h1>

            {/* Body */}
            <p style={s.body}>
              Xplora es la comunidad de emprendedores de UCEMA.
              Nos juntamos, aprendemos de quienes lo hicieron,
              y construimos juntos.
            </p>

            {/* CTA buttons */}
            <div style={s.btns}>
              <HoverButton
                style={s.btnDark}
                hoverStyle={s.btnDarkHover}
                onClick={onGoToEventos}
              >
                Próximos eventos
              </HoverButton>
              <HoverButton
                style={s.btnGhost}
                hoverStyle={s.btnGhostHover}
                onClick={onGoToCharlas}
              >
                Ver charlas →
              </HoverButton>
            </div>
          </div>

          {/* RIGHT — card stack */}
          <div ref={rightRef} style={s.right}>
            <div style={s.cardStack}>

              {/* Main dark card */}
              <div style={s.cardMain}>
                {/* Ambient glow */}
                <div style={s.cardGlow} />
                {/* Xplora wordmark */}
                <span style={s.wordmark}>Xplora</span>
              </div>

              {/* Stat card 1 — Miembros */}
              <div style={s.stat1}>
                <div style={{ ...s.num, color: 'var(--ink)' }}>
                  +<Counter target={2200} />
                </div>
                <div style={{ ...s.lbl, color: 'var(--ink-muted)' }}>
                  Miembros
                </div>
              </div>

              {/* Stat card 2 — Eventos */}
              <div style={s.stat2}>
                <div style={{ ...s.num, color: 'white' }}>
                  +<Counter target={40} />
                </div>
                <div style={{ ...s.lbl, color: 'rgba(255,255,255,0.7)' }}>
                  Eventos
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* ── Scroll strip ── */}
        <div ref={scrollRef} style={s.scrollStrip}>
          <p style={s.stripLabel}>Empresas que participaron</p>
          <div style={s.logos}>
            {['MercadoLibre', 'Ualá', 'YPF', 'Galicia', 'McKinsey'].map((name) => (
              <span key={name} style={s.logo}>{name}</span>
            ))}
          </div>
        </div>

      </section>
    </>
  );
}

/* ── Hover button with JS-driven hover state ── */
function HoverButton({ style, hoverStyle, children, onClick }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      style={{ ...style, ...(hovered ? hoverStyle : {}) }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

/* ── Styles ── */
const s = {
  hero: {
    padding: '80px 80px 64px',
    background: 'var(--cream)',
    position: 'relative',
    overflow: 'hidden',
    fontFamily: "'Instrument Sans', sans-serif",
  },
  inner: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '60px',
    alignItems: 'center',
    maxWidth: '1200px',
  },
  left: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
  },

  /* Eyebrow */
  eyebrow: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '5px 14px 5px 8px',
    borderRadius: '100px',
    background: 'var(--purple-soft)',
    border: '1.5px solid var(--border)',
    fontSize: '12px',
    color: 'var(--purple)',
    marginBottom: '24px',
    fontWeight: 600,
    letterSpacing: '.3px',
  },
  dot: {
    display: 'inline-block',
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    background: 'var(--purple)',
    animation: 'xp-blink 2s infinite',
  },

  /* Headline */
  h1: {
    fontFamily: "'Fraunces', serif",
    fontSize: 'clamp(44px, 5vw, 68px)',
    fontWeight: 700,
    lineHeight: 1.05,
    letterSpacing: '-2px',
    marginBottom: '20px',
    color: 'var(--ink)',
  },
  hItalic: {
    fontStyle: 'italic',
    color: 'var(--purple)',
  },

  /* Body */
  body: {
    fontSize: '16px',
    color: 'var(--ink-muted)',
    lineHeight: 1.8,
    maxWidth: '440px',
    marginBottom: '32px',
    fontWeight: 400,
  },

  /* Buttons */
  btns: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  btnDark: {
    padding: '12px 28px',
    borderRadius: '100px',
    fontSize: '14px',
    fontWeight: 700,
    fontFamily: "'Instrument Sans', sans-serif",
    cursor: 'pointer',
    border: 'none',
    letterSpacing: '-.1px',
    background: 'var(--ink)',
    color: 'white',
    transition: 'background .25s, transform .25s',
  },
  btnDarkHover: {
    background: 'var(--purple)',
    transform: 'translateY(-1px)',
  },
  btnGhost: {
    padding: '12px 28px',
    borderRadius: '100px',
    fontSize: '14px',
    fontWeight: 700,
    fontFamily: "'Instrument Sans', sans-serif",
    cursor: 'pointer',
    letterSpacing: '-.1px',
    background: 'transparent',
    color: 'var(--ink-soft)',
    border: '1.5px solid var(--border-warm)',
    transition: 'border-color .25s, color .25s',
  },
  btnGhostHover: {
    borderColor: 'var(--purple)',
    color: 'var(--purple)',
  },

  /* Right — card stack */
  right: {
    position: 'relative',
  },
  cardStack: {
    position: 'relative',
    height: '420px',
  },

  /* Main card */
  cardMain: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '280px',
    borderRadius: '20px',
    background: 'linear-gradient(135deg, #1A1028 0%, #2D1B50 100%)',
    boxShadow: '0 24px 60px rgba(96,62,249,.25)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    animation: 'xp-float 5s ease-in-out infinite',
  },
  cardGlow: {
    position: 'absolute',
    width: '180px',
    height: '180px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(96,62,249,0.5) 0%, transparent 70%)',
    animation: 'xp-glow-pulse 3.5s ease-in-out infinite',
  },
  wordmark: {
    position: 'relative',
    fontFamily: "'Fraunces', serif",
    fontSize: '56px',
    fontWeight: 700,
    letterSpacing: '-2px',
    background: 'linear-gradient(90deg, #ffffff 0%, #C8B8FF 50%, #ffffff 100%)',
    backgroundSize: '200% auto',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    animation: 'xp-shimmer 3s linear infinite',
  },

  /* Stat card 1 */
  stat1: {
    position: 'absolute',
    width: '160px',
    bottom: '50px',
    left: '-20px',
    background: 'white',
    padding: '16px 20px',
    borderRadius: '20px',
    boxShadow: '0 8px 24px rgba(26,16,40,.12)',
    animation: 'xp-float-stat1 6s ease-in-out infinite',
  },

  /* Stat card 2 */
  stat2: {
    position: 'absolute',
    width: '160px',
    bottom: 0,
    right: 0,
    background: 'var(--purple)',
    padding: '16px 20px',
    borderRadius: '20px',
    color: 'white',
    animation: 'xp-float-stat2 7s ease-in-out infinite',
  },

  num: {
    fontFamily: "'Fraunces', serif",
    fontSize: '28px',
    fontWeight: 700,
  },
  lbl: {
    fontSize: '11px',
    fontWeight: 600,
    letterSpacing: '.5px',
    textTransform: 'uppercase',
    marginTop: '2px',
  },

  /* Scroll strip */
  scrollStrip: {
    marginTop: '56px',
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    paddingTop: '32px',
    borderTop: '1px solid var(--border-warm)',
  },
  stripLabel: {
    fontSize: '12px',
    color: 'var(--ink-faint)',
    fontWeight: 500,
    letterSpacing: '1px',
    textTransform: 'uppercase',
    whiteSpace: 'nowrap',
  },
  logos: {
    display: 'flex',
    gap: '16px',
    alignItems: 'center',
  },
  logo: {
    fontSize: '13px',
    fontWeight: 600,
    color: 'var(--ink-muted)',
    opacity: 0.5,
  },
};
