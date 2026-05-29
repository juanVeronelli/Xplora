import { useState } from 'react';
import type { Page } from '../types';
import { useSiteMedia } from '../context/SiteMediaContext';
import { useIsMobile } from '../hooks/useIsMobile';

interface Props { current: Page; goTo: (p: Page) => void; }

const allLinks: { id: Page; label: string }[] = [
  { id: 'home', label: 'Inicio' },
  { id: 'somos', label: 'Somos Xplora' },
  { id: 'eventos', label: 'Eventos' },
  { id: 'sponsors', label: 'Sponsors' },
];

const links = allLinks;

export default function Nav({ current, goTo }: Props) {
  const { logoUrl } = useSiteMedia();
  const isMobile = useIsMobile();
  const [menuOpen, setMenuOpen] = useState(false);

  const navigate = (p: Page) => { goTo(p); setMenuOpen(false); };
  const goToJoinForm = () => {
    navigate('somos');
    // Espera un tick para que la vista renderice antes de scrollear.
    setTimeout(() => {
      const el = document.getElementById('sumate');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        // Actualiza hash sin romper el routing por pathname.
        try {
          const next = `${window.location.pathname}#sumate`;
          window.history.replaceState({}, '', next);
        } catch {
          /* ignore */
        }
      }
    }, 50);
  };

  return (
    <>
      <nav style={s.nav}>
        <button type="button" style={s.logo} onClick={() => navigate('home')}>
          <img
            src={logoUrl}
            alt="Xplora"
            style={s.logoImg}
            onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
          />
          <span style={s.logoText}>Xplora</span>
        </button>

        {!isMobile && (
          <div style={s.links}>
            {links.map(({ id, label }) => (
              <button
                type="button"
                key={id}
                onClick={() => navigate(id)}
                style={{
                  ...s.link,
                  color: current === id ? 'var(--ink)' : 'var(--ink-muted)',
                  background: current === id ? 'var(--warm)' : 'transparent',
                  fontWeight: current === id ? 600 : 500,
                }}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {isMobile ? (
          <button type="button" style={s.hamburger} onClick={() => setMenuOpen(o => !o)} aria-label="Menú">
            <div style={s.barWrapper}>
              <span style={{ ...s.bar, top: 0, transform: menuOpen ? 'translateY(7px) rotate(45deg)' : 'none' }} />
              <span style={{ ...s.bar, top: 7, opacity: menuOpen ? 0 : 1, transform: menuOpen ? 'scaleX(0)' : 'none' }} />
              <span style={{ ...s.bar, top: 14, transform: menuOpen ? 'translateY(-7px) rotate(-45deg)' : 'none' }} />
            </div>
          </button>
        ) : (
          <div style={s.right}>
            <button
              type="button"
              style={s.btnFill}
              onClick={goToJoinForm}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--purple)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--ink)'; }}
            >
              Unirme →
            </button>
          </div>
        )}
      </nav>

      {isMobile && menuOpen && (
        <div style={s.mobileMenu}>
          {links.map(({ id, label }) => (
            <button
              type="button"
              key={id}
              onClick={() => navigate(id)}
              style={{
                ...s.mobileLink,
                color: current === id ? 'var(--purple)' : 'var(--ink)',
                background: current === id ? 'var(--purple-soft)' : 'transparent',
              }}
            >
              {label}
            </button>
          ))}
          <div style={s.mobileDivider} />
          <button
            type="button"
            style={s.mobileCta}
            onClick={goToJoinForm}
          >
            Unirme a Xplora →
          </button>
        </div>
      )}
    </>
  );
}

const s: Record<string, React.CSSProperties> = {
  nav: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 200,
    padding: '0 24px',
    height: 60,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    background: 'rgba(250,248,245,0.96)',
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
    borderBottom: '1px solid var(--border-warm)',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    cursor: 'pointer',
    background: 'none',
    border: 'none',
    padding: 0,
  },
  logoImg: { width: 28, height: 28, objectFit: 'contain' },
  logoText: {
    fontFamily: "'Fraunces', serif",
    fontSize: 18,
    fontWeight: 600,
    color: 'var(--ink)',
    letterSpacing: '-0.3px',
  },
  links: { display: 'flex', alignItems: 'center', gap: 2 },
  link: {
    padding: '7px 14px',
    borderRadius: 20,
    fontSize: 14,
    cursor: 'pointer',
    transition: 'all .18s',
    border: 'none',
    fontFamily: "'Instrument Sans', sans-serif",
  },
  right: { display: 'flex', gap: 8, alignItems: 'center' },
  btnOutline: {
    padding: '7px 18px',
    borderRadius: 20,
    color: 'var(--ink-soft)',
    background: 'transparent',
    border: '1.5px solid var(--border-warm)',
    cursor: 'pointer',
    fontFamily: "'Instrument Sans', sans-serif",
    fontSize: 13,
    fontWeight: 600,
    transition: 'all .18s',
  },
  btnFill: {
    padding: '8px 20px',
    borderRadius: 20,
    background: 'var(--ink)',
    color: 'white',
    border: 'none',
    cursor: 'pointer',
    fontFamily: "'Instrument Sans', sans-serif",
    fontSize: 13,
    fontWeight: 700,
    transition: 'all .2s',
  },
  hamburger: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 44,
    minHeight: 44,
    padding: 0,
    touchAction: 'manipulation',
  },
  barWrapper: {
    position: 'relative',
    width: 22,
    height: 16,
  },
  bar: {
    position: 'absolute',
    left: 0,
    width: 22,
    height: 2,
    background: 'var(--ink)',
    borderRadius: 2,
    transition: 'all .25s cubic-bezier(0.4, 0, 0.2, 1)',
    transformOrigin: 'center',
    willChange: 'transform, opacity',
  },
  mobileMenu: {
    position: 'fixed',
    top: 60,
    left: 0,
    right: 0,
    zIndex: 199,
    background: 'rgba(250,248,245,0.98)',
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
    borderBottom: '1px solid var(--border-warm)',
    padding: '12px 16px 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    boxShadow: '0 12px 40px rgba(26,16,40,0.1)',
  },
  mobileLink: {
    padding: '12px 16px',
    borderRadius: 12,
    fontSize: 16,
    fontWeight: 500,
    cursor: 'pointer',
    border: 'none',
    textAlign: 'left',
    fontFamily: "'Instrument Sans', sans-serif",
    transition: 'all .15s',
  },
  mobileDivider: {
    height: 1,
    background: 'var(--border-warm)',
    margin: '8px 0',
  },
  mobileCta: {
    padding: '14px 16px',
    borderRadius: 14,
    fontSize: 15,
    fontWeight: 700,
    cursor: 'pointer',
    border: 'none',
    background: 'var(--ink)',
    color: 'white',
    fontFamily: "'Instrument Sans', sans-serif",
    textAlign: 'center',
  },
};
