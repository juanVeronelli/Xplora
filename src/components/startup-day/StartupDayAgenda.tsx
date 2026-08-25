import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  SD_AGENDA_LOCKED,
  SD_EVENT,
  SD_SCHEDULE,
  SD_STANDS,
  sdLumaUrl,
  type SdScheduleBeat,
} from '../../data/startupDay';
import { SdReveal } from './SdReveal';

function speakerOf(beat: SdScheduleBeat): string | undefined {
  if (beat.kind === 'workshop') return beat.label;
  if (beat.kind === 'stands') return undefined;
  return beat.detail;
}

function titleOf(beat: SdScheduleBeat): string {
  if (beat.kind === 'main') return 'Charla principal';
  if (beat.kind === 'final') return 'Charla final';
  if (beat.kind === 'stands') return 'Stands abiertos';
  return 'Workshop';
}

/** Encabezado común a las dos vistas de la sección. */
function AgendaHead() {
  return (
    <SdReveal className="sd-agenda__head">
      <p className="sd-kicker">Agenda</p>
      <p className="sd-agenda__when">
        <span>11 de septiembre</span>
        <span aria-hidden className="sd-agenda__dot" />
        <span>{SD_EVENT.timeLabel}</span>
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

        <h2 className="sd-agenda-locked__title">Agenda próximamente</h2>

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

/** Línea de tiempo interactiva. Se publica cuando `SD_AGENDA_LOCKED` pasa a `false`. */
function AgendaTimeline() {
  const rootRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLOListElement>(null);
  const rowRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [inView, setInView] = useState(false);
  const [spine, setSpine] = useState({ top: 0, bottom: 0, fill: 0 });
  const userLocked = useRef(false);

  const measureSpine = () => {
    const line = lineRef.current;
    if (!line) return;

    const dots = rowRefs.current
      .map((row) => row?.querySelector<HTMLElement>('.sd-agenda__dot-hit') ?? null)
      .filter((el): el is HTMLElement => Boolean(el));

    if (dots.length === 0) return;

    const lineRect = line.getBoundingClientRect();
    const centers = dots.map((dot) => {
      const r = dot.getBoundingClientRect();
      return r.top - lineRect.top + r.height / 2;
    });

    const first = centers[0] ?? 0;
    const last = centers[centers.length - 1] ?? first;
    const current = centers[active] ?? first;

    setSpine({
      top: first,
      bottom: lineRect.height - last,
      fill: Math.max(0, current - first),
    });
  };

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.3 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!inView || paused) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const id = window.setInterval(() => {
      if (userLocked.current) return;
      setActive((i) => (i + 1) % SD_SCHEDULE.length);
    }, 2200);
    return () => window.clearInterval(id);
  }, [inView, paused]);

  useEffect(() => {
    if (!paused || !userLocked.current) return;
    const id = window.setTimeout(() => {
      userLocked.current = false;
      setPaused(false);
    }, 7000);
    return () => window.clearTimeout(id);
  }, [paused, active]);

  useLayoutEffect(() => {
    measureSpine();
  }, [active]);

  useEffect(() => {
    const onResize = () => measureSpine();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [active]);

  return (
    <div id="agenda" className="sd-piso__agenda" ref={rootRef}>
      <AgendaHead />

      <SdReveal className="sd-agenda">
        <p className="sd-agenda__stands">
          <span className="sd-agenda__stands-label">{SD_STANDS.label}</span>
          <span className="sd-agenda__stands-sep" aria-hidden />
          <span className="sd-agenda__stands-copy">
            Abiertos todo el horario — también durante charlas y workshops
          </span>
          <span className="sd-agenda__stands-range">
            {SD_STANDS.from}:00 — {SD_STANDS.to}:00
          </span>
        </p>

        <ol
          ref={lineRef}
          className="sd-agenda__line"
          onMouseLeave={() => {
            if (!userLocked.current) setPaused(false);
          }}
        >
          <div
            className="sd-agenda__spine"
            aria-hidden
            style={{ top: spine.top, bottom: spine.bottom }}
          >
            <span className="sd-agenda__spine-base" />
            <span className="sd-agenda__spine-fill" style={{ height: spine.fill }} />
          </div>

          {SD_SCHEDULE.map((beat, i) => {
            const speaker = speakerOf(beat);
            const selected = i === active;
            return (
              <li key={`${beat.time}-${beat.label}`}>
                <button
                  type="button"
                  ref={(el) => {
                    rowRefs.current[i] = el;
                  }}
                  className={`sd-agenda__row sd-agenda__row--${beat.kind}${selected ? ' is-active' : ''}`}
                  aria-current={selected ? 'true' : undefined}
                  onMouseEnter={() => {
                    setPaused(true);
                    setActive(i);
                  }}
                  onFocus={() => {
                    setPaused(true);
                    setActive(i);
                  }}
                  onClick={() => {
                    userLocked.current = true;
                    setActive(i);
                    setPaused(true);
                  }}
                >
                  <time className="sd-agenda__time" dateTime={`2026-09-09T${beat.time}:00`}>
                    {beat.time}
                  </time>
                  <span className="sd-agenda__dot-hit" aria-hidden />
                  <span className="sd-agenda__title">{titleOf(beat)}</span>
                  {speaker ? (
                    <span className="sd-agenda__speaker">{speaker}</span>
                  ) : (
                    <span className="sd-agenda__speaker sd-agenda__speaker--empty" aria-hidden />
                  )}
                </button>
              </li>
            );
          })}
        </ol>
      </SdReveal>
    </div>
  );
}

/**
 * Elige la vista según el flag. Son dos componentes y no un early-return para que la
 * timeline no monte sus timers ni su observer mientras la agenda está bloqueada.
 */
export function StartupDayAgenda() {
  if (SD_AGENDA_LOCKED) return <AgendaLocked />;
  return <AgendaTimeline />;
}
