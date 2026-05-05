/**
 * Parseo de CSV exportado desde Luma (invitados) y clasificación de estado.
 * No usa API de Luma: solo archivo subido por el admin.
 */

const EMAIL_HEADERS = ['email', 'e-mail', 'correo', 'mail'];
/** Export típico Luma: `name` o first + last. */
const NAME_HEADERS = ['name', 'nombre', 'full name', 'fullname'];
const FIRST_NAME_HEADERS = ['first_name', 'firstname'];
const LAST_NAME_HEADERS = ['last_name', 'lastname'];
/** Si hay timestamp, la persona pasó por check-in (QR) en Luma. */
const CHECKED_IN_AT_HEADERS = ['checked_in_at', 'checkedinat', 'checked_in'];
const APPROVAL_HEADERS = ['approval_status', 'approvalstatus'];
const STATUS_HEADERS = ['status', 'estado', 'ticket status', 'registration status', 'estado del ticket', 'ticket'];

export type LumaRowKind = 'checked_in' | 'going' | 'other';

export interface ParsedLumaGuest {
  email: string;
  nombre: string;
  kind: LumaRowKind;
}

function stripBom(s: string): string {
  return s.charCodeAt(0) === 0xfeff ? s.slice(1) : s;
}

/** Quita acentos para comparar estados en español/inglés. */
function fold(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '');
}

/**
 * Registrado / Checked in en Luma ≈ escanearon QR en puerta.
 * Asistiré / Going ≈ RSVP sí, aún sin check-in.
 */
export function classifyLumaStatus(raw: string): LumaRowKind {
  const f = fold(raw);
  if (!f) return 'other';

  const checkedPhrases = [
    'registrado',
    'checked in',
    'check-in',
    'check in',
    'attended',
    'asistio',
    'ingreso',
    'admitted',
  ];
  if (checkedPhrases.some(p => f.includes(p))) return 'checked_in';

  const goingPhrases = [
    'asistire',
    'going',
    'approved',
    'confirmado',
    'confirmada',
    'invited',
  ];
  if (goingPhrases.some(p => f.includes(p))) return 'going';

  if (f === 'yes' || f === 'si') return 'going';

  return 'other';
}

function parseDelimitedLine(line: string, delimiter: string): string[] {
  const out: string[] = [];
  let cur = '';
  let i = 0;
  let inQ = false;
  while (i < line.length) {
    const c = line[i];
    if (inQ) {
      if (c === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i += 2;
          continue;
        }
        inQ = false;
        i += 1;
        continue;
      }
      cur += c;
      i += 1;
      continue;
    }
    if (c === '"') {
      inQ = true;
      i += 1;
      continue;
    }
    if (c === delimiter) {
      out.push(cur.trim());
      cur = '';
      i += 1;
      continue;
    }
    cur += c;
    i += 1;
  }
  out.push(cur.trim());
  return out;
}

function detectDelimiter(headerLine: string): ',' | ';' | '\t' {
  const commas = (headerLine.match(/,/g) ?? []).length;
  const semis = (headerLine.match(/;/g) ?? []).length;
  const tabs = (headerLine.match(/\t/g) ?? []).length;
  if (tabs >= commas && tabs >= semis && tabs > 0) return '\t';
  if (semis > commas) return ';';
  return ',';
}

function splitCsvRows(text: string): string[] {
  const rows: string[] = [];
  let cur = '';
  let i = 0;
  let inQ = false;
  while (i < text.length) {
    const c = text[i];
    if (inQ) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          cur += '"';
          i += 2;
          continue;
        }
        inQ = false;
        i += 1;
        continue;
      }
      cur += c;
      i += 1;
      continue;
    }
    if (c === '"') {
      inQ = true;
      i += 1;
      continue;
    }
    if (c === '\n') {
      rows.push(cur);
      cur = '';
      i += 1;
      continue;
    }
    if (c === '\r') {
      if (text[i + 1] === '\n') {
        rows.push(cur);
        cur = '';
        i += 2;
        continue;
      }
      rows.push(cur);
      cur = '';
      i += 1;
      continue;
    }
    cur += c;
    i += 1;
  }
  if (cur.length || rows.length === 0) rows.push(cur);
  return rows.filter(r => r.trim() !== '');
}

function normalizeHeader(h: string): string {
  return fold(h).replace(/[^a-z0-9]/g, '');
}

function findColIndex(headers: string[], aliases: string[]): number {
  const normalized = headers.map(normalizeHeader);
  const aliasNorm = aliases.map(a => normalizeHeader(a));
  for (const a of aliasNorm) {
    const idx = normalized.findIndex(h => h === a || h.endsWith(a) || h.includes(a));
    if (idx >= 0) return idx;
  }
  return -1;
}

function isEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());
}

function buildNombre(cells: string[], nameIdx: number, firstIdx: number, lastIdx: number): string {
  if (nameIdx >= 0) {
    const n = cells[nameIdx]?.trim() ?? '';
    if (n) return n;
  }
  const a = firstIdx >= 0 ? (cells[firstIdx]?.trim() ?? '') : '';
  const b = lastIdx >= 0 ? (cells[lastIdx]?.trim() ?? '') : '';
  return [a, b].filter(Boolean).join(' ').trim();
}

/** Declinados / cancelados: no los tratamos como inscriptos al evento. */
function isDeclinedApproval(raw: string): boolean {
  if (!raw.trim()) return false;
  const f = fold(raw);
  return f.includes('declin') || f.includes('cancel') || f.includes('rechaz');
}

export interface ParseLumaCsvResult {
  guests: ParsedLumaGuest[];
  warnings: string[];
  delimiter: string;
}

/** Une filas por email: check-in gana sobre RSVP. */
export function mergeGuestsByEmail(rows: ParsedLumaGuest[]): Map<string, ParsedLumaGuest> {
  const map = new Map<string, ParsedLumaGuest>();
  for (const r of rows) {
    const email = r.email.toLowerCase();
    const prev = map.get(email);
    if (!prev) {
      map.set(email, { ...r });
      continue;
    }
    const kind: LumaRowKind =
      prev.kind === 'checked_in' || r.kind === 'checked_in'
        ? 'checked_in'
        : prev.kind === 'going' || r.kind === 'going'
          ? 'going'
          : 'other';
    const nombre =
      (prev.nombre.trim() && prev.nombre) || (r.nombre.trim() && r.nombre) || prev.nombre || r.nombre;
    map.set(email, { email, nombre, kind });
  }
  return map;
}

export function parseLumaCsvFile(buffer: Buffer): ParseLumaCsvResult {
  const warnings: string[] = [];
  const text = stripBom(buffer.toString('utf8'));
  const rawRows = splitCsvRows(text);
  if (rawRows.length === 0) {
    return { guests: [], warnings: ['El archivo está vacío.'], delimiter: ',' };
  }

  const delim = detectDelimiter(rawRows[0]);
  const headerCells = parseDelimitedLine(rawRows[0], delim);
  const emailIdx = findColIndex(headerCells, EMAIL_HEADERS);
  const nameIdx = findColIndex(headerCells, NAME_HEADERS);
  const firstIdx = findColIndex(headerCells, FIRST_NAME_HEADERS);
  const lastIdx = findColIndex(headerCells, LAST_NAME_HEADERS);
  const checkedInIdx = findColIndex(headerCells, CHECKED_IN_AT_HEADERS);
  const approvalIdx = findColIndex(headerCells, APPROVAL_HEADERS);
  const statusIdx = findColIndex(headerCells, STATUS_HEADERS);

  if (emailIdx < 0) {
    warnings.push(
      'No encontré una columna de email (buscá «Email», «Correo», etc.). Revisá la primera fila del CSV.',
    );
    return { guests: [], warnings, delimiter: delim };
  }

  const guests: ParsedLumaGuest[] = [];
  for (let r = 1; r < rawRows.length; r++) {
    const cells = parseDelimitedLine(rawRows[r], delim);
    const emailRaw = cells[emailIdx]?.trim() ?? '';
    if (!emailRaw) continue;
    if (!isEmail(emailRaw)) {
      warnings.push(`Fila ${r + 1}: email inválido omitido (${emailRaw.slice(0, 40)}).`);
      continue;
    }
    const email = emailRaw.toLowerCase();

    const approvalRaw = approvalIdx >= 0 ? (cells[approvalIdx]?.trim() ?? '') : '';
    if (isDeclinedApproval(approvalRaw)) continue;

    const checkedRaw = checkedInIdx >= 0 ? (cells[checkedInIdx]?.trim() ?? '') : '';
    const statusRaw = statusIdx >= 0 ? (cells[statusIdx]?.trim() ?? '') : '';

    let kind: LumaRowKind;
    if (checkedRaw) {
      /** Luma: cualquier valor en `checked_in_at` (ISO) = check-in realizado. */
      kind = 'checked_in';
    } else if (statusRaw) {
      kind = classifyLumaStatus(statusRaw);
    } else if (approvalRaw && fold(approvalRaw).includes('wait')) {
      kind = 'going';
    } else {
      /** Lista de invitados Luma sin check-in aún → RSVP / aprobados. */
      kind = 'going';
    }

    const nombre = buildNombre(cells, nameIdx, firstIdx, lastIdx);

    guests.push({ email, nombre, kind });
  }

  if (checkedInIdx < 0 && statusIdx < 0) {
    warnings.push(
      'No encontré «checked_in_at» ni columna de estado: no podremos distinguir check-in automáticamente. Exportá el CSV de invitados desde Luma con columnas estándar.',
    );
  }

  return { guests, warnings, delimiter: delim };
}
