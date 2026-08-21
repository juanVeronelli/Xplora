import { SD_EVENT, SD_SCHEDULE, SD_STANDS, type SdScheduleBeat } from '../../data/startupDay';
import { SdReveal } from './SdReveal';

function kindLabel(beat: SdScheduleBeat): string {
  if (beat.kind === 'main') return 'Charla';
  if (beat.kind === 'final') return 'Charla';
  if (beat.kind === 'workshop') return 'Workshop';
  if (beat.kind === 'stands') return 'Stands';
  return 'Charla';
}

function timeRange(beat: SdScheduleBeat): string {
  return beat.timeEnd ? `${beat.time} – ${beat.timeEnd}` : beat.time;
}

/** Agrupa sesiones que arrancan juntas (paralelas en aulas distintas). */
function groupSchedule(beats: readonly SdScheduleBeat[]) {
  const groups: { key: string; time: string; items: SdScheduleBeat[] }[] = [];
  for (const beat of beats) {
    const key = `${beat.time}|${beat.timeEnd ?? ''}`;
    const last = groups[groups.length - 1];
    if (last && last.key === key) {
      last.items.push(beat);
    } else {
      groups.push({ key, time: timeRange(beat), items: [beat] });
    }
  }
  return groups;
}

export function StartupDayAgenda() {
  const groups = groupSchedule(SD_SCHEDULE);

  return (
    <section id="agenda" className="sd-band sd-band--ink">
      <SdReveal className="sd-agenda__head">
        <p className="sd-kicker">Agenda</p>
        <h2 className="sd-h2">El día, bloque a bloque</h2>
        <p className="sd-agenda__when">
          <span>11 de septiembre</span>
          <span aria-hidden className="sd-agenda__dot" />
          <span>{SD_EVENT.timeLabel}</span>
        </p>
        <p className="sd-agenda__disclaimer">Agenda sujeta a cambios</p>
      </SdReveal>

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

        <ol className="sd-agenda__slots">
          {groups.map((group) => (
            <li key={group.key} className="sd-agenda__slot">
              <time className="sd-agenda__slot-time">{group.time}</time>
              <ul className="sd-agenda__slot-items">
                {group.items.map((beat) => (
                  <li key={`${beat.label}-${beat.room ?? ''}`} className="sd-agenda__item">
                    <span className="sd-agenda__item-name">{beat.label}</span>
                    <span className="sd-agenda__item-meta">
                      {kindLabel(beat)}
                      {beat.room ? ` · Aula ${beat.room}` : ''}
                    </span>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </SdReveal>
    </section>
  );
}
