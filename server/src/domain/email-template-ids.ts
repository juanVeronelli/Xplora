/**
 * Ids de plantilla alineados con `src/components/admin/emailTemplates/registry.ts`.
 * El servidor valida el POST para no guardar strings arbitrarios en BD.
 */
export const EMAIL_TEMPLATE_IDS = [
  'classic_event',
  'minimal_notice',
  'editorial_event',
  'palatino_event',
  'verdana_invite',
] as const;
export type EmailTemplateId = (typeof EMAIL_TEMPLATE_IDS)[number];
export const DEFAULT_EMAIL_TEMPLATE_ID: EmailTemplateId = 'classic_event';

const SET = new Set<string>(EMAIL_TEMPLATE_IDS);

export function isValidEmailTemplateId(s: string): s is EmailTemplateId {
  return SET.has(s);
}
