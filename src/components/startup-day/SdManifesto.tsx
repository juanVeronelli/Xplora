/**
 * "Para quién es" — poster editorial.
 *
 * Cuarta dirección de arte para esta sección (1: tipografía cinética con ScrollTrigger; 2:
 * sistema modular de bit-patterns; 3: mapa de coordenadas de 7 nodos con label + coordenada por
 * identidad — descartada por sobrecargada: demasiados elementos chicos, ninguno con protagonismo,
 * se leía como dashboard técnico en vez de pieza editorial). El titular es el protagonista
 * absoluto — tiene que leerse en menos de dos segundos — y el sistema de coordenadas queda
 * reducido a 3 nodos, 3 rutas, 1 destino, sin labels ni coordenadas de texto.
 *
 * El fondo (ver `.sd-manifesto__bg` en `startupDay.css`) tuvo su propia vuelta: una grilla
 * `--sd-cross-light` cubriendo toda la pantalla se sentía dashboard/HUD y competía con la
 * tipografía y las rutas. Se reemplazó por atmósfera — negro casi total + un degradado radial
 * violeta muy sutil, sin patrón repetido. Mapeo conceptual del sistema visual:
 * fondo = atmósfera · tipografía = mensaje · rutas = concepto · puntos = personas · destino = futuro.
 *
 * Un solo árbol JSX en reposo: el motion sólo anima opacity/transform/stroke-dashoffset sobre
 * elementos que ya están en su posición final, así que sin JS — mobile, `prefers-reduced-motion`,
 * o el primer frame antes de que dispare el timeline — la composición ya está completa. Nada de
 * ScrollTrigger/pin/scrub: dispara una única vez con IntersectionObserver (mismo patrón que
 * `SdReveal`).
 *
 * Sin variante mobile aparte: al ser un titular + una atmósfera de fondo (no una grilla de datos
 * por rol), el mismo árbol escala con `clamp()` y el SVG de fondo cubre vía
 * `preserveAspectRatio="xMidYMid slice"` en cualquier aspect ratio, incluida una pantalla angosta.
 */
import { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';

const VB_W = 1600;
const VB_H = 900;
const DEST = { x: 1180, y: 460 };
const NODES: { x: number; y: number }[] = [
  { x: 160, y: 190 },
  { x: 110, y: 470 },
  { x: 230, y: 720 },
];

/** Curva "abanico": sale horizontal desde el nodo, entra casi horizontal al destino. */
function fanPath(x0: number, y0: number, x1: number, y1: number) {
  const c1x = x0 + (x1 - x0) * 0.55;
  const c1y = y0;
  const c2x = x1 - (x1 - x0) * 0.15;
  const c2y = y1;
  return `M${x0},${y0} C${c1x},${c1y} ${c2x},${c2y} ${x1},${y1}`;
}

const ROUTES = NODES.map((n) => fanPath(n.x, n.y, DEST.x, DEST.y));

function buildTimeline(els: {
  bg: Element;
  topbar: Element;
  lineA: Element;
  lineB: Element;
  punct: Element;
  nodes: Element[];
  paths: Element[];
  destRing: Element;
  destDot: Element;
  teaser: Element;
}) {
  const tl = gsap.timeline({ paused: true });

  tl.fromTo(els.bg, { opacity: 0 }, { opacity: 1, duration: 0.6, ease: 'power1.out' }, 0)
    .fromTo(els.topbar, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.4 }, 0.05)
    .fromTo(els.lineA, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6 }, 0.15)
    .fromTo(els.lineB, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6 }, 0.3)
    .fromTo(
      els.punct,
      { opacity: 0, scale: 0 },
      { opacity: 1, scale: 1, duration: 0.35, ease: 'back.out(2)' },
      0.75,
    )
    .fromTo(
      els.nodes,
      { opacity: 0, x: -18 },
      { opacity: 1, x: 0, duration: 0.5, stagger: 0.12, ease: 'power2.out' },
      0.5,
    )
    .fromTo(
      els.paths,
      { strokeDashoffset: 1 },
      { strokeDashoffset: 0, duration: 1, stagger: 0.15, ease: 'power2.inOut' },
      0.9,
    )
    .fromTo(els.destRing, { opacity: 0, scale: 0.4 }, { opacity: 1, scale: 1, duration: 0.4 }, 1.9)
    .to(els.destRing, { scale: 1.8, opacity: 0, duration: 0.8, ease: 'power1.out' }, 2.15)
    .fromTo(
      els.destDot,
      { opacity: 0, scale: 0.3 },
      { opacity: 1, scale: 1, duration: 0.35, ease: 'back.out(2)' },
      1.95,
    )
    .fromTo(els.teaser, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.4 }, 2.4);

  return tl;
}

export function SdManifesto() {
  const rootRef = useRef<HTMLElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const topbarRef = useRef<HTMLDivElement>(null);
  const lineARef = useRef<HTMLSpanElement>(null);
  const lineBRef = useRef<HTMLSpanElement>(null);
  const punctRef = useRef<HTMLSpanElement>(null);
  const teaserRef = useRef<HTMLDivElement>(null);
  const firedRef = useRef(false);

  /* `useLayoutEffect`: el timeline se crea pausado y GSAP aplica su estado "from" apenas se
     construye (immediateRender) — tiene que pasar antes del primer paint o se ve la composición
     completa seguida de un salto a oculto. En mobile / `prefers-reduced-motion` esto ni se
     ejecuta: el JSX ya es la composición completa tal cual está escrita. */
  useLayoutEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const wide = window.matchMedia('(min-width: 900px)').matches;
    if (!wide || reduce) return;

    const root = rootRef.current;
    const bg = bgRef.current;
    const topbar = topbarRef.current;
    const lineA = lineARef.current;
    const lineB = lineBRef.current;
    const punct = punctRef.current;
    const teaser = teaserRef.current;
    if (!root || !bg || !topbar || !lineA || !lineB || !punct || !teaser) return;

    const nodes = Array.from(root.querySelectorAll<SVGRectElement>('.sd-manifesto__node'));
    const paths = Array.from(root.querySelectorAll<SVGPathElement>('.sd-manifesto__route'));
    const destRing = root.querySelector<SVGCircleElement>('.sd-manifesto__dest-ring');
    const destDot = root.querySelector<SVGRectElement>('.sd-manifesto__dest-dot');

    if (!destRing || !destDot) return;
    if (!nodes.length || !paths.length) return;

    let tl: gsap.core.Timeline | undefined;
    const ctx = gsap.context(() => {
      tl = buildTimeline({ bg, topbar, lineA, lineB, punct, nodes, paths, destRing, destDot, teaser });
    }, root);

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !firedRef.current) {
          firedRef.current = true;
          tl?.play();
          obs.disconnect();
        }
      },
      { threshold: 0.2, rootMargin: '0px 0px -10% 0px' },
    );
    obs.observe(root);

    return () => {
      obs.disconnect();
      ctx.revert();
    };
  }, []);

  return (
    <section id="para-quien" className="sd-manifesto" ref={rootRef}>
      <div className="sd-manifesto__bg" ref={bgRef} aria-hidden />

      <svg
        className="sd-manifesto__system"
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        {ROUTES.map((d, i) => (
          <path key={i} className="sd-manifesto__route" d={d} pathLength={1} />
        ))}
        {NODES.map((n, i) => (
          <rect key={i} className="sd-manifesto__node" x={n.x - 9} y={n.y - 9} width={18} height={18} />
        ))}
        <circle className="sd-manifesto__dest-ring" cx={DEST.x} cy={DEST.y} r={26} />
        <rect
          className="sd-manifesto__dest-dot"
          x={DEST.x - 11}
          y={DEST.y - 11}
          width={22}
          height={22}
        />
      </svg>

      <div className="sd-manifesto__inner">
        <div className="sd-manifesto__topbar" ref={topbarRef}>
          <p className="sd-kicker">Para quién es</p>
          <span className="sd-manifesto__index">07 identidades</span>
        </div>

        <div className="sd-manifesto__stage">
          <h2 className="sd-manifesto__headline">
            <span className="sd-manifesto__line sd-manifesto__line--soft" ref={lineARef}>
              No importa quién sos.
            </span>
            <span className="sd-manifesto__line sd-manifesto__line--bold" ref={lineBRef}>
              Importa quién <span className="sd-manifesto__accent-word">querés ser</span>.
              <span className="sd-manifesto__module-punct" ref={punctRef} aria-hidden />
            </span>
          </h2>
        </div>

        <div className="sd-manifesto__teaser" ref={teaserRef}>
          <a className="sd-manifesto__teaser-link" href="#confirmadas">
            Startups confirmadas
            <span aria-hidden>→</span>
          </a>
        </div>
      </div>
    </section>
  );
}
