/**
 * Utilidades y tipo de entrada para **generar HTML** de campañas (vista previa y futuro envío).
 * - `split*`: el textarea “texto principal” se parte por bloques vacíos (`\n\n`) en intro / cuerpo / cierre.
 * - `splitOrador`: “Nombre, rol” separado por la primera coma.
 */
import type { EmailCampaignEstadoId } from './emailCampaignTypes';
import { emojiForEstado, labelForEstado } from './emailCampaignTypes';

/** Snapshot del formulario; lo consume `buildClassicNewsletterHtml` y el preview. */
export interface EmailTemplateBuildInput {
  tituloInterno: string;
  asunto: string;
  estado: EmailCampaignEstadoId;
  flyerUrl: string;
  textoPrincipal: string;
  fecha: string;
  hora: string;
  lugar: string;
  orador: string;
  /** Link del botón CTA (plantillas que lo usan, ej. editorial). */
  ctaUrl: string;
}

/**
 * Parte el texto largo del mail en tres bloques según párrafos separados por línea en blanco.
 * Un solo bloque → solo intro (cierre por defecto). Tres o más → último párrafo = cierre.
 */
export function splitBlocks(text: string): { intro: string; body: string; closing: string } {
  const t = text.trim();
  if (!t) {
    return { intro: '', body: '', closing: 'Te esperamos.' };
  }
  const parts = t.split(/\n\n+/).map(p => p.trim()).filter(Boolean);
  if (parts.length === 1) {
    return { intro: parts[0], body: '', closing: 'Te esperamos.' };
  }
  if (parts.length === 2) {
    return { intro: parts[0], body: parts[1], closing: 'Te esperamos.' };
  }
  const closing = parts[parts.length - 1];
  const intro = parts[0];
  const body = parts.slice(1, -1).join('\n\n');
  return { intro, body, closing };
}

/** Orador en formato "Nombre, cargo o empresa" → línea morada del template. */
export function splitOrador(orador: string): { name: string; role: string } {
  const t = orador.trim();
  if (!t) return { name: '', role: '' };
  const i = t.indexOf(',');
  if (i === -1) return { name: t, role: '' };
  return { name: t.slice(0, i).trim(), role: t.slice(i + 1).trim() };
}

/** Título para atributos `alt` / metadata: interno o asunto. */
export function eventTitleFrom(input: EmailTemplateBuildInput): string {
  return input.tituloInterno.trim() || input.asunto.trim() || 'Evento Xplora';
}

/** Contenido del chip ámbar (emoji + etiqueta legible). */
export function badgeParts(estado: EmailCampaignEstadoId): { emoji: string; text: string } {
  return { emoji: emojiForEstado(estado), text: labelForEstado(estado) };
}

/**
 * Primera línea de `fecha` → franja violeta; todo el texto (o líneas unidas) → bloque detalle.
 * Podés poner dos líneas: la primera corta para la barra y la segunda larga para el recordatorio.
 */
export function fechaCortaYLarga(fecha: string): { corta: string; larga: string } {
  const t = fecha.trim();
  if (!t) return { corta: '—', larga: '—' };
  const lines = t.split(/\r?\n+/).map(l => l.trim()).filter(Boolean);
  if (lines.length >= 2) {
    return { corta: lines[0]!, larga: lines.slice(1).join(' ') };
  }
  return { corta: t, larga: t };
}
