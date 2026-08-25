/**
 * "Para quién es" — lámina técnica (Figma `Zettios` 368:83).
 *
 * Quinta dirección de arte para esta sección (1: tipografía cinética con ScrollTrigger; 2:
 * sistema modular de bit-patterns; 3: mapa de coordenadas de 7 nodos — descartada por
 * sobrecargada; 4: poster editorial con rutas/nodos hacia un destino). Ésta viene de un diseño
 * cerrado, así que la composición es la del Figma: titular a la izquierda, copy de apoyo + CTAs
 * a la derecha, y una banda de logos al pie, todo dentro de un marco de hairlines con marcas de
 * esquina sobre negro casi total.
 *
 * Lo que cambia respecto de la 4ª: se van las rutas/nodos SVG y el par titular soft/bold con
 * palabra en violeta. El titular ahora es un solo bloque en una sola caja tipográfica, como está
 * diseñado.
 *
 * El "papel" de fondo es el compás de Xplora tramado en ASCII (`bg-ascii.webp`, el mismo asset
 * del Figma reescalado de 2508px/8,2 MB a 1100px/59 KB — va al 20% de opacidad sobre negro, así
 * que la diferencia no se ve). Es imagen y no un canvas como `SdAsciiDisc` a propósito: acá es
 * textura quieta, no un elemento vivo, y no justifica un segundo canvas animado en la página.
 *
 * Mismo criterio de motion que las direcciones anteriores: un solo árbol JSX ya en su posición
 * final y el timeline sólo toca opacity/transform. Sin JS — mobile, `prefers-reduced-motion`, o
 * el primer frame — la lámina ya está completa. Dispara una vez con IntersectionObserver.
 */
import { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';

import { sdLumaUrl } from '../../data/startupDay';

const ASSET = (file: string) => `/logos/startup-day/quien/${file}?v=1`;

type QuienLogo = {
  id: string;
  name: string;
  src: string;
  /** Caja EXACTA del diseño, en px del frame de 1920. */
  w: number;
  h: number;
  /**
   * El asset viene a color y el diseño lo usa en blanco. `brightness(0) invert(1)` lleva
   * cualquier píxel opaco a blanco puro respetando el alfa — no sirve `grayscale`, que sobre un
   * azul saturado deja un gris medio.
   */
  whiten?: boolean;
};

/**
 * Los logos exportados del Figma, no los de `SD_STARTUPS`: son las versiones monocromas
 * preparadas para banda oscura, y una (Firmaway) ni siquiera existe en la data del proyecto.
 *
 * Dos excepciones: el export del MCP devolvió `elcerokm` y `certenza` 100% transparentes (son
 * image-fills y no se renderizaron). Para esos dos se usa el asset que ya tiene el repo —misma
 * marca, 3-4× la resolución de la caja del diseño— blanqueado por filtro.
 *
 * `w`/`h` son la caja de cada logo tal cual el diseño: se escalan todas por el mismo factor
 * (`--sd-quien-k`) pero cada una conserva su geometría, que es lo que sostiene el ritmo óptico
 * de la fila.
 */
const LOGOS: QuienLogo[] = [
  { id: 'yafu', name: 'Yafu', src: ASSET('yafu.svg'), w: 129, h: 33 },
  { id: 'sof', name: 'Satellites on Fire', src: ASSET('flame.svg'), w: 51.084, h: 66.848 },
  { id: 'paisanos', name: 'Paisanos', src: ASSET('paisanos.svg'), w: 183, h: 29.94 },
  { id: 'berry', name: 'Berry', src: ASSET('berry.png'), w: 72, h: 72 },
  {
    id: 'elcerokm',
    name: 'El cero KM',
    src: '/logos/startup-day/elcerokm.webp?v=12',
    w: 145,
    h: 72,
    whiten: true,
  },
  { id: 'firmaway', name: 'Firmaway', src: ASSET('firmaway.svg'), w: 258, h: 97 },
  {
    id: 'certenza',
    name: 'Certenza',
    src: '/logos/startup-day/certenza.png?v=12',
    w: 205,
    h: 31,
    whiten: true,
  },
];

const HEADLINE = 'No importa quién sos. Importa quién querés ser.';

const LEDE =
  'Stands abiertos durante todo el evento, workshops con empresas líderes, charlas y espacio ' +
  'para conversar con quienes están construyendo.';

function buildTimeline(els: {
  ascii: HTMLElement;
  glows: Element[];
  rules: Element[];
  marks: Element[];
  headline: Element;
  lede: Element;
  actions: Element;
  logos: Element[];
}) {
  const tl = gsap.timeline({ paused: true });

  /* La textura descansa translúcida (`.sd-quien__ascii` la fija en 0.2), así que el fade tiene que
     terminar en ESE valor y no en 1: llevarla a opaca la convierte en el elemento más fuerte de la
     lámina. Se lee del computado en vez de repetir el número acá — el valor es una decisión de
     diseño y vive en el CSS. */
  const asciiRest = parseFloat(getComputedStyle(els.ascii).opacity) || 1;

  tl.fromTo(els.ascii, { opacity: 0 }, { opacity: asciiRest, duration: 0.9, ease: 'power1.out' }, 0)
    .fromTo(els.glows, { opacity: 0 }, { opacity: 1, duration: 1.1, ease: 'power1.out' }, 0)
    /* Las hairlines se dibujan desde su origen: las horizontales abren hacia los lados, las
       verticales hacia abajo. `transform-origin` lo fija el CSS por clase. */
    .fromTo(
      els.rules,
      { scaleX: 0, scaleY: 0 },
      { scaleX: 1, scaleY: 1, duration: 0.7, stagger: 0.08, ease: 'power2.inOut' },
      0.1,
    )
    .fromTo(els.marks, { opacity: 0, scale: 0.4 }, { opacity: 1, scale: 1, duration: 0.3 }, 0.7)
    .fromTo(els.headline, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.7 }, 0.45)
    .fromTo(els.lede, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.5 }, 0.7)
    .fromTo(els.actions, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.5 }, 0.85)
    .fromTo(
      els.logos,
      { opacity: 0, y: 14 },
      { opacity: 1, y: 0, duration: 0.45, stagger: 0.07, ease: 'power2.out' },
      1.15,
    );

  return tl;
}

export function SdManifesto() {
  const rootRef = useRef<HTMLElement>(null);
  const asciiRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const ledeRef = useRef<HTMLParagraphElement>(null);
  const actionsRef = useRef<HTMLDivElement>(null);
  const firedRef = useRef(false);

  /* `useLayoutEffect`: el timeline se crea pausado y GSAP aplica su estado "from" apenas se
     construye (immediateRender) — tiene que pasar antes del primer paint o se ve la lámina
     completa seguida de un salto a oculto. En mobile / `prefers-reduced-motion` ni se ejecuta:
     el JSX ya es la composición final tal cual está escrita. */
  useLayoutEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const wide = window.matchMedia('(min-width: 900px)').matches;
    if (!wide || reduce) return;

    const root = rootRef.current;
    const ascii = asciiRef.current;
    const headline = headlineRef.current;
    const lede = ledeRef.current;
    const actions = actionsRef.current;
    if (!root || !ascii || !headline || !lede || !actions) return;

    const q = <T extends Element>(sel: string) => Array.from(root.querySelectorAll<T>(sel));
    const glows = q('.sd-quien__glow');
    const rules = q('.sd-quien__rule');
    const marks = q('.sd-quien__mark');
    const logos = q('.sd-quien__logo');

    if (!rules.length || !logos.length) return;

    let tl: gsap.core.Timeline | undefined;
    const ctx = gsap.context(() => {
      tl = buildTimeline({ ascii, glows, rules, marks, headline, lede, actions, logos });
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
    <section id="para-quien" className="sd-quien" ref={rootRef}>
      <div className="sd-quien__ascii" ref={asciiRef} aria-hidden />
      <div className="sd-quien__glow sd-quien__glow--tr" aria-hidden />
      <div className="sd-quien__glow sd-quien__glow--bl" aria-hidden />
      <div className="sd-quien__glow sd-quien__glow--cta" aria-hidden />

      {/* Marco técnico: la placa gris exterior, las hairlines del marco interior y las cuatro
          marcas de esquina. Todo decorativo — el contenido vive en `__body` / `__logos`. */}
      <div className="sd-quien__plate" aria-hidden />
      <div className="sd-quien__frame" aria-hidden>
        <span className="sd-quien__rule sd-quien__rule--top" />
        <span className="sd-quien__rule sd-quien__rule--left" />
        <span className="sd-quien__rule sd-quien__rule--right" />
        <span className="sd-quien__mark sd-quien__mark--tl" />
        <span className="sd-quien__mark sd-quien__mark--tr" />
        <span className="sd-quien__mark sd-quien__mark--bl" />
        <span className="sd-quien__mark sd-quien__mark--br" />
      </div>

      <div className="sd-quien__body">
        <h2 className="sd-quien__headline" ref={headlineRef}>
          {HEADLINE}
        </h2>

        <div className="sd-quien__aside">
          <p className="sd-quien__lede" ref={ledeRef}>
            {LEDE}
          </p>

          <div className="sd-quien__actions" ref={actionsRef}>
            <a
              className="sd-btn sd-btn--primary"
              href={sdLumaUrl('para-quien')}
              target="_blank"
              rel="noopener noreferrer"
            >
              Inscribirme
            </a>
            <a className="sd-btn sd-btn--ghost" href="#confirmadas">
              Conocé las startups
            </a>
          </div>
        </div>
      </div>

      {/* Banda de logos. Las dos reglas van como elementos propios y no como `border` del
          contenedor porque el timeline las dibuja con `scaleX`: escalando el contenedor se
          aplastarían también los logos de adentro. */}
      <div className="sd-quien__logos">
        <span className="sd-quien__rule sd-quien__rule--band-top" aria-hidden />
        <span className="sd-quien__rule sd-quien__rule--band-bottom" aria-hidden />

        <ul className="sd-quien__logo-row">
          {LOGOS.map((logo, i) => (
            <li key={logo.id} className="sd-quien__logo-cell">
              {i > 0 && <span className="sd-quien__logo-sep" aria-hidden />}
              <span
                className={`sd-quien__logo${logo.whiten ? ' sd-quien__logo--whiten' : ''}`}
                style={{ ['--w' as string]: logo.w, ['--h' as string]: logo.h }}
              >
                <img src={logo.src} alt={logo.name} loading="lazy" decoding="async" />
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
