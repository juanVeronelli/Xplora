/**
 * Campos de plantillas de evento (classic, minimal, editorial).
 */
import ThumbnailUpload from './ThumbnailUpload';
import type { EmailCampaignEstadoId } from './emailCampaignTypes';
import { EMAIL_CAMPAIGN_ESTADO_OPTIONS } from './emailCampaignTypes';
import type { EmailTemplateId } from './emailTemplates/registry';
import { showCampaignField, templateFormConfig, usesEventFormFields } from './emailTemplates/formFields';
import { Field, FormSection, Sel, TA, ThreeCol, TwoCol } from './crm/CrmUi';

type Props = {
  templateId: EmailTemplateId;
  estado: EmailCampaignEstadoId;
  onEstadoChange: (v: EmailCampaignEstadoId) => void;
  flyerUrl: string;
  onFlyerUrlChange: (v: string) => void;
  textoPrincipal: string;
  onTextoPrincipalChange: (v: string) => void;
  fecha: string;
  onFechaChange: (v: string) => void;
  hora: string;
  onHoraChange: (v: string) => void;
  lugar: string;
  onLugarChange: (v: string) => void;
  orador: string;
  onOradorChange: (v: string) => void;
  ctaUrl: string;
  onCtaUrlChange: (v: string) => void;
};

export default function EmailCampaignEventFields(props: Props) {
  const { templateId } = props;
  if (!usesEventFormFields(templateId)) return null;

  const formConf = templateFormConfig(templateId);

  return (
    <FormSection title="Contenido · Evento">
      {showCampaignField('estado', templateId) ? (
        <Sel
          label="Estado (badge en el mail)"
          hint="Solo afecta la vista previa; no se guarda en campanias_email."
          value={props.estado}
          onChange={v => props.onEstadoChange(v as EmailCampaignEstadoId)}
          options={EMAIL_CAMPAIGN_ESTADO_OPTIONS.map(o => ({ value: o.value, label: o.label }))}
        />
      ) : null}
      {showCampaignField('flyer', templateId) ? (
        <ThumbnailUpload
          label="Flyer"
          hint={
            formConf.fechaCuandoDondeCombo
              ? 'Opcional. Si subís una imagen, aparece debajo del texto en el aviso.'
              : 'Imagen principal del correo (banner o afiche).'
          }
          value={props.flyerUrl}
          onChange={props.onFlyerUrlChange}
        />
      ) : null}
      {showCampaignField('textoPrincipal', templateId) ? (
        <TA
          label="Texto principal"
          hint={
            formConf.hintTextoPrincipal ??
            'Primera parte = saludo de cuerpo; podés agregar bloques separados por una línea en blanco: intro, desarrollo y párrafo final.'
          }
          value={props.textoPrincipal}
          onChange={props.onTextoPrincipalChange}
          rows={formConf.fechaCuandoDondeCombo ? 5 : 6}
          placeholder={
            formConf.fechaCuandoDondeCombo
              ? 'Ejemplo:\nHola,\n\nTe contamos una novedad importante para la comunidad.\n\nSaludos.'
              : 'Ejemplo:\nTe escribimos para contarte que…\n\nVan a participar referentes de…\n\nTe esperamos.'
          }
        />
      ) : null}
      {showCampaignField('fecha', templateId) && formConf.fechaCuandoDondeCombo ? (
        <Field
          label="Cuándo y dónde"
          hint="Una línea o párrafo corto: fecha, hora, lugar o link (lo que aplique al aviso)."
          value={props.fecha}
          onChange={props.onFechaChange}
          placeholder="Ej.: 20 de mayo de 2026 · 18:30 hs · Auditorio UCEMA"
        />
      ) : null}
      {showCampaignField('fecha', templateId) && !formConf.fechaCuandoDondeCombo ? (
        formConf.fechaAsTextarea ? (
          <>
            <TA
              label="Fecha"
              hint={formConf.hintFecha ?? 'Primera línea corta · siguientes = detalle'}
              value={props.fecha}
              onChange={props.onFechaChange}
              rows={3}
              placeholder={'15 MAY\n15 de mayo de 2026'}
            />
            <TwoCol>
              <Field label="Hora" hint="Ej. 18:30 hs" value={props.hora} onChange={props.onHoraChange} placeholder="18:30 hs" />
              <Field label="Lugar" value={props.lugar} onChange={props.onLugarChange} placeholder="Auditorio / Zoom" />
            </TwoCol>
          </>
        ) : (
          <ThreeCol>
            <Field
              label="Fecha"
              hint="Texto libre, ej. 15 de mayo de 2026"
              value={props.fecha}
              onChange={props.onFechaChange}
              placeholder="15 de mayo de 2026"
            />
            <Field label="Hora" hint="Ej. 18:30 hs" value={props.hora} onChange={props.onHoraChange} placeholder="18:30 hs" />
            <Field label="Lugar" value={props.lugar} onChange={props.onLugarChange} placeholder="Auditorio / Zoom" />
          </ThreeCol>
        )
      ) : null}
      {showCampaignField('orador', templateId) ? (
        <Field
          label="Orador"
          hint="Opcional. Formato sugerido: Nombre, Rol o empresa. Si no aplica, dejalo vacío."
          value={props.orador}
          onChange={props.onOradorChange}
          placeholder="María Pérez, CEO de ACME"
        />
      ) : null}
      {showCampaignField('ctaUrl', templateId) ? (
        <Field
          label="Link del botón «Reservá tu lugar»"
          hint="URL de inscripción o landing. Si queda vacío, el botón apunta a # en la vista previa."
          value={props.ctaUrl}
          onChange={props.onCtaUrlChange}
          type="url"
          placeholder="https://…"
        />
      ) : null}
    </FormSection>
  );
}
