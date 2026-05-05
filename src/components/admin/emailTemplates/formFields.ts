/**
 * Qué campos del editor de campaña muestra cada plantilla (`EmailCampaignEditor`).
 * Al agregar una plantilla nueva, definí acá su subset y copiá los ids al servidor si aplica.
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
  /** Campos visibles; si falta una clave, se considera false. */
  show: Partial<Record<EmailCampaignFormField, boolean>>;
  /**
   * Si true: un solo campo "Cuándo y dónde" que escribe en `fecha` (hora/lugar ocultos y vacíos en el estado).
   * El HTML del aviso arma una línea con fecha (+ hora/lugar si existieran; en combo solo fecha).
   */
  fechaCuandoDondeCombo: boolean;
  hintTextoPrincipal?: string;
  /** Solo editorial: ayuda del campo fecha multilínea */
  hintFecha?: string;
  /** Fecha en textarea (varias líneas: corta + larga); hora y lugar aparte. */
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

/** Como classic pero sin CTA (el layout clásico no usa link de botón). */
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
  /** Aviso simple: sin orador ni fecha/hora/lugar separados; una línea para cuándo/dónde. */
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
      'Cuerpo del mail (saludo “Hola nombre” lo inserta n8n). Podés usar varios párrafos separados por línea en blanco.',
    hintFecha:
      'Primera línea = texto corto en la franja violeta; líneas siguientes = fecha larga en el bloque gris (📅).',
  },
  palatino_event: {
    show: FULL,
    fechaCuandoDondeCombo: false,
    fechaAsTextarea: true,
    hintTextoPrincipal:
      'Texto grande bajo el saludo (n8n reemplaza el nombre). Saltos de línea se respetan.',
    hintFecha:
      'Primera línea = “Cuándo y dónde” destacado; líneas siguientes = bloque detalle con 📅.',
  },
  verdana_invite: {
    show: FULL,
    fechaCuandoDondeCombo: false,
    fechaAsTextarea: true,
    hintTextoPrincipal:
      'Cuerpo del correo en la tarjeta blanca (debajo del saludo con nombre desde n8n).',
    hintFecha:
      'La primera línea es la fecha grande en el bloque oscuro; podés agregar líneas extra como nota (no se muestran en esta plantilla).',
  },
};

export function templateFormConfig(id: EmailTemplateId): TemplateFormConfig {
  return TEMPLATE_FORM_CONFIG[id];
}

export function showCampaignField(
  id: EmailCampaignFormField,
  templateId: EmailTemplateId,
): boolean {
  const { show } = templateFormConfig(templateId);
  return show[id] === true;
}
