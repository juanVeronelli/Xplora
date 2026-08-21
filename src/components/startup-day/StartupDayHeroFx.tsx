import { useEffect, useRef } from 'react';

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
};

/**
 * Fondo hero: campo de flujo + red de nodos que reacciona al cursor.
 * Evita el look genérico de “orbs + grid”.
 */
export function StartupDayHeroFx({
  band = 'STARTUP DAY · PRIMERA EDICIÓN · XPLORA · 11.09.26 · UCEMA · ',
}: {
  band?: string;
} = {}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let w = 0;
    let h = 0;
    let raf = 0;
    let t = 0;
    const mouse = { x: -9999, y: -9999, live: false };
    let particles: Particle[] = [];

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = parent.clientWidth;
      h = parent.clientHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const count = Math.min(150, Math.floor((w * h) / 8500));
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        r: 1 + Math.random() * 1.8,
      }));
    };

    const onMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
      mouse.live = true;
    };
    const onLeave = () => {
      mouse.live = false;
    };

    const field = (x: number, y: number, time: number) => {
      const a =
        Math.sin((x * 0.004) + time * 0.35) +
        Math.cos((y * 0.0035) - time * 0.28) +
        Math.sin(((x + y) * 0.0022) + time * 0.2);
      return a * 0.55;
    };

    const draw = () => {
      t += 0.008;
      ctx.clearRect(0, 0, w, h);

      // soft vignette wash
      const g = ctx.createRadialGradient(w * 0.7, h * 0.2, 0, w * 0.55, h * 0.45, w * 0.85);
      g.addColorStop(0, 'rgba(96,62,249,0.16)');
      g.addColorStop(0.55, 'rgba(96,62,249,0.04)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);

      for (const p of particles) {
        const ang = field(p.x, p.y, t);
        p.vx += Math.cos(ang) * 0.04;
        p.vy += Math.sin(ang) * 0.04;

        if (mouse.live) {
          const dx = p.x - mouse.x;
          const dy = p.y - mouse.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < 16000) {
            const f = (1 - d2 / 16000) * 0.55;
            p.vx += (dx / Math.sqrt(d2 + 0.01)) * f;
            p.vy += (dy / Math.sqrt(d2 + 0.01)) * f;
          }
        }

        p.vx *= 0.96;
        p.vy *= 0.96;
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < -20) p.x = w + 20;
        if (p.x > w + 20) p.x = -20;
        if (p.y < -20) p.y = h + 20;
        if (p.y > h + 20) p.y = -20;
      }

      // links
      for (let i = 0; i < particles.length; i++) {
        const a = particles[i]!;
        for (let j = i + 1; j < particles.length; j++) {
          const b = particles[j]!;
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const d2 = dx * dx + dy * dy;
          if (d2 > 16000) continue;
          const alpha = (1 - d2 / 16000) * 0.32;
          ctx.strokeStyle = `rgba(180,165,255,${alpha})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }

      for (const p of particles) {
        ctx.beginPath();
        ctx.fillStyle = 'rgba(220,210,255,0.82)';
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }

      if (mouse.live) {
        const mg = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 120);
        mg.addColorStop(0, 'rgba(96,62,249,0.18)');
        mg.addColorStop(1, 'rgba(96,62,249,0)');
        ctx.fillStyle = mg;
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, 120, 0, Math.PI * 2);
        ctx.fill();
      }

      raf = requestAnimationFrame(draw);
    };

    resize();
    draw();
    window.addEventListener('resize', resize);
    canvas.addEventListener('pointermove', onMove, { passive: true });
    canvas.addEventListener('pointerleave', onLeave);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerleave', onLeave);
    };
  }, []);

  return (
    <div className="sd-hero-fx" aria-hidden>
      <canvas ref={canvasRef} className="sd-hero-fx__canvas" />
      <div className="sd-hero-fx__bands">
        <div className="sd-hero-fx__band sd-hero-fx__band--a">
          <div className="sd-hero-fx__band-track">
            <span>{band.repeat(8)}</span>
            <span>{band.repeat(8)}</span>
          </div>
        </div>
        <div className="sd-hero-fx__band sd-hero-fx__band--b">
          <div className="sd-hero-fx__band-track">
            <span>{band.repeat(8)}</span>
            <span>{band.repeat(8)}</span>
          </div>
        </div>
      </div>
      <div className="sd-hero-fx__grain" />
    </div>
  );
}
