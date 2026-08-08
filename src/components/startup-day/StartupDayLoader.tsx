import { useEffect, useRef } from 'react';
import { DEFAULT_LOGO_URL } from '../../lib/defaultsMedia';

function holeMask(radiusPx: number) {
  const r = Math.max(0, radiusPx);
  return `radial-gradient(circle at 50% 50%, transparent ${r}px, #000 ${r + 1}px)`;
}

export function StartupDayLoader({ done, logoUrl }: { done: boolean; logoUrl?: string }) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = rootRef.current;
    if (!el || !done) return;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const max = Math.hypot(window.innerWidth, window.innerHeight) * 1.1;

    const apply = (r: number) => {
      const mask = holeMask(r);
      el.style.setProperty('--sd-hole', `${r}px`);
      el.style.webkitMaskImage = mask;
      el.style.maskImage = mask;
    };

    if (reduce) {
      apply(max);
      return;
    }

    const start = performance.now();
    const dur = 3000;
    let raf = 0;

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / dur);
      const eased = 1 - (1 - t) ** 3;
      apply(eased * max);
      if (t < 1) raf = requestAnimationFrame(tick);
    };

    apply(0);
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [done]);

  return (
    <div
      ref={rootRef}
      className={`sd-loader${done ? ' is-done' : ''}`}
      aria-hidden={done}
      aria-busy={!done}
    >
      <div className="sd-loader__bg" aria-hidden>
        <span className="sd-loader__glow sd-loader__glow--a" />
        <span className="sd-loader__glow sd-loader__glow--b" />
        <span className="sd-loader__grain" />
      </div>
      <div className="sd-loader__inner">
        <div className="sd-loader__mark">
          <span className="sd-loader__orbit" aria-hidden />
          <img
            className="sd-loader__logo"
            src={logoUrl || DEFAULT_LOGO_URL}
            alt=""
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = DEFAULT_LOGO_URL;
            }}
          />
        </div>
        <p className="sd-loader__label">Cargando</p>
      </div>
    </div>
  );
}
