import { useState } from 'react';
import { SD_DAY_STORY, sdLumaUrl } from '../../data/startupDay';
import { SdReveal } from './SdReveal';

/**
 * "La experiencia" — acordeón tipográfico.
 *
 * Antes esto era un panel: bordes redondeados, sombra de 120px, degradado propio, una foto de
 * horizonte en `mix-blend-mode: screen` y cuatro SVG con halos radiales. Demasiada capa para lo
 * que la sección dice. Ahora es lo mínimo que sostiene el contenido —título grande, cuatro filas
 * numeradas, hairlines— plano sobre `--sd-ink`, igual que sus dos secciones vecinas.
 *
 * Una sola fila abierta por vez. El patrón de índice activo es el de `StartupDayAgenda`
 * (`active` + hover/focus/click), pero sin el intervalo ni el `userLocked` de allá: acá no hay
 * nada que auto-avanzar, y al salir el mouse la fila se queda donde el usuario la dejó.
 *
 * Cada fila es UNA grilla de cuatro columnas y sus tres piezas van en la misma línea:
 * `[01 | STANDS]` (el botón), la descripción y la flecha. La descripción es hermana del botón y
 * no hija, para que arranque a la altura del título en vez de caer debajo — y para que el nombre
 * accesible del botón siga siendo sólo el nombre de la fila, no el párrafo entero.
 */

/** Flecha única: la rotación (↗ abierta / ↘ cerrada) la hace el CSS sobre `.sd-exp__arrow`. */
function ExpArrow() {
  return (
    <svg
      className="sd-exp__arrow-svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="square"
      aria-hidden
      focusable="false"
    >
      <path d="M6 18 18 6" />
      <path d="M9 6h9v9" />
    </svg>
  );
}

export function SdExperiencia() {
  const [active, setActive] = useState(0);

  return (
    <section id="que-pasa" className="sd-band sd-band--ink sd-exp">
      <SdReveal className="sd-exp__head">
        <h2 className="sd-exp__title">{SD_DAY_STORY.title}</h2>
      </SdReveal>

      <SdReveal delay={1} className="sd-exp__list">
        {SD_DAY_STORY.pillars.map((pillar, i) => {
          const open = i === active;
          return (
            <div
              key={pillar.tag}
              className={`sd-exp__row${open ? ' is-open' : ''}`}
              /* El hover vive en la fila entera y no en el botón: el botón sólo ocupa las dos
                 primeras columnas, así que si no la zona de la descripción quedaría muerta. */
              onMouseEnter={() => setActive(i)}
            >
              <button
                type="button"
                className="sd-exp__trigger"
                aria-expanded={open}
                aria-controls={`sd-exp-body-${i}`}
                onFocus={() => setActive(i)}
                onClick={() => setActive(i)}
              >
                <span className="sd-exp__num">{String(i + 1).padStart(2, '0')}</span>
                <span className="sd-exp__name">{pillar.tag}</span>
              </button>

              {/* Se queda montado y colapsa a `0fr`: `visibility: hidden` lo saca del árbol de
                  accesibilidad mientras está cerrado y además deja animar la apertura. */}
              <div id={`sd-exp-body-${i}`} className="sd-exp__body" role="region">
                <p className="sd-exp__copy">{pillar.text}</p>
              </div>

              <span className="sd-exp__arrow" aria-hidden>
                <ExpArrow />
              </span>
            </div>
          );
        })}
      </SdReveal>

      {/* Mismo par que cierra "No importa quién sos": el primario fuerte y el secundario claro. */}
      <SdReveal delay={2} className="sd-exp__actions">
        <a
          className="sd-btn sd-btn--primary"
          href={sdLumaUrl('experiencia')}
          target="_blank"
          rel="noopener noreferrer"
        >
          Inscribirme
        </a>
        {/* `#piso` es la sección "El lugar" (`StartupDayFloor` + agenda). */}
        <a className="sd-btn sd-btn--ghost" href="#piso">
          Conocé el lugar
        </a>
      </SdReveal>
    </section>
  );
}
