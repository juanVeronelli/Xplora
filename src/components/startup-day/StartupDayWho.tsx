import { useEffect, useRef, useState } from 'react';
import { SD_LUMA_URL } from '../../data/startupDay';

const CAST = [
  {
    word: 'Estudiantes',
    line: 'Idea en la cabeza o ganas de meterte al ecosistema',
  },
  {
    word: 'Founders',
    line: 'Ya saliste a la cancha y querés gente que entienda',
  },
  {
    word: 'Startups',
    line: 'Producto en el piso, charlas e inversores el mismo día',
  },
] as const;

const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ••••■■';
const STEPS = CAST.length;
const MOBILE_MQ = '(max-width: 719px)';

function scrambleToward(target: string, progress: number): string {
  return target
    .split('')
    .map((ch, i) => {
      if (ch === ' ') return ' ';
      const revealAt = (i + 1) / target.length;
      if (progress >= revealAt) return ch;
      return GLYPHS[Math.floor(Math.random() * GLYPHS.length)]!;
    })
    .join('');
}

type PinMode = 'before' | 'fixed' | 'after';

/**
 * Tramo de scroll = N viewports. El panel queda fijo a 100vh
 * y el progreso cambia slides; en la última el scroll sigue normal.
 */
export function StartupDayWho() {
  const pinRef = useRef<HTMLElement>(null);
  const bandRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef(0);

  const [mobile, setMobile] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(MOBILE_MQ).matches : false,
  );
  const [mode, setMode] = useState<PinMode>('before');
  const [active, setActive] = useState(0);
  const [display, setDisplay] = useState<string>(CAST[0].word);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_MQ);
    const sync = () => setMobile(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    if (mobile) {
      setMode('before');
      return;
    }

    const pin = pinRef.current;
    if (!pin) return;

    let rafScroll = 0;

    const measure = () => {
      const vh = window.innerHeight;
      const pinTop = pin.getBoundingClientRect().top + window.scrollY;
      const pinH = pin.offsetHeight;
      const start = pinTop;
      const end = pinTop + pinH - vh;
      const y = window.scrollY;

      let nextMode: PinMode;
      if (y < start) nextMode = 'before';
      else if (y >= end) nextMode = 'after';
      else nextMode = 'fixed';

      setMode(nextMode);

      if (nextMode === 'fixed') {
        const p = Math.min(1, Math.max(0, (y - start) / Math.max(1, end - start)));
        setProgress(p);
        const idx = Math.min(STEPS - 1, Math.floor(p * STEPS));
        if (idx !== activeRef.current) {
          activeRef.current = idx;
          setActive(idx);
        }
      } else if (nextMode === 'before') {
        setProgress(0);
        if (activeRef.current !== 0) {
          activeRef.current = 0;
          setActive(0);
        }
      } else {
        setProgress(1);
        if (activeRef.current !== STEPS - 1) {
          activeRef.current = STEPS - 1;
          setActive(STEPS - 1);
        }
      }
    };

    const onScroll = () => {
      if (rafScroll) return;
      rafScroll = requestAnimationFrame(() => {
        rafScroll = 0;
        measure();
      });
    };

    measure();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });

    return () => {
      cancelAnimationFrame(rafScroll);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [mobile]);

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      setDisplay(CAST[active].word);
      return;
    }
    let frame = 0;
    let raf = 0;
    const frames = 18;
    const tick = () => {
      frame += 1;
      setDisplay(scrambleToward(CAST[active].word, frame / frames));
      if (frame < frames) raf = requestAnimationFrame(tick);
      else setDisplay(CAST[active].word);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active]);

  const jumpTo = (index: number) => {
    if (mobile) {
      activeRef.current = index;
      setActive(index);
      setProgress((index + 1) / STEPS);
      return;
    }
    const pin = pinRef.current;
    if (!pin) return;
    const vh = window.innerHeight;
    const pinTop = pin.getBoundingClientRect().top + window.scrollY;
    const end = pinTop + pin.offsetHeight - vh;
    const start = pinTop;
    const target = start + ((index + 0.45) / STEPS) * Math.max(1, end - start);
    window.scrollTo({ top: target, behavior: 'smooth' });
  };

  const item = CAST[active]!;

  return (
    <section
      id="para-quien"
      ref={pinRef}
      className={`sd-who-pin${mobile ? ' is-tap' : ''}`}
      style={{ ['--who-steps' as string]: STEPS }}
      aria-label="Para quién"
    >
      <div ref={bandRef} className={`sd-who-band is-${mode}`}>
          <div className="sd-who__wallpaper" aria-hidden>
          {Array.from({ length: 18 }, (_, i) => (
            <span key={i}>Estudiantes Founders Startups</span>
          ))}
        </div>

        <div className="sd-who__stage">
          <p className="sd-kicker">Para quién</p>

          <p className="sd-who__decoded" aria-live="polite">
            <span className="sd-who__decoded-word">{display}</span>
          </p>

          <p className="sd-who__line">{item.line}</p>

          <div className="sd-who__rail" role="tablist" aria-label="Perfiles">
            {CAST.map((c, i) => (
              <button
                key={c.word}
                type="button"
                role="tab"
                aria-selected={i === active}
                className={`sd-who__chip${i === active ? ' is-on' : ''}`}
                onClick={() => jumpTo(i)}
              >
                {c.word}
              </button>
            ))}
          </div>

          <div className="sd-who__foot">
            <p className="sd-who__meta">11.09 · 15 a 20 hs · Alem 882 · Gratis</p>
            <a
              className="sd-btn sd-btn--primary"
              href={SD_LUMA_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              Inscribirme
            </a>
          </div>
        </div>

        <div className="sd-who__progress" aria-hidden>
          <span style={{ transform: `scaleX(${progress || (active + 1) / STEPS})` }} />
        </div>

        <div className="sd-who__steps" aria-hidden>
          {CAST.map((c, i) => (
            <i key={c.word} className={i === active ? 'is-on' : undefined} />
          ))}
        </div>

        <div className="sd-who__hint" aria-hidden>
          {active >= STEPS - 1 ? 'Seguí scrolleando' : 'Scrolleá'}
        </div>
      </div>
    </section>
  );
}
