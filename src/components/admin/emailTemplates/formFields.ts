/**
 * Qué campos del editor muestra cada plantilla.
 */
import type { EmailTemplateId } from './registry';

export type EmailCampaignFormField =
  | 'tituloInterno'
  | 'asunto'
  | 'estado'
  | 'flyer'
  | 'textoPrincipal'
  | 'fecha'
  | 'hora'
  | 'lugar'
  | 'orador'
  | 'ctaUrl';

export interface TemplateFormConfig {
  show: Partial<Record<EmailCampaignFormField, boolean>>;
  fechaCuandoDondeCombo: boolean;
  hintTextoPrincipal?: string;
  hintFecha?: string;
  fechaAsTextarea?: boolean;
}

const FULL: Record<EmailCampaignFormField, true> = {
  tituloInterno: true,
  asunto: true,
  estado: true,
  flyer: true,
  textoPrincipal: true,
  fecha: true,
  hora: true,
  lugar: true,
  orador: true,
  ctaUrl: true,
};

const FULL_NO_CTA: Record<EmailCampaignFormField, boolean> = {
  ...FULL,
  ctaUrl: false,
};

export const TEMPLATE_FORM_CONFIG: Record<EmailTemplateId, TemplateFormConfig> = {
  classic_event: {
    show: FULL_NO_CTA,
    fechaCuandoDondeCombo: false,
    fechaAsTextarea: false,
  },
  minimal_notice: {
    show: {
      tituloInterno: true,
      asunto: true,
      estado: true,
      flyer: true,
      textoPrincipal: true,
      fecha: true,
      hora: false,
      lugar: false,
      orador: false,
    },
    fechaCuandoDondeCombo: true,
    hintTextoPrincipal:
      'Intro, bloques con línea en blanco entre párrafos. En avisos cortos alcanza un solo bloque de texto.',
  },
  editorial_event: {
    show: FULL,
    fechaCuandoDondeCombo: false,
    fechaAsTextarea: true,
    hintTextoPrincipal:
      'Cuerpo del mail debajo del saludo fijo. Podés usar varios párrafos separados por línea en blanco.',
    hintFecha:
      'Primera línea = texto corto en la franja violeta; líneas siguientes = fecha larga en el bloque gris (📅).',
  },
  platform_features: {
    show: {
      tituloInterno: true,
      asunto: true,
      estado: false,
      flyer: false,
      textoPrincipal: false,
      fecha: false,
      hora: false,
      lugar: false,
      orador: false,
      ctaUrl: false,
    },
    fechaCuandoDondeCombo: false,
  },
};

export function templateFormConfig(id: EmailTemplateId): TemplateFormConfig {
  return TEMPLATE_FORM_CONFIG[id];
}

export function showCampaignField(id: EmailCampaignFormField, templateId: EmailTemplateId): boolean {
  return templateFormConfig(templateId).show[id] === true;
}

export function usesEventFormFields(templateId: EmailTemplateId): boolean {
  return templateId !== 'platform_features';
}
