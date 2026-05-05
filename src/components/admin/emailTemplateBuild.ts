/**
 * Punto único de entrada para obtener el **HTML completo** del correo (documento listo para iframe/srcDoc o envío).
 */
import type { EmailTemplateBuildInput } from './emailTemplateInput';
import { buildEmailHtmlForTemplate, type EmailTemplateId } from './emailTemplates/registry';

export type { EmailTemplateId } from './emailTemplates/registry';
export { DEFAULT_EMAIL_TEMPLATE_ID } from './emailTemplates/registry';

/** Genera el HTML según la plantilla elegida (registro en `emailTemplates/registry.ts`). */
export function buildEmailHtml(templateId: EmailTemplateId, input: EmailTemplateBuildInput): string {
  return buildEmailHtmlForTemplate(templateId, input);
}
