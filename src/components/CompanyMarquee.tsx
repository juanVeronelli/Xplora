import { useMemo } from 'react';
import { useSiteMedia } from '../context/SiteMediaContext';

export default function CompanyMarquee() {
  const { companies } = useSiteMedia();

  /**
   * Loop infinito sin “cortes” a mitad de card:
   * - Armamos 2 grupos idénticos.
   * - El gap vive dentro del grupo (no entre grupos), así el -50% cae exacto en el inicio del 2º grupo.
   */
  const group = useMemo(() => (companies.length ? [...companies] : []), [companies]);

  return (
    <section style={s.section}>
      <div style={s.head}>
        <p style={s.kicker}>Comunidad</p>
        <h2 style={s.title}>Empresas que participaron</h2>
      </div>

      <div style={s.trackOuter}>
        <div style={{ ...s.fade, left: 0, background: 'linear-gradient(to right, var(--cream) 0%, transparent 100%)' }} />
        <div style={{ ...s.fade, right: 0, background: 'linear-gradient(to left, var(--cream) 0%, transparent 100%)' }} />

        <div style={s.track}>
          <div style={s.group} aria-hidden={group.length === 0}>
            {group.map((co) => (
              <div key={co.id} style={s.logoCard}>
                <img src={co.logoUrl} alt={co.name} style={s.logoImg} loading="lazy" />
              </div>
            ))}
          </div>
          <div style={s.group} aria-hidden={group.length === 0}>
            {group.map((co) => (
              <div key={`${co.id}-dup`} style={s.logoCard}>
                <img src={co.logoUrl} alt="" style={s.logoImg} loading="lazy" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

const s: Record<string, React.CSSProperties> = {
  section: {
    width: '100%',
    padding: '48px 0 56px',
    background: 'var(--cream)',
    borderTop: '1px solid var(--border-warm)',
    borderBottom: '1px solid var(--border-warm)',
    overflow: 'hidden',
  },
  head: {
    maxWidth: 1120,
    margin: '0 auto 36px',
    padding: '0 24px',
    textAlign: 'center',
  },
  kicker: {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '2.5px',
    textTransform: 'uppercase',
    color: 'var(--purple)',
    marginBottom: 10,
  },
  title: {
    fontFamily: "'Fraunces', serif",
    fontSize: 'clamp(26px, 4vw, 40px)',
    fontWeight: 700,
    letterSpacing: '-1px',
    lineHeight: 1.15,
    color: 'var(--ink)',
    margin: 0,
  },
  trackOuter: {
    position: 'relative',
    width: '100%',
    overflow: 'hidden',
  },
  fade: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 72,
    zIndex: 2,
    pointerEvents: 'none',
  },
  track: {
    display: 'flex',
    width: 'max-content',
    alignItems: 'center',
    animation: 'scrollL 45s linear infinite',
    padding: '8px 0',
  },
  group: {
    display: 'flex',
    gap: 20,
    /**
     * Importante: el loop es 2 grupos pegados. Si no agregamos “aire” al final de cada grupo,
     * el borde entre grupo A y B queda sin gap y se ven cards “pegadas”.
     * Este padding pasa a formar parte del ancho de cada mitad, así que sigue alineando con -50%.
     */
    paddingRight: 20,
    alignItems: 'center',
  },
  logoCard: {
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: 72,
    minWidth: 140,
    padding: '12px 28px',
    borderRadius: 14,
    background: 'var(--white)',
    border: '1px solid var(--border-warm)',
    boxShadow: '0 4px 20px rgba(26,16,40,0.04)',
  },
  logoImg: {
    maxHeight: 44,
    maxWidth: 160,
    width: 'auto',
    height: 'auto',
    objectFit: 'contain',
  },
};
