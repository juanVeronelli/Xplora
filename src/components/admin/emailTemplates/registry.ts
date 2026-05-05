/**
 * Registro central de **plantillas de email**: id estable, etiqueta en UI y función que arma el HTML.
 * Para agregar una nueva: 1) crear `emailTemplateXxxHtml.ts` con `buildXxx`, 2) sumarla a `EMAIL_TEMPLATE_BUILDERS` y a `EMAIL_TEMPLATE_OPTIONS`.
 */
import type { EmailTemplateBuildInput } from '../emailTemplateInput';
import { buildClassicNewsletterHtml } from '../emailTemplateClassicHtml';
import { buildEditorialEventHtml } from '../emailTemplateEditorialHtml';
import { buildMinimalNoticeHtml } from '../emailTemplateMinimalHtml';
import { buildPalatinoEventHtml } from '../emailTemplatePalatinoHtml';
import { buildVerdanaInviteHtml } from '../emailTemplateVerdanaHtml';

export const EMAIL_TEMPLATE_BUILDERS = {
  classic_event: buildClassicNewsletterHtml,
  minimal_notice: buildMinimalNoticeHtml,
  editorial_event: buildEditorialEventHtml,
  palatino_event: buildPalatinoEventHtml,
  verdana_invite: buildVerdanaInviteHtml,
} as const;

export type EmailTemplateId = keyof typeof EMAIL_TEMPLATE_BUILDERS;

export const EMAIL_TEMPLATE_OPTIONS: { id: EmailTemplateId; label: string; description: string }[] = [
  {
    id: 'classic_event',
    label: 'Evento (layout completo)',
    description: '600px, flyer, bloque de fecha, recordatorios y pie con imagen (boceto Xplora).',
  },
  {
    id: 'minimal_notice',
    label: 'Aviso simple',
    description:
      'Solo pide título, asunto, badge, texto, cuándo/dónde (una línea) e imagen opcional. Se mantiene al sumar más plantillas.',
  },
  {
    id: 'editorial_event',
    label: 'Evento editorial',
    description:
      'Flyer, speaker destacado, franja violeta, cuerpo y botón CTA. Fecha: 1ª línea corta en la barra; siguientes líneas = detalle.',
  },
  {
    id: 'palatino_event',
    label: 'Evento Palatino (oscuro)',
    description:
      'Fondo #1a1535, tipografía serif, intro grande y flyer con sombra. Mismos campos que editorial (fecha multilínea + CTA).',
  },
  {
    id: 'verdana_invite',
    label: 'Invitación Verdana (lavanda)',
    description:
      'Titular con nombre del speaker, tarjeta blanca y bloque oscuro con fecha/hora/lugar. Primera línea de Fecha = titular grande del recuadro.',
  },
];

export const DEFAULT_EMAIL_TEMPLATE_ID: EmailTemplateId = 'classic_event';

export function buildEmailHtmlForTemplate(id: EmailTemplateId, input: EmailTemplateBuildInput): string {
  return EMAIL_TEMPLATE_BUILDERS[id](input);
}

export function isEmailTemplateId(s: string): s is EmailTemplateId {
  return s in EMAIL_TEMPLATE_BUILDERS;
}
