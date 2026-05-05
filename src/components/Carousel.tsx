import type { CSSProperties } from 'react';
import { useIsMobile } from '../hooks/useIsMobile';
import { useSiteMedia } from '../context/SiteMediaContext';
import { splitCarouselIntoTracks, type CarouselPhoto } from '../lib/carouselLayout';

function PhotoCard({ photo }: { photo: CarouselPhoto }) {
  return (
    <div style={s.card}>
      <img src={photo.src} alt="" style={s.img} loading="eager" decoding="async" draggable={false} />
    </div>
  );
}

function Track({
  photos,
  direction,
  speed,
}: {
  photos: CarouselPhoto[];
  direction: 'r' | 'l';
  speed: number;
}) {
  if (photos.length === 0) return null;
  /** Debemos repetir el bloque exactamente 2 veces: scrollL/scrollR en index.css mueven -50% del ancho total. */
  const items = [...photos, ...photos];
  return (
    <div style={{ overflow: 'hidden', marginBottom: 12 }}>
      <div
        style={{
          display: 'flex',
          gap: 12,
          width: 'max-content',
          willChange: 'transform',
          backfaceVisibility: 'hidden',
          animation:
            direction === 'r'
              ? `scrollR ${speed}s linear infinite`
              : `scrollL ${speed}s linear infinite`,
        }}
      >
        {items.map((p, i) => (
          <PhotoCard key={`${p.src}-${i}`} photo={p} />
        ))}
      </div>
    </div>
  );
}

export default function Carousel() {
  const isMobile = useIsMobile();
  const { carousel } = useSiteMedia();
  const [row1, row2, row3] = splitCarouselIntoTracks(carousel);

  return (
    <div style={{ ...s.section, padding: isMobile ? '56px 0 48px' : '88px 0 80px' }}>
      <div style={{ ...s.header, padding: isMobile ? '0 24px' : '0 80px' }}>
        <div style={s.secLabel}>Comunidad</div>
        <div style={s.secTitle}>Momentos que nos definen</div>
      </div>
      <Track photos={row1} direction="r" speed={58} />
      <Track photos={row2} direction="l" speed={68} />
      <Track photos={row3} direction="r" speed={50} />
    </div>
  );
}

const s: Record<string, CSSProperties> = {
  section: {
    padding: '88px 0 80px',
    background: 'var(--ink)',
    overflow: 'hidden',
  },
  header: {
    padding: '0 80px',
    marginBottom: 48,
  },
  secLabel: {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '2.5px',
    textTransform: 'uppercase',
    color: 'rgba(200,184,255,0.7)',
    marginBottom: 8,
  },
  secTitle: {
    fontFamily: "'Fraunces', serif",
    fontSize: 'clamp(28px, 3.5vw, 46px)',
    fontWeight: 700,
    letterSpacing: '-1.5px',
    lineHeight: 1.1,
    color: 'white',
  },
  card: {
    flexShrink: 0,
    width: 300,
    height: 200,
    borderRadius: 14,
    overflow: 'hidden',
    border: '1px solid rgba(255,255,255,0.08)',
  },
  img: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
  },
};
