/**
 * Utilidades y tipo de entrada para **generar HTML** de campañas.
 */
import type { EmailCampaignEstadoId } from './emailCampaignTypes';
import { emojiForEstado, labelForEstado } from './emailCampaignTypes';
import type { PlatformTemplateData } from './emailTemplateTypes';

export type { PlatformFeatureBlock, PlatformTemplateData } from './emailTemplateTypes';
export { defaultPlatformData } from './emailTemplateTypes';

export interface EmailTemplateBuildInput {
  tituloInterno: string;
  asunto: string;
  /** Plantillas de evento */
  estado: EmailCampaignEstadoId;
  flyerUrl: string;
  textoPrincipal: string;
  fecha: string;
  hora: string;
  lugar: string;
  orador: string;
  ctaUrl: string;
  /** Plantilla «Novedades plataforma» */
  platform: PlatformTemplateData;
}

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

export function splitOrador(orador: string): { name: string; role: string } {
  const t = orador.trim();
  if (!t) return { name: '', role: '' };
  const i = t.indexOf(',');
  if (i === -1) return { name: t, role: '' };
  return { name: t.slice(0, i).trim(), role: t.slice(i + 1).trim() };
}

export function eventTitleFrom(input: EmailTemplateBuildInput): string {
  return input.tituloInterno.trim() || input.asunto.trim() || 'Evento Xplora';
}

export function badgeParts(estado: EmailCampaignEstadoId): { emoji: string; text: string } {
  return { emoji: emojiForEstado(estado), text: labelForEstado(estado) };
}

export function fechaCortaYLarga(fecha: string): { corta: string; larga: string } {
  const t = fecha.trim();
  if (!t) return { corta: '—', larga: '—' };
  const lines = t.split(/\r?\n+/).map(l => l.trim()).filter(Boolean);
  if (lines.length >= 2) {
    return { corta: lines[0]!, larga: lines.slice(1).join(' ') };
  }
  return { corta: t, larga: t };
}
