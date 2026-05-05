import type { Evento } from '../types';

const MONTH_WORDS: Record<string, number> = {
  enero: 0,
  febrero: 1,
  marzo: 2,
  abril: 3,
  mayo: 4,
  junio: 5,
  julio: 6,
  agosto: 7,
  septiembre: 8,
  setiembre: 8,
  octubre: 9,
  noviembre: 10,
  diciembre: 11,
};

function monthAbbrToIndex(abbr: string): number | null {
  const u = abbr.trim().toUpperCase().slice(0, 3);
  const keys = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
  const i = keys.indexOf(u);
  return i >= 0 ? i : null;
}

function startOfDayLocal(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

/**
 * Interpreta la fecha del evento desde `date` (texto libre), `day` y `month` del admin.
 * Si no hay año en el texto, usa el año actual y, si ya pasó, el año siguiente.
 */
export function getEventDate(ev: Pick<Evento, 'date' | 'day' | 'month'>): Date | null {
  const raw = (ev.date || '').trim();
  const lower = raw.toLowerCase();

  const yearMatch = raw.match(/\b(20\d{2})\b/);
  let year = yearMatch ? parseInt(yearMatch[1], 10) : new Date().getFullYear();

  const wordMatch = lower.match(/(\d{1,2})\s+de\s+([a-záéíóúñ]+)/);
  if (wordMatch) {
    const d = parseInt(wordMatch[1], 10);
    const mon = MONTH_WORDS[wordMatch[2]];
    if (mon !== undefined && d >= 1 && d <= 31) {
      let dt = new Date(year, mon, d);
      if (!yearMatch) {
        const today = startOfDayLocal(new Date());
        if (startOfDayLocal(dt) < today) dt = new Date(year + 1, mon, d);
      }
      return dt;
    }
  }

  const d = parseInt(ev.day, 10);
  const mon = monthAbbrToIndex(ev.month || '');
  if (!Number.isFinite(d) || d < 1 || d > 31 || mon === null) return null;

  let dt = new Date(year, mon, d);
  if (!yearMatch) {
    const today = startOfDayLocal(new Date());
    if (startOfDayLocal(dt) < today) dt = new Date(year + 1, mon, d);
  }
  return dt;
}

export function isUpcomingEvent(ev: Evento): boolean {
  const dt = getEventDate(ev);
  if (!dt) return false;
  const today = startOfDayLocal(new Date());
  const eventDay = startOfDayLocal(dt);
  return eventDay >= today;
}

/** El próximo evento por fecha (entre los que tienen fecha interpretable y son ≥ hoy). */
export function pickEarliestUpcoming(eventos: Evento[]): Evento | null {
  const upcoming = eventos.filter(isUpcomingEvent);
  if (upcoming.length === 0) return null;
  upcoming.sort((a, b) => {
    const da = getEventDate(a)?.getTime() ?? Number.MAX_SAFE_INTEGER;
    const db = getEventDate(b)?.getTime() ?? Number.MAX_SAFE_INTEGER;
    return da - db;
  });
  return upcoming[0];
}
