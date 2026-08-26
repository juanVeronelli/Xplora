import type { CSSProperties } from 'react';
import {
  LOGO,
  SD_AGENDA_LOCKED,
  SD_AULAS,
  SD_CHARLAS,
  SD_EVENT,
  SD_STANDS,
  sdLumaUrl,
  type SdCharla,
} from '../../data/startupDay';
import { SdReveal } from './SdReveal';

/* ── El tiempo como grilla ──
   La ventana del día partida en filas de 5 minutos. Cada charla declara `grid-row: inicio / fin`
   y con eso queda ubicada Y dimensionada por su horario real: los huecos entre charlas son filas
   vacías y una charla de 15 minutos sale un tercio de alto que una de 45. Nada de esto se mide en
   JS — la versión anterior de esta sección leía `getBoundingClientRect()` de cada fila en un
   `useLayoutEffect` y en un listener de `resize` para dibujar su línea de tiempo. */
const INICIO = 15 * 60 + 30; // 15:30
const FIN = 20 * 60; // 20:00
const PASO = 5; // minutos por fila
/** 54. Se lo pasamos al CSS como custom property en vez de repetir el número en la hoja: el
    `repeat()` de `.sd-agenda__col` lo lee de acá y no puede quedar desfasado de `linea()`. */
const FILAS = (FIN - INICIO) / PASO;

const minutos = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3));
/** Línea de grilla de un horario: 15:30 → 1, 20:00 → 55. */
const linea = (t: string) => (minutos(t) - INICIO) / PASO + 1;
/** Posición del horario sobre el riel, en % de su alto. */
const pct = (t: string) => ((minutos(t) - INICIO) / (FIN - INICIO)) * 100;

/** Marcas del riel: una cada media hora, de 15:30 a 20:00. */
const TICKS = Array.from({ length: (FIN - INICIO) / 30 + 1 }, (_, i) => {
  const m = INICIO + i * 30;
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
});

function Charla({ charla }: { charla: SdCharla }) {
  /* Una charla de 15 minutos ocupa 3 filas: no hay alto para el nombre Y el horario. Igual que en
     el diseño, esas cards se quedan sólo con el nombre. */
  const corta = minutos(charla.to) - minutos(charla.from) < 30;

  return (
    <li
      className={`sd-agenda__card${corta ? ' is-corta' : ''}`}
      style={{ gridRow: `${linea(charla.from)} / ${linea(charla.to)}` }}
    >
      {/* El logo es ahora la única identificación de la card, así que va con `alt` real y no
          vacío. Las charlas sin archivo caen al nombre en texto: un punto solo no diría nada. */}
      <span className="sd-agenda__mark">
        {charla.logo ? (
          <img
            className={charla.logoEnColor ? 'is-color' : undefined}
            src={LOGO(charla.logo)}
            alt={charla.name}
            loading="lazy"
            decoding="async"
          />
        ) : (
          <h3 className="sd-agenda__name">{charla.name}</h3>
        )}
      </span>

      {corta ? null : (
        <p className="sd-agenda__when">
          <time dateTime={`${SD_EVENT.dateISO}T${charla.from}`}>{charla.from}</time>
          {' — '}
          <time dateTime={`${SD_EVENT.dateISO}T${charla.to}`}>{charla.to}</time>
        </p>
      )}
    </li>
  );
}

/** Encabezado de la sección — el título grande y su bajada. */
function AgendaHead() {
  return (
    <SdReveal className="sd-agenda__head">
      <h2 className="sd-agenda__title">Todo lo que va a pasar</h2>
      <p className="sd-agenda__sub">
        Charlas, workshops y espacios para conectar con founders, inversores y builders.
      </p>
    </SdReveal>
  );
}

/**
 * Vista bloqueada: mientras las charlas no estén confirmadas no publicamos horarios ni
 * oradores. Solo se muestra el dato que sí está cerrado (stands) y el CTA a la lista.
 */
function AgendaLocked() {
  return (
    <div id="agenda" className="sd-piso__agenda">
      <AgendaHead />

      <SdReveal delay={1} className="sd-agenda-locked">
        <span className="sd-agenda-locked__icon" aria-hidden>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
            <rect x="4.5" y="10.5" width="15" height="10" rx="2.2" />
            <path d="M8 10.5V7.6a4 4 0 0 1 8 0v2.9" strokeLinecap="round" />
          </svg>
        </span>

        <h3 className="sd-agenda-locked__title">Agenda próximamente</h3>

        <p className="sd-agenda-locked__copy">
          Estamos cerrando las charlas y los workshops del día. Publicamos la grilla completa
          apenas estén confirmados.
        </p>

        <p className="sd-agenda-locked__fact">
          <span className="sd-agenda-locked__fact-k">Ya confirmado</span>
          <span className="sd-agenda-locked__fact-v">
            {SD_STANDS.label} abiertos de {SD_STANDS.from}:00 a {SD_STANDS.to}:00
          </span>
        </p>

        <a
          className="sd-btn sd-btn--primary"
          href={sdLumaUrl('agenda')}
          target="_blank"
          rel="noopener noreferrer"
        >
          Inscribirme
        </a>
      </SdReveal>
    </div>
  );
}

/**
 * La grilla: un riel de horarios a la izquierda y una columna por aula, en paralelo.
 * Sin estado, sin timers, sin observers — todo el posicionamiento es CSS.
 */
function AgendaGrilla() {
  return (
    <div id="agenda" className="sd-piso__agenda">
      <AgendaHead />

      <SdReveal delay={1} className="sd-agenda">
        {/* Los encabezados van en su propia grilla con el MISMO template de columnas que la de
            abajo (la custom property `--sd-agenda-cols`), así quedan a plomo sin `subgrid`. */}
        <div className="sd-agenda__cols" aria-hidden>
          <span />
          {SD_AULAS.map((aula) => (
            <span key={aula.id} className="sd-agenda__col-head">
              {aula.label}
            </span>
          ))}
        </div>

        <div className="sd-agenda__grid">
          {/* El riel se estira solo al alto de las columnas (`stretch` del grid), así que los
              porcentajes de cada marca caen exactos sin medir nada. */}
          <div className="sd-agenda__rail" aria-hidden>
            {TICKS.map((t) => (
              <span key={t} className="sd-agenda__tick" style={{ top: `${pct(t)}%` }}>
                {t}
              </span>
            ))}
          </div>

          {SD_AULAS.map((aula) => (
            <ol
              key={aula.id}
              className="sd-agenda__col"
              aria-label={aula.label}
              style={{ '--sd-agenda-filas': FILAS } as CSSProperties}
            >
              {SD_CHARLAS.filter((c) => c.aula === aula.id).map((c) => (
                <Charla key={`${c.aula}-${c.from}`} charla={c} />
              ))}
            </ol>
          ))}
        </div>

        <p className="sd-agenda__note">
          <span className="sd-agenda__note-icon" aria-hidden>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 11v5.5" strokeLinecap="round" />
              <path d="M12 7.6v.6" strokeLinecap="round" />
            </svg>
          </span>
          La agenda puede estar sujeta a cambios.
          <span className="sd-agenda__note-sep" aria-hidden />
          {SD_STANDS.label} abiertos de {SD_STANDS.from} a {SD_STANDS.to} hs.
        </p>
      </SdReveal>
    </div>
  );
}

export function StartupDayAgenda() {
  if (SD_AGENDA_LOCKED) return <AgendaLocked />;
  return <AgendaGrilla />;
}
