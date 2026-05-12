/**
 * Editor de **campañas de email** (pestaña Campañas): formulario + vista previa HTML en vivo.
 * Las plantillas viven en `emailTemplates/registry.ts`. El envío es por Resend en segundo plano (`POST .../dispatch/start` + polling).
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { authFetch, readApiError } from '../../lib/serverApi';
import ThumbnailUpload from './ThumbnailUpload';
import EmailHtmlLivePreview from './EmailHtmlLivePreview';
import {
  CrmSection,
  Field,
  TA,
  Sel,
  ThreeCol,
  TwoCol,
  FormSection,
  useMediaQuery,
} from './crm/CrmUi';
import { crm } from './crm/crmTheme';
import { useToast } from '../../context/FeedbackContext';
import type { ContactListSummary } from '../../types';
import type { EmailCampaignEstadoId } from './emailCampaignTypes';
import { EMAIL_CAMPAIGN_ESTADO_OPTIONS } from './emailCampaignTypes';
import type { EmailTemplateBuildInput } from './emailTemplateInput';
import {
  buildEmailHtmlForTemplate,
  DEFAULT_EMAIL_TEMPLATE_ID,
  EMAIL_TEMPLATE_OPTIONS,
  type EmailTemplateId,
} from './emailTemplates/registry';
import { showCampaignField, templateFormConfig } from './emailTemplates/formFields';

const DISPATCH_LS_KEY = 'xplora_email_dispatch_job_v1';

export type DispatchJobState = {
  jobId: string | null;
  status: 'queued' | 'running' | 'completed' | 'failed';
  campaignId: string;
  total: number;
  skipped_already_sent: number;
  attempted: number;
  sent: number;
  failed: { email: string; error: string; usuario_id: string }[];
  current_email: string | null;
  from: string;
  message?: string;
};

async function fetchDispatchJobStatus(jobId: string): Promise<DispatchJobState | null> {
  const res = await authFetch(`/api/admin/email-campaign-dispatch/jobs/${jobId}`);
  if (!res.ok) return null;
  return (await res.json()) as DispatchJobState;
}

export type EmailCampaignEditorProps = {
  /** Sin tarjeta `CrmSection` (cuando el hub Email ya muestra intro / pestañas). */
  bare?: boolean;
};

export default function EmailCampaignEditor({ bare = false }: EmailCampaignEditorProps) {
  const toast = useToast();
  const wide = useMediaQuery('(min-width: 960px)');
  const [saving, setSaving] = useState(false);
  const [lastCampaignId, setLastCampaignId] = useState<string | null>(null);
  const [listsLoading, setListsLoading] = useState(true);
  const [lists, setLists] = useState<ContactListSummary[]>([]);
  // '__ALL__' = audiencia dinámica: todos los usuarios actuales en la base.
  const [contactListId, setContactListId] = useState<'__ALL__' | string>('__ALL__');

  const [tituloInterno, setTituloInterno] = useState('');
  const [asunto, setAsunto] = useState('');
  const [templateId, setTemplateId] = useState<EmailTemplateId>(DEFAULT_EMAIL_TEMPLATE_ID);
  const [estado, setEstado] = useState<EmailCampaignEstadoId>('nuevo_evento');
  const [flyerUrl, setFlyerUrl] = useState('');
  const [textoPrincipal, setTextoPrincipal] = useState('');
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('');
  const [lugar, setLugar] = useState('');
  const [orador, setOrador] = useState('');
  const [ctaUrl, setCtaUrl] = useState('');

  const [dispatchJob, setDispatchJob] = useState<DispatchJobState | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevStatusRef = useRef<string | null>(null);

  const clearPoll = () => {
    if (pollRef.current !== null) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  const startPolling = (jobId: string) => {
    clearPoll();
    const tick = async () => {
      const data = await fetchDispatchJobStatus(jobId);
      if (!data) {
        clearPoll();
        window.localStorage.removeItem(DISPATCH_LS_KEY);
        setDispatchJob(null);
        toast.error('No se pudo consultar el estado del envío.');
        return;
      }
      setDispatchJob(data);
      const prev = prevStatusRef.current;
      if (data.status === 'completed' && prev !== 'completed') {
        const failed = data.failed?.length ?? 0;
        const skipped = data.skipped_already_sent ?? 0;
        const from = data.from ? ` · desde ${data.from}` : '';
        if (failed > 0) {
          const reasons = data.failed
            .slice(0, 3)
            .map((f) => (f.error ? `${f.email}: ${f.error}` : f.email))
            .join(' · ');
          toast.error(`Envío terminado${from}. Enviados: ${data.sent}. Fallaron ${failed}: ${reasons}`);
        } else {
          toast.success(
            `Listo: ${data.sent} correos${from}.${skipped ? ` ${skipped} ya figuraban como enviados.` : ''}`.trim(),
          );
        }
        window.localStorage.removeItem(DISPATCH_LS_KEY);
        clearPoll();
      }
      if (data.status === 'failed' && prev !== 'failed') {
        toast.error(data.message ?? 'El envío falló en el servidor.');
        window.localStorage.removeItem(DISPATCH_LS_KEY);
        clearPoll();
      }
      prevStatusRef.current = data.status;
    };
    void tick();
    pollRef.current = setInterval(() => void tick(), 2000);
  };

  useEffect(() => {
    const raw = window.localStorage.getItem(DISPATCH_LS_KEY);
    if (!raw) return;
    let cancelled = false;
    void (async () => {
      try {
        const { jobId } = JSON.parse(raw) as { jobId?: string };
        if (!jobId) {
          window.localStorage.removeItem(DISPATCH_LS_KEY);
          return;
        }
        const st = await fetchDispatchJobStatus(jobId);
        if (cancelled || !st) {
          if (!st) window.localStorage.removeItem(DISPATCH_LS_KEY);
          return;
        }
        setDispatchJob(st);
        if (st.jobId && (st.status === 'queued' || st.status === 'running')) {
          prevStatusRef.current = st.status;
          startPolling(jobId);
        } else {
          window.localStorage.removeItem(DISPATCH_LS_KEY);
        }
      } catch {
        window.localStorage.removeItem(DISPATCH_LS_KEY);
      }
    })();
    return () => {
      cancelled = true;
      clearPoll();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reanudar solo al montar; toast estable en la práctica
  }, []);

  const formConf = templateFormConfig(templateId);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setListsLoading(true);
      const res = await authFetch('/api/admin/contact-lists/mine');
      if (cancelled) return;
      if (!res.ok) {
        // No bloquea redactar: solo deshabilita selector.
        setLists([]);
      } else {
        const data = (await res.json()) as { lists: ContactListSummary[] };
        setLists(data.lists ?? []);
      }
      setListsLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (templateId !== 'minimal_notice') return;
    setHora('');
    setLugar('');
    setOrador('');
  }, [templateId]);

  const buildInput = useMemo<EmailTemplateBuildInput>(
    () => ({
      tituloInterno,
      asunto,
      estado,
      flyerUrl,
      textoPrincipal,
      fecha,
      hora,
      lugar,
      orador,
      ctaUrl,
    }),
    [tituloInterno, asunto, estado, flyerUrl, textoPrincipal, fecha, hora, lugar, orador, ctaUrl],
  );

  const saveCampaign = async (): Promise<string | null> => {
    if (!tituloInterno.trim()) {
      toast.error('Completá el título de la campaña.');
      return null;
    }
    if (!asunto.trim()) {
      toast.error('Completá el asunto del correo.');
      return null;
    }
    setSaving(true);
    const res = await authFetch('/api/admin/email-campaigns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre: tituloInterno.trim(),
        asunto: asunto.trim(),
        template_id: templateId,
        contact_list_id: contactListId === '__ALL__' ? null : contactListId,
      }),
    });
    if (!res.ok) {
      setSaving(false);
      toast.error(await readApiError(res));
      return null;
    }
    const created = (await res.json()) as { id?: string };
    const id = created?.id ?? null;
    if (id) setLastCampaignId(id);
    toast.success('Campaña guardada en la base de datos.');
    setSaving(false);
    return id;
  };

  const dispatchBusy =
    dispatchJob !== null &&
    (dispatchJob.status === 'queued' || dispatchJob.status === 'running');

  const dispatchCampaignEmails = async () => {
    if (dispatchBusy) return;
    const campaignId = lastCampaignId ?? (await saveCampaign());
    if (!campaignId) return;
    const html = buildEmailHtmlForTemplate(templateId, buildInput);
    setSaving(true);
    prevStatusRef.current = null;
    const res = await authFetch(`/api/admin/email-campaigns/${campaignId}/dispatch/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        html,
        asunto: asunto.trim(),
        ...(contactListId === '__ALL__'
          ? { audience: 'all' }
          : { contact_list_id: contactListId }),
      }),
    });
    setSaving(false);
    if (!res.ok) {
      toast.error(await readApiError(res));
      return;
    }
    const data = (await res.json()) as DispatchJobState;
    setDispatchJob(data);
    if (data.jobId && (data.status === 'queued' || data.status === 'running')) {
      window.localStorage.setItem(DISPATCH_LS_KEY, JSON.stringify({ jobId: data.jobId, campaignId }));
      startPolling(data.jobId);
    } else {
      toast.success(data.message ?? 'No hay envíos nuevos.');
    }
  };

  const listOptions = useMemo(
    () => [
      { value: '__ALL__', label: 'Enviar a TODOS los usuarios' },
      { value: '', label: listsLoading ? 'Cargando listas…' : '— O elegí una lista guardada —' },
      ...lists.map((l) => ({
        value: l.id,
        label: `${l.nombre}${typeof l.member_count === 'number' ? ` · ${l.member_count} contactos` : ''}`,
      })),
    ],
    [lists, listsLoading],
  );

  const sectionSubtitle = useMemo(() => {
    if (templateId === 'minimal_notice') {
      return 'Plantilla aviso: solo los datos que ves en el formulario se usan en el mail. Separá párrafos con una línea en blanco si querés varios bloques.';
    }
    if (templateId === 'editorial_event') {
      return 'Plantilla editorial: speaker grande, franja violeta y CTA. Saludo fijo (sin merge por nombre). Fecha en varias líneas: 1ª = barra corta, resto = detalle.';
    }
    if (templateId === 'palatino_event') {
      return 'Plantilla Palatino oscura: intro grande, flyer con sombra, dos columnas speaker / cuándo. Saludo y nombre para n8n; fecha multilínea como en editorial.';
    }
    if (templateId === 'verdana_invite') {
      return 'Invitación Verdana: titular con el speaker, flyer, tarjeta blanca y bloque fecha/hora/lugar. El nombre del orador también va en el titular grande.';
    }
    return 'Plantilla evento: vista previa con layout completo (600px). Separá intro, cuerpo y cierre con una línea en blanco entre bloques.';
  }, [templateId]);

  const editorGrid = (
      <div
        className="email-campaign-layout"
        style={{
          display: 'grid',
          gridTemplateColumns: wide ? 'minmax(0, 1fr) minmax(320px, 520px)' : '1fr',
          gap: wide ? 28 : 22,
          alignItems: 'start',
        }}
      >
        <div style={{ minWidth: 0 }}>
          <FormSection title="Identificación y envío">
            <Sel
              label="Lista de contactos (destinatarios)"
              hint="«Todos» se calcula al enviar (incluye usuarios nuevos). Si elegís una lista guardada, se usan solo esos contactos."
              value={contactListId}
              onChange={(v) => setContactListId(v as '__ALL__' | string)}
              options={listOptions}
            />
            <Sel
              label="Plantilla de email"
              hint={EMAIL_TEMPLATE_OPTIONS.find(o => o.id === templateId)?.description ?? ''}
              value={templateId}
              onChange={v => setTemplateId(v as EmailTemplateId)}
              options={EMAIL_TEMPLATE_OPTIONS.map(o => ({ value: o.id, label: o.label }))}
            />
            {showCampaignField('tituloInterno', templateId) ? (
              <Field
                label="Título de la campaña (solo base de datos)"
                hint="Nombre descriptivo para vos; no se muestra en el mail."
                value={tituloInterno}
                onChange={setTituloInterno}
                placeholder="Ej: Newsletter abril 2026 · Workshop UX"
              />
            ) : null}
            {showCampaignField('asunto', templateId) ? (
              <Field
                label="Asunto del correo"
                hint="Lo que ve la persona en la bandeja de entrada."
                value={asunto}
                onChange={setAsunto}
                placeholder="Ej: Te esperamos el jueves en Xplora"
              />
            ) : null}
            {showCampaignField('estado', templateId) ? (
              <Sel
                label="Estado (badge en el mail)"
                hint="Solo afecta la vista previa; no se guarda en campanias_email."
                value={estado}
                onChange={v => setEstado(v as EmailCampaignEstadoId)}
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
                value={flyerUrl}
                onChange={setFlyerUrl}
              />
            ) : null}
            {showCampaignField('textoPrincipal', templateId) ? (
              <TA
                label="Texto principal"
                hint={
                  formConf.hintTextoPrincipal ??
                  'Primera parte = saludo de cuerpo; podés agregar bloques separados por una línea en blanco: intro, desarrollo y párrafo final.'
                }
                value={textoPrincipal}
                onChange={setTextoPrincipal}
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
                value={fecha}
                onChange={setFecha}
                placeholder="Ej.: 20 de mayo de 2026 · 18:30 hs · Auditorio UCEMA"
              />
            ) : null}
            {showCampaignField('fecha', templateId) && !formConf.fechaCuandoDondeCombo ? (
              formConf.fechaAsTextarea ? (
                <>
                  <TA
                    label="Fecha"
                    hint={formConf.hintFecha ?? 'Primera línea corta · siguientes = detalle'}
                    value={fecha}
                    onChange={setFecha}
                    rows={3}
                    placeholder={'15 MAY\n15 de mayo de 2026'}
                  />
                  <TwoCol>
                    <Field label="Hora" hint="Ej. 18:30 hs" value={hora} onChange={setHora} placeholder="18:30 hs" />
                    <Field label="Lugar" value={lugar} onChange={setLugar} placeholder="Auditorio / Zoom" />
                  </TwoCol>
                </>
              ) : (
                <ThreeCol>
                  <Field
                    label="Fecha"
                    hint="Texto libre, ej. 15 de mayo de 2026"
                    value={fecha}
                    onChange={setFecha}
                    placeholder="15 de mayo de 2026"
                  />
                  <Field label="Hora" hint="Ej. 18:30 hs" value={hora} onChange={setHora} placeholder="18:30 hs" />
                  <Field label="Lugar" value={lugar} onChange={setLugar} placeholder="Auditorio / Zoom" />
                </ThreeCol>
              )
            ) : null}
            {showCampaignField('orador', templateId) ? (
              <Field
                label="Orador"
                hint="Opcional. Formato sugerido: Nombre, Rol o empresa. Si no aplica, dejalo vacío."
                value={orador}
                onChange={setOrador}
                placeholder="María Pérez, CEO de ACME"
              />
            ) : null}
            {showCampaignField('ctaUrl', templateId) ? (
              <Field
                label="Link del botón «Reservá tu lugar»"
                hint="URL de inscripción o landing. Si queda vacío, el botón apunta a # en la vista previa."
                value={ctaUrl}
                onChange={setCtaUrl}
                type="url"
                placeholder="https://…"
              />
            ) : null}
          </FormSection>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', marginTop: 8 }}>
            <button
              type="button"
              className="xplora-admin-primary"
              style={{ ...crm.primaryBtn, opacity: saving || dispatchBusy ? 0.75 : 1 }}
              disabled={saving || dispatchBusy}
              onClick={() => void dispatchCampaignEmails()}
            >
              {dispatchBusy ? 'Enviando en segundo plano…' : saving ? 'Guardando…' : 'Enviar correos (Resend)'}
            </button>
            {dispatchBusy && dispatchJob ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  minWidth: 0,
                  flex: '1 1 220px',
                }}
              >
                <span className="xplora-dispatch-spinner" aria-hidden />
                <div style={{ fontSize: 13, color: 'var(--ink-muted)', lineHeight: 1.45, minWidth: 0 }}>
                  <strong style={{ color: 'var(--ink-soft)' }}>
                    {dispatchJob.sent + dispatchJob.failed.length} de {dispatchJob.attempted}
                  </strong>
                  {dispatchJob.current_email ? (
                    <span>
                      {' '}
                      · último: <span style={{ wordBreak: 'break-all' }}>{dispatchJob.current_email}</span>
                    </span>
                  ) : null}
                  <div style={{ fontSize: 12, marginTop: 4 }}>
                    Podés cambiar de pestaña o cerrar esta ventana: el servidor sigue enviando. Al volver, el
                    progreso se reanuda solo.
                  </div>
                </div>
              </div>
            ) : null}
            <div style={{ fontSize: 13, color: 'var(--ink-muted)', margin: 0, maxWidth: 520, lineHeight: 1.45 }}>
              <p style={{ margin: 0 }}>
                El servidor toma los destinatarios de la <strong>lista elegida</strong> (o todos los usuarios), usa el{' '}
                <strong>HTML de la plantilla</strong> que ves en la vista previa y envía <strong>uno por uno</strong> vía{' '}
                <strong>Resend</strong>. Tras <strong>cada</strong> envío exitoso se guarda en{' '}
                <code style={{ fontSize: 11 }}>campanias_envios</code>.
              </p>
              <p style={{ margin: '12px 0 0' }}>
                En <strong>Email → Quién recibió el mail</strong> comparás audiencia vs envíos. Para marcar envíos sin
                mandar desde acá, seguí usando <code style={{ fontSize: 11 }}>POST …/envios</code>.
              </p>
              {lastCampaignId ? (
                <p style={{ margin: '10px 0 0', fontSize: 12, fontFamily: 'ui-monospace, monospace' }}>
                  Última campaña creada · id: {lastCampaignId}
                </p>
              ) : null}
            </div>
          </div>
        </div>

        <aside
          className="email-campaign-preview-col"
          style={
            wide
              ? {
                  position: 'sticky' as const,
                  top: 8,
                  maxHeight: 'calc(100vh - 100px)',
                  overflowY: 'auto' as const,
                  minWidth: 0,
                }
              : { minWidth: 0 }
          }
        >
          <p
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'var(--ink-muted)',
              marginBottom: 10,
            }}
          >
            Vista previa del mail
          </p>
          <EmailHtmlLivePreview templateId={templateId} input={buildInput} asunto={asunto} />
        </aside>
      </div>
  );

  if (bare) {
    return editorGrid;
  }

  return (
    <CrmSection
      kicker="Comunicación"
      title="Campañas de email"
      subtitle={sectionSubtitle}
      onNew={() => {}}
      showNew={false}
    >
      {editorGrid}
    </CrmSection>
  );
}
