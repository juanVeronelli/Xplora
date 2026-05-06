import { useEffect, useRef } from 'react';
import type { Page } from '../types';
import { useSiteMedia } from '../context/SiteMediaContext';
import { useInView } from '../hooks/useInView';
import { useIsMobile } from '../hooks/useIsMobile';

function isYoutubeEmbedUrl(url: string): boolean {
  return /youtube\.com\/embed|youtu\.be/.test(url);
}

function isDirectVideoUrl(url: string): boolean {
  if (!url.trim()) return false;
  return (
    /\.(mp4|webm|ogg)(\?|$)/i.test(url) ||
    (url.includes('cloudinary.com') && url.includes('/video/'))
  );
}

function youtubeSrcWithAutoplay(url: string): string {
  const u = new URL(url, 'https://www.youtube.com');
  u.searchParams.set('autoplay', '1');
  u.searchParams.set('mute', '1');
  return u.toString();
}

interface Props {
  goTo: (p: Page) => void;
}

export default function VideoSection({ goTo }: Props) {
  const { highlightVideoUrl } = useSiteMedia();
  const { ref, inView } = useInView();
  const videoRef = useRef<HTMLVideoElement>(null);
  const isMobile = useIsMobile();

  const hasVideo = Boolean(highlightVideoUrl.trim());
  const isYoutube = isYoutubeEmbedUrl(highlightVideoUrl);
  const isDirect = isDirectVideoUrl(highlightVideoUrl);

  /** YouTube 16:9; MP4 vertical = marco 9:16. */
  const wideFrame = isYoutube || (!isDirect && hasVideo);

  useEffect(() => {
    const el = videoRef.current;
    if (!el || !isDirect || !hasVideo) return;
    const kick = () => {
      void el.play().catch(() => {});
    };
    kick();
    el.addEventListener('loadeddata', kick);
    return () => el.removeEventListener('loadeddata', kick);
  }, [highlightVideoUrl, isDirect, hasVideo]);

  const renderFrame = () => (
    <div
      style={{
        ...s.frameShell,
        ...(wideFrame ? s.frameWide : s.frameVertical),
      }}
    >
      {!hasVideo ? (
        <div style={s.placeholder}>
          <span style={s.frameLabel}>
            Próximamente: video de la comunidad. Mientras tanto, entrá al archivo de charlas.
          </span>
        </div>
      ) : isDirect ? (
        <video
          ref={videoRef}
          src={highlightVideoUrl}
          autoPlay
          muted
          loop
          playsInline
          controls
          preload="auto"
          style={s.videoFill}
          title="Xplora UCEMA — video destacado"
        />
      ) : isYoutube ? (
        <iframe
          style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
          src={youtubeSrcWithAutoplay(highlightVideoUrl)}
          allow="autoplay; fullscreen"
          title="Xplora — video destacado"
        />
      ) : (
        <div style={s.placeholder}>
          <span style={s.frameLabel}>URL de video no reconocida. Usá un .mp4 o un embed de YouTube.</span>
        </div>
      )}
    </div>
  );

  return (
    <section
      ref={ref as React.Ref<HTMLElement>}
      style={{
        padding: isMobile ? '48px 20px 64px' : '80px 40px 100px',
        background:
          'linear-gradient(180deg, rgba(250,248,245,0.98) 0%, rgba(243,238,230,0.65) 45%, rgba(250,248,245,0.98) 100%)',
        opacity: inView ? 1 : 0,
        transform: inView ? 'none' : 'translateY(24px)',
        transition: 'opacity 0.75s ease, transform 0.75s ease',
      }}
    >
      <div
        style={{
          maxWidth: 1180,
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'minmax(280px, 1fr) minmax(300px, 400px)',
          gap: isMobile ? 28 : 56,
          alignItems: 'center',
          justifyItems: isMobile ? 'stretch' : undefined,
        }}
      >
        <header
          style={{
            textAlign: isMobile ? 'left' : 'left',
            display: 'flex',
            flexDirection: 'column',
            alignItems: isMobile ? 'stretch' : 'flex-start',
            padding: isMobile ? '0 4px' : '0 8px 0 0',
          }}
        >
          <div style={{ ...s.chip, marginBottom: 14 }}>Archivo</div>
          <h2 style={s.h2}>Charlas y momentos que quedan</h2>
          <p style={{ ...s.p, marginBottom: isMobile ? 20 : 22 }}>
            En el archivo hay conversaciones con fundadores, inversores y equipos del ecosistema: material
            para preparar una ronda, un pitch o una decisión con más contexto y criterio.
          </p>
          <button
            type="button"
            style={{ ...s.btn, width: isMobile ? '100%' : 'auto' }}
            onClick={() => goTo('charlas')}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'var(--purple)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'var(--ink)';
            }}
          >
            Ver archivo →
          </button>
        </header>

        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            width: '100%',
            padding: isMobile ? '4px 0 0' : 0,
          }}
        >
          {renderFrame()}
        </div>
      </div>
    </section>
  );
}

const s: Record<string, React.CSSProperties> = {
  chip: {
    display: 'inline-block',
    padding: '5px 14px',
    borderRadius: 100,
    background: 'var(--purple-soft)',
    color: 'var(--purple)',
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '1.5px',
    textTransform: 'uppercase',
  },
  h2: {
    fontFamily: "'Fraunces', serif",
    fontSize: 'clamp(26px, 3.2vw, 40px)',
    fontWeight: 700,
    letterSpacing: '-1.2px',
    marginBottom: 12,
    lineHeight: 1.15,
    color: 'var(--ink)',
  },
  p: {
    color: 'var(--ink-muted)',
    lineHeight: 1.75,
    fontSize: 15,
    maxWidth: 440,
  },
  btn: {
    padding: '13px 28px',
    borderRadius: 100,
    fontSize: 14,
    fontWeight: 700,
    fontFamily: "'Instrument Sans', sans-serif",
    cursor: 'pointer',
    background: 'var(--ink)',
    color: 'white',
    border: 'none',
    transition: 'all .25s',
    textAlign: 'center',
  },
  frameShell: {
    position: 'relative' as const,
    overflow: 'hidden',
    borderRadius: 28,
    background:
      'linear-gradient(165deg, rgba(26,16,40,0.06) 0%, rgba(96,62,249,0.08) 50%, rgba(26,16,40,0.05) 100%)',
    boxShadow: '0 24px 48px rgba(26,16,40,0.09), 0 8px 20px rgba(96,62,249,0.07)',
  },
  frameVertical: {
    width: 'min(100%, 360px)',
    aspectRatio: '9 / 16',
    maxHeight: 'min(78vh, 720px)',
  },
  frameWide: {
    width: '100%',
    aspectRatio: '16 / 9',
    maxWidth: 520,
  },
  videoFill: {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    objectPosition: 'center center',
    display: 'block',
  },
  placeholder: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: 24,
    textAlign: 'center',
    background: 'linear-gradient(145deg, #1a1028 0%, #2d2048 100%)',
  },
  frameLabel: { color: 'rgba(255,255,255,0.55)', fontSize: 13, lineHeight: 1.5 },
};
