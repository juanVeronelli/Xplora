import { useInView } from '../hooks/useInView';
import { useIsMobile } from '../hooks/useIsMobile';
import { useSiteMedia } from '../context/SiteMediaContext';

export default function SponsorsOfficial() {
  const { sponsors } = useSiteMedia();
  const { ref, inView } = useInView();
  const isMobile = useIsMobile();

  return (
    <section
      ref={ref as React.Ref<HTMLElement>}
      style={{
        padding: isMobile ? '56px 24px' : '88px 80px',
        background: 'var(--cream)',
        opacity: inView ? 1 : 0,
        transform: inView ? 'none' : 'translateY(28px)',
        transition: 'opacity 0.8s ease, transform 0.8s ease',
      }}
    >
      <div style={{ marginBottom: isMobile ? 28 : 36 }}>
        <div style={s.label}>Alianzas</div>
        <h2 style={s.title}>SPONSORS OFICIALES</h2>
        <p style={s.sub}>
          Empresas e instituciones que nos acompañan y hacen posible que Xplora siga creciendo.
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile
            ? 'repeat(2, 1fr)'
            : 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: isMobile ? 16 : 24,
          maxWidth: 960,
        }}
      >
        {sponsors.map((sp, i) => (
          <div
            key={sp.id}
            style={{
              ...s.tile,
              opacity: inView ? 1 : 0,
              transform: inView ? 'none' : 'translateY(12px)',
              transition: `opacity 0.5s ease ${120 + i * 60}ms, transform 0.5s ease ${120 + i * 60}ms`,
            }}
          >
            <img src={sp.logoUrl} alt={sp.name} style={s.logo} loading="lazy" />
          </div>
        ))}
      </div>
    </section>
  );
}

const s: Record<string, React.CSSProperties> = {
  label: {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '2.5px',
    textTransform: 'uppercase',
    color: 'var(--purple)',
    marginBottom: 12,
  },
  title: {
    fontFamily: "'Fraunces', serif",
    fontSize: 'clamp(26px, 3.2vw, 42px)',
    fontWeight: 700,
    letterSpacing: '0.06em',
    lineHeight: 1.1,
    color: 'var(--ink)',
    marginBottom: 12,
  },
  sub: {
    fontSize: 15,
    color: 'var(--ink-muted)',
    lineHeight: 1.8,
    maxWidth: 560,
  },
  tile: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 88,
    padding: '20px 24px',
    borderRadius: 14,
    background: 'var(--white)',
    border: '1.5px solid var(--border-warm)',
  },
  logo: {
    maxWidth: '100%',
    maxHeight: 44,
    width: 'auto',
    height: 'auto',
    objectFit: 'contain',
    filter: 'none',
  },
};
