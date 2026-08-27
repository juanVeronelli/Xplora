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

import { SD_STARTUPS, sdInscripcionUrl } from '../../data/startupDay';

const ASSET = (file: string) => `/logos/startup-day/quien/${file}?v=1`;

/**
 * Marcas que el evento no muestra en esta banda: son sponsors y empresas invitadas, no startups
 * del piso. Hoy ninguna está en `SD_STARTUPS` —sólo aparecen como texto en la agenda—, pero el
 * filtro queda explícito para que la banda no las levante si mañana se suman a la lista.
 */
const EXCLUIDAS = new Set(['endeavor', 'mercadolibre', 'mercado-libre', 'globant', 'picante', 'newtopia']);

/**
 * Assets con placa de fondo propia: el logo no es sólo el glifo, trae una tarjeta detrás, así que
 * blanquearlo por filtro fundiría placa y glifo en un bloque macizo. Se muestra tal cual — el
 * mismo tratamiento que el diseño le da a Berry, que en el Figma viene sobre una placa blanca.
 *
 * Berry quedó como único caso: al resto de las marcas con placa (Piggy Wallet, WIP Club, Startups
 * Argentina) se les generó una versión monocroma sobre transparente en `quien/`, que entra por
 * `OVERRIDE`.
 */
const CON_CHIP = new Set(['berry']);

/**
 * Reemplazos del logo de `SD_STARTUPS` para esta banda, que es monocroma sobre negro y necesita
 * el glifo en blanco sobre transparente.
 *
 * Los de `quien/` se derivaron del asset del repo quitándole la placa de fondo: el alfa sale de la
 * distancia al color de la placa —no de un umbral duro— para que los bordes antialiaseados no
 * queden dentados, con un piso que elimina el velo residual sobre la superficie de la tarjeta.
 * WIP Club es el caso especial: su marca es texto blanco calado sobre un disco azul, así que lo
 * que se elimina es el blanco de afuera y queda el disco en blanco con las letras caladas.
 */
const OVERRIDE: Record<string, string> = {
  /** El del repo es un wordmark negro sobre amarillo a sangre; éste es el export del Figma. */
  paisanos: ASSET('paisanos.svg'),
  /**
   * El logo del repo es la ilustración del regador, con el wordmark "PASITO" adentro a 66×19px y
   * pisado por el dibujo: recortarlo de ahí no daba una letra usable a este tamaño. Éste es el
   * wordmark suelto que pasó el cliente, sólo recortado al contenido.
   */
  pasito: ASSET('pasito.png'),
  /** El mismo que ya usa la tira de sponsors: blanco sobre transparente, sin retoque. */
  resender: '/logos/startup-day/resender-dev.png?v=12',
  piggywallet: ASSET('piggywallet.png'),
  /** Reemplazo pasado por el cliente: birrete + wordmark, ya en claro sobre transparente. */
  tuni: ASSET('tuni.png'),
  /**
   * Isotipo monocromo. Va como override y no reemplazando el asset general porque el del repo
   * —isotipo + wordmark a color— lo siguen usando la tira de sponsors y el carrusel de
   * confirmadas, donde ese logo funciona.
   */
  coworkeando: ASSET('coworkeando.png'),
  wipclub: ASSET('wipclub.png'),
  'startups-argentina': ASSET('startups-argentina.png'),
};

/**
 * Toda la grilla de startups, en el orden de la data. Se blanquean por filtro
 * (`brightness(0) invert(1)`, que lleva cualquier píxel opaco a blanco respetando el alfa) porque
 * la banda es monocroma sobre negro; las de `CON_CHIP` quedan afuera de esa regla.
 *
 * A diferencia de la versión anterior —7 logos con la caja exacta del Figma— acá la caja es
 * uniforme: el diseño sólo definió geometría para esas 7, y para la grilla entera lo que
 * sostiene el ritmo es una celda igual para todas con `object-fit: contain`. Los wordmarks anchos
 * terminan topando contra el ancho y los isotipos cuadrados contra el alto, que es justamente la
 * proporción que tenían en el diseño.
 */
const LOGOS = SD_STARTUPS.filter((c) => !EXCLUIDAS.has(c.id)).map((c) => ({
  id: c.id,
  name: c.name,
  /** Vacío para las confirmadas que todavía no tienen archivo: se cae al nombre en texto. */
  src: OVERRIDE[c.id] ?? c.logoUrl,
  chip: CON_CHIP.has(c.id),
  href: c.website || c.instagram || c.linkedin,
}));

/** Duplicada: el keyframe `sd-marquee` desplaza el track -50%, así que el ciclo cierra sin salto. */
const LOOP = [...LOGOS, ...LOGOS];

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
  marquee: Element;
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
    /* La banda entra como bloque y no logo por logo: con la fila duplicada para el loop, un
       stagger recorrería decenas de elementos —la mayoría fuera de pantalla— y el remate de la
       lámina llegaría varios segundos tarde. */
    .fromTo(els.marquee, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.5 }, 1.1);

  return tl;
}

export function SdManifesto() {
  const rootRef = useRef<HTMLElement>(null);
  const asciiRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const ledeRef = useRef<HTMLParagraphElement>(null);
  const actionsRef = useRef<HTMLDivElement>(null);
  const marqueeRef = useRef<HTMLDivElement>(null);
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
    const marquee = marqueeRef.current;

    if (!rules.length || !marquee) return;

    let tl: gsap.core.Timeline | undefined;
    const ctx = gsap.context(() => {
      tl = buildTimeline({ ascii, glows, rules, marks, headline, lede, actions, marquee });
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

      {/* Marco técnico: dos reglas a sangre —arriba y abajo— y las cuatro marcas de esquina.
          Sin verticales: cruzaban la banda de logos de punta a punta y cortaban el desfile. Las
          marcas de esquina quedan igual y solas alcanzan para acotar la lámina. */}
      <div className="sd-quien__frame" aria-hidden>
        <span className="sd-quien__rule sd-quien__rule--top" />
        <span className="sd-quien__rule sd-quien__rule--bottom" />
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
              href={sdInscripcionUrl('para-quien')}
              target="_blank"
              rel="noopener noreferrer"
            >
              Inscribirme
            </a>
            {/* Apunta a `#que-pasa`, que es la sección "La experiencia" (`SdExperiencia`). */}
            <a className="sd-btn sd-btn--ghost" href="#que-pasa">
              Conocé el evento
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

        <div
          className="sd-quien__marquee"
          ref={marqueeRef}
          role="group"
          aria-label="Startups confirmadas"
        >
          {/* La duración escala con la cantidad de marcas para que la velocidad de paso no
              dependa de cuántas haya en la data. */}
          <ul
            className="sd-quien__logo-row"
            style={{ ['--sd-quien-dur' as string]: `${LOGOS.length * 3.2}s` }}
          >
            {LOOP.map((logo, i) => {
              /* La segunda vuelta es la copia que cierra el loop: se esconde de lectores de
                 pantalla y se saca del tabulado para no repetir las 35 marcas dos veces. */
              const copia = i >= LOGOS.length;
              const contenido = logo.src ? (
                /* Sin `loading="lazy"` a propósito: el navegador decide qué diferir por la
                   posición de LAYOUT, y en un track que se mueve por `transform` todas las marcas
                   quedan fuera de pantalla para siempre según ese criterio. Medido: a los 9s de
                   animación seguían sin cargar 49 de 62, o sea que entraban en blanco. El costo
                   real es cercano a cero igual, porque son los mismos archivos que el carrusel de
                   "Confirmadas" pide unas líneas más abajo. */
                <img src={logo.src} alt={logo.name} decoding="async" />
              ) : (
                <span className="sd-quien__logo-text">{logo.name}</span>
              );
              const clase = `sd-quien__logo${logo.chip ? ' sd-quien__logo--chip' : ''}`;

              return (
                <li key={`${logo.id}-${i}`} className="sd-quien__logo-cell" aria-hidden={copia}>
                  <span className="sd-quien__logo-sep" aria-hidden />
                  {logo.href ? (
                    <a
                      className={clase}
                      href={logo.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      tabIndex={copia ? -1 : undefined}
                      title={logo.name}
                    >
                      {contenido}
                    </a>
                  ) : (
                    <span className={clase}>{contenido}</span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
