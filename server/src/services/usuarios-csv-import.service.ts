/**
 * Import CSV de usuarios → upsert en `public.usuarios` (normaliza email, nombre, carrera, flags).
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import { BadRequestError } from '../http/errors/http-error.js';
import * as XLSX from 'xlsx';

type ParsedUsuarioCsvRow = {
  email: string;
  nombre?: string;
  carrera?: string;
  es_alumno_cema?: boolean | null;
  suscrito_newsletter?: boolean | null;
};

function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

function normalizeNombre(raw: string | undefined): string | null {
  const t = (raw ?? '').trim();
  return t ? t : null;
}

function normalizeCarrera(raw: string | undefined): string | null {
  const t = (raw ?? '').trim();
  return t ? t : null;
}

function parseBooleanLike(raw: string): boolean | null {
  const t = raw.trim().toLowerCase();
  if (!t) return null;
  if (['1', 'true', 't', 'yes', 'y', 'si', 'sí'].includes(t)) return true;
  if (['0', 'false', 'f', 'no', 'n'].includes(t)) return false;
  return null;
}

function splitCsvLine(line: string): string[] {
  // CSV simple: soporta comillas dobles y comas.
  const out: string[] = [];
  let cur = '';
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]!;
    if (ch === '"') {
      const next = line[i + 1];
      if (inQ && next === '"') {
        cur += '"';
        i++;
      } else {
        inQ = !inQ;
      }
      continue;
    }
    if (ch === ',' && !inQ) {
      out.push(cur);
      cur = '';
      continue;
    }
    cur += ch;
  }
  out.push(cur);
  return out;
}

function normalizeHeader(h: string): string {
  return h
    .trim()
    .toLowerCase()
    .replace(/\u00a0/g, ' ')
    .replace(/[^\p{L}\p{N}\s_@.-]+/gu, '')
    .replace(/\s+/g, '_');
}

function mapRow(headers: string[], cells: string[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (let i = 0; i < headers.length; i++) {
    const k = headers[i]!;
    out[k] = (cells[i] ?? '').trim();
  }
  return out;
}

function isLikelyXlsx(buf: Buffer, filename?: string): boolean {
  const name = (filename ?? '').toLowerCase();
  if (name.endsWith('.xlsx') || name.endsWith('.xls')) return true;
  // ZIP magic for xlsx: PK..
  return buf.length >= 2 && buf[0] === 0x50 && buf[1] === 0x4b;
}

const EMAIL_HEADERS = new Set([
  'email',
  'e-mail',
  'mail',
  'correo',
  'correo_electronico',
  'correo_electrónico',
  'email_address',
  'emailaddress',
  'mail_address',
  'e_mail',
]);

export function parseUsuariosFileBuffer(
  buf: Buffer,
  opts?: { filename?: string },
): { rows: ParsedUsuarioCsvRow[]; warnings: string[] } {
  if (isLikelyXlsx(buf, opts?.filename)) {
    return parseUsuariosXlsxBuffer(buf);
  }
  return parseUsuariosCsvBuffer(buf);
}

export function parseUsuariosCsvBuffer(buf: Buffer): { rows: ParsedUsuarioCsvRow[]; warnings: string[] } {
  const text = buf.toString('utf8').replace(/^\uFEFF/, '');
  const lines = text.split(/\r?\n/).map(l => l.trimEnd()).filter(l => l.trim().length > 0);
  if (lines.length === 0) return { rows: [], warnings: [] };

  const headersRaw = splitCsvLine(lines[0]!);
  const headers = headersRaw.map(normalizeHeader);

  const idxEmail = headers.findIndex(h => EMAIL_HEADERS.has(h));
  if (idxEmail < 0) throw new BadRequestError('Archivo inválido: falta columna email.');

  const warnings: string[] = [];
  const rows: ParsedUsuarioCsvRow[] = [];
  const seen = new Set<string>();

  for (let i = 1; i < lines.length; i++) {
    const cells = splitCsvLine(lines[i]!);
    const obj = mapRow(headers, cells);
    const emailRaw = obj[headers[idxEmail]!] ?? '';
    const email = normalizeEmail(emailRaw);
    if (!email || !email.includes('@')) {
      warnings.push(`Línea ${i + 1}: email inválido («${emailRaw}»).`);
      continue;
    }
    if (seen.has(email)) continue;
    seen.add(email);

    const esAlumno = obj['es_alumno_cema'] ?? obj['alumno_ucema'] ?? obj['ucema'] ?? '';
    const suscrito = obj['suscrito_newsletter'] ?? obj['newsletter'] ?? '';

    rows.push({
      email,
      nombre: obj['nombre'] ?? obj['name'],
      carrera: obj['carrera'] ?? obj['career'],
      es_alumno_cema: esAlumno ? parseBooleanLike(esAlumno) : null,
      suscrito_newsletter: suscrito ? parseBooleanLike(suscrito) : null,
    });
  }

  return { rows, warnings };
}

export function parseUsuariosXlsxBuffer(buf: Buffer): { rows: ParsedUsuarioCsvRow[]; warnings: string[] } {
  const wb = XLSX.read(buf, { type: 'buffer' });
  const sheetName = wb.SheetNames[0];
  if (!sheetName) return { rows: [], warnings: ['XLSX: no hay hojas.'] };
  const ws = wb.Sheets[sheetName];
  if (!ws) return { rows: [], warnings: ['XLSX: hoja vacía.'] };

  const matrix = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false }) as unknown[][];
  const headerRow = (matrix[0] as unknown[] | undefined) ?? [];
  const headers = headerRow.map(x => normalizeHeader(String(x ?? '')));
  const idxEmail = headers.findIndex(h => EMAIL_HEADERS.has(h));
  if (idxEmail < 0) throw new BadRequestError('XLSX inválido: falta columna email.');

  const warnings: string[] = [];
  const rows: ParsedUsuarioCsvRow[] = [];
  const seen = new Set<string>();

  for (let r = 1; r < matrix.length; r++) {
    const row = (matrix[r] as unknown[] | undefined) ?? [];
    const emailRaw = String(row[idxEmail] ?? '').trim();
    const email = normalizeEmail(emailRaw);
    if (!email || !email.includes('@')) {
      if (emailRaw) warnings.push(`Fila ${r + 1}: email inválido («${emailRaw}»).`);
      continue;
    }
    if (seen.has(email)) continue;
    seen.add(email);

    const obj = mapRow(headers, row.map(x => String(x ?? '')));
    const esAlumno = obj['es_alumno_cema'] ?? obj['alumno_ucema'] ?? obj['ucema'] ?? '';
    const suscrito = obj['suscrito_newsletter'] ?? obj['newsletter'] ?? '';

    rows.push({
      email,
      nombre: obj['nombre'] ?? obj['name'],
      carrera: obj['carrera'] ?? obj['career'],
      es_alumno_cema: esAlumno ? parseBooleanLike(esAlumno) : null,
      suscrito_newsletter: suscrito ? parseBooleanLike(suscrito) : null,
    });
  }

  return { rows, warnings };
}

export async function upsertUsuariosFromCsv(
  sb: SupabaseClient,
  rows: ParsedUsuarioCsvRow[],
): Promise<{ upserted: number; inserted: number; updated: number }> {
  if (rows.length === 0) return { upserted: 0, inserted: 0, updated: 0 };

  // Pre-carga existentes por email para contar inserts/updates
  const emails = rows.map(r => r.email);
  const { data: existing, error: exErr } = await sb
    .from('usuarios')
    .select('id, email')
    .in('email', emails);
  if (exErr) throw new BadRequestError(exErr.message);
  const existingSet = new Set(((existing as { email: string }[] | null) ?? []).map(r => (r.email ?? '').toLowerCase()));

  const payload = rows.map(r => ({
    email: normalizeEmail(r.email),
    nombre: normalizeNombre(r.nombre) ?? undefined,
    carrera: normalizeCarrera(r.carrera) ?? undefined,
    es_alumno_cema: r.es_alumno_cema ?? undefined,
    suscrito_newsletter: r.suscrito_newsletter ?? true,
  }));

  const { error } = await sb.from('usuarios').upsert(payload, { onConflict: 'email' });
  if (error) throw new BadRequestError(error.message);

  const inserted = rows.filter(r => !existingSet.has(r.email)).length;
  const updated = rows.length - inserted;
  return { upserted: rows.length, inserted, updated };
}

