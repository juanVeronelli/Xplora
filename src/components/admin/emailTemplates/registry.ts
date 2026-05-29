/**
 * Registro central de plantillas de email.
 */
import type { EmailTemplateBuildInput } from '../emailTemplateInput';
import { buildClassicNewsletterHtml } from '../emailTemplateClassicHtml';
import { buildEditorialEventHtml } from '../emailTemplateEditorialHtml';
import { buildMinimalNoticeHtml } from '../emailTemplateMinimalHtml';
import { buildPlatformHtml } from '../emailTemplatePlatformHtml';

export const EMAIL_TEMPLATE_BUILDERS = {
  classic_event: buildClassicNewsletterHtml,
  minimal_notice: buildMinimalNoticeHtml,
  editorial_event: buildEditorialEventHtml,
  platform_features: buildPlatformHtml,
} as const;

export type EmailTemplateId = keyof typeof EMAIL_TEMPLATE_BUILDERS;

export const EMAIL_TEMPLATE_OPTIONS: { id: EmailTemplateId; label: string; description: string }[] = [
  {
    id: 'classic_event',
    label: 'Evento (layout completo)',
    description: '600px, flyer, bloque de fecha, recordatorios y pie con imagen.',
  },
  {
    id: 'minimal_notice',
    label: 'Aviso simple',
    description: 'Texto corto, badge, cuándo/dónde en una línea e imagen opcional.',
  },
  {
    id: 'editorial_event',
    label: 'Evento editorial',
    description: 'Flyer, speaker, franja violeta, cuerpo y botón CTA.',
  },
  {
    id: 'platform_features',
    label: 'Novedades plataforma',
    description:
      'Hero violeta, 3 bloques destacados, aviso amarillo y CTA. Responsive (móvil y desktop).',
  },
];

export const DEFAULT_EMAIL_TEMPLATE_ID: EmailTemplateId = 'classic_event';

export function buildEmailHtmlForTemplate(id: EmailTemplateId, input: EmailTemplateBuildInput): string {
  return EMAIL_TEMPLATE_BUILDERS[id](input);
}

export function isEmailTemplateId(s: string): s is EmailTemplateId {
  return s in EMAIL_TEMPLATE_BUILDERS;
}
