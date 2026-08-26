import { useEffect, useRef, useState } from 'react';

/**
 * Cursor tech: anillo que sigue el pointer + punto central.
 * Solo en pointer fino (desktop); se desactiva en touch / reduced-motion.
 */
export function StartupDayCursor() {
  const ringRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const fine = window.matchMedia('(pointer: fine)').matches;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!fine || reduce) return;

    setEnabled(true);
    document.documentElement.classList.add('sd-cursor-on');

    let x = 0;
    let y = 0;
    let rx = 0;
    let ry = 0;
    let raf = 0;

    const tick = () => {
      rx += (x - rx) * 0.2;
      ry += (y - ry) * 0.2;
      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${rx}px, ${ry}px, 0)`;
      }
      // Solo animar mientras el anillo no alcanzó el pointer
      if (Math.abs(x - rx) > 0.4 || Math.abs(y - ry) > 0.4) {
        raf = requestAnimationFrame(tick);
      } else {
        raf = 0;
      }
    };

    const onMove = (e: MouseEvent) => {
      x = e.clientX;
      y = e.clientY;
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      }
      if (!raf) raf = requestAnimationFrame(tick);
    };

    const onOver = (e: MouseEvent) => {
      const t = e.target as HTMLElement | null;
      const hovering = Boolean(
        t?.closest('a, button, input, textarea'),
      );
      ringRef.current?.classList.toggle('is-hot', hovering);
    };

    window.addEventListener('mousemove', onMove, { passive: true });
    window.addEventListener('mouseover', onOver, { passive: true });

    return () => {
      document.documentElement.classList.remove('sd-cursor-on');
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseover', onOver);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  if (!enabled) return null;

  return (
    <>
      <div ref={ringRef} className="sd-cursor sd-cursor--ring" aria-hidden />
      <div ref={dotRef} className="sd-cursor sd-cursor--dot" aria-hidden />
    </>
  );
}
