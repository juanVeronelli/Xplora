import { useEffect, useRef } from 'react';
import gsap from 'gsap';

/**
 * Entrada pixelada — adaptación del recurso "Pixelated Wave" de Osmo.
 *
 * El original es una transición entre páginas con Barba: revela la página entrante con un
 * `clip-path` por pasos mientras titilan los píxeles. Acá no hay router de páginas, así que lo que
 * se barre es el loader: su `clip-path` colapsa de izquierda a derecha en 12 pasos y va destapando
 * la landing que ya está montada debajo.
 *
 * Que el barrido caiga sobre el loader y no sobre `.sd-page` es deliberado. `.sd-page` tiene dos
 * problemas: el modal de sponsors es `position: fixed` y quedaría anclado al hero (un elemento con
 * `clip-path` pasa a ser bloque contenedor de sus descendientes fijos), y el footer es hermano de
 * `.sd-page`, así que quedaría sin cubrir. El loader es `position: fixed; inset: 0` y no tiene
 * descendientes fijos: no sufre ninguna de las dos cosas.
 *
 * El panel de píxeles se monta como hermano del loader, nunca como hijo: si fuera hijo lo
 * recortaría el mismo `clip-path` y el titileo no podría adelantarse a la costura.
 */

/** Constantes del recurso original. */
const COLUMNS = 12;
const TRANSITION_DURATION = 1;
const PIXEL_FADE_DURATION = 0.2;
const PIXEL_OVERLAP = 0.3;

const FULL = 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)';
const SWEPT_RIGHT = 'polygon(100% 0%, 100% 0%, 100% 100%, 100% 100%)';
const SWEPT_DOWN = 'polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%)';

type Props = {
  /** Dispara el barrido cuando pasa a `true`. */
  play: boolean;
  /** El elemento que se retira: el loader. */
  coverRef: React.RefObject<HTMLElement | null>;
};

export function SdPixelWave({ play, coverRef }: Props) {
  const panelRef = useRef<HTMLDivElement>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    const panel = panelRef.current;
    const cover = coverRef.current;
    if (!panel || !play || startedRef.current) return;
    startedRef.current = true;

    const hideCover = () => {
      if (!cover) return;
      cover.style.visibility = 'hidden';
      /* Sin limpiar el clip-path, el elemento seguiría siendo bloque contenedor de cualquier
         descendiente fijo que se monte después. */
      cover.style.clipPath = '';
      cover.style.removeProperty('-webkit-clip-path');
    };

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      hideCover();
      panel.style.visibility = 'hidden';
      return;
    }

    /* La grilla se arma al tamaño real del panel. En portrait las columnas pasan a ser filas y el
       barrido va de arriba hacia abajo. */
    const isPortrait = window.innerHeight > window.innerWidth;
    const rect = panel.getBoundingClientRect();
    panel.style.flexDirection = isPortrait ? 'column' : 'row';

    const lineSize = (isPortrait ? rect.height : rect.width) / COLUMNS;
    const crossAmount = Math.max(1, Math.ceil((isPortrait ? rect.width : rect.height) / lineSize));

    const frag = document.createDocumentFragment();
    for (let i = 0; i < COLUMNS; i++) {
      const line = document.createElement('div');
      line.dataset.transitionCol = '';
      line.className = 'sd-px__col';
      line.style.flexDirection = isPortrait ? 'row' : 'column';
      for (let j = 0; j < crossAmount; j++) {
        const px = document.createElement('div');
        px.dataset.transitionPixel = '';
        px.className = 'sd-px__pixel';
        line.appendChild(px);
      }
      frag.appendChild(line);
    }
    panel.replaceChildren(frag);

    const lines = Array.from(panel.querySelectorAll<HTMLElement>('[data-transition-col]'));
    const allPixels = panel.querySelectorAll<HTMLElement>('[data-transition-pixel]');

    const overlap = Math.max(0, Math.min(1, PIXEL_OVERLAP));
    const sweepStart = Math.min(PIXEL_FADE_DURATION, TRANSITION_DURATION * 0.5);
    const sweepDuration = Math.max(0.001, TRANSITION_DURATION - 2 * sweepStart);
    const stepDur = sweepDuration / COLUMNS;
    const endDelay = TRANSITION_DURATION / COLUMNS;

    gsap.set(allPixels, { opacity: 0, willChange: 'opacity' });
    gsap.set(panel, { visibility: 'visible' });

    const tl = gsap.timeline({ onComplete: hideCover });

    lines.forEach((line, i) => {
      const pixels = Array.from(line.querySelectorAll<HTMLElement>('[data-transition-pixel]'));
      if (!pixels.length) return;

      const revealTime = sweepStart + i * stepDur;
      const fillStart = Math.max(0, revealTime - PIXEL_FADE_DURATION);
      const fadeStart = Math.min(TRANSITION_DURATION, revealTime + stepDur);

      const perPixelMin = PIXEL_FADE_DURATION / pixels.length;
      const perPixelDur = perPixelMin * (1 - overlap) + PIXEL_FADE_DURATION * overlap;
      const spread = Math.max(0, PIXEL_FADE_DURATION - perPixelDur);
      const stagger = { amount: spread, from: 'random' as const };

      tl.to(
        pixels,
        { opacity: 1, duration: Math.max(0.001, perPixelDur), ease: 'none', stagger },
        fillStart,
      );
      tl.to(
        pixels,
        { opacity: 0, duration: Math.max(0.001, perPixelDur), ease: 'none', stagger },
        fadeStart,
      );
    });

    if (cover) {
      const swept = isPortrait ? SWEPT_DOWN : SWEPT_RIGHT;
      tl.fromTo(
        cover,
        { clipPath: FULL, webkitClipPath: FULL },
        {
          clipPath: swept,
          webkitClipPath: swept,
          ease: `steps(${COLUMNS})`,
          duration: sweepDuration,
        },
        sweepStart,
      );
    }

    tl.set(panel, { visibility: 'hidden' }, TRANSITION_DURATION + endDelay);
    tl.set(allPixels, { clearProps: 'willChange' }, TRANSITION_DURATION + endDelay);

    return () => {
      /* Si el efecto se desmonta a mitad del barrido (StrictMode en dev, o una navegación), matar
         el timeline dejaría el loader tapando la página para siempre. Se salta al estado final. */
      if (tl.progress() < 1) hideCover();
      tl.kill();
    };
  }, [play, coverRef]);

  return <div ref={panelRef} className="sd-px" data-transition-panel aria-hidden />;
}
