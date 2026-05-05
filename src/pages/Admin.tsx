/**
 * Panel de administración: pestañas según permisos CRM (sitio, eventos, …, equipo).
 *
 * Cada bloque grande está en **funciones `*Section`** más abajo en este archivo (listados + formularios fullscreen).
 * Persistencia vía `authFetch` → `/api/admin/*` (ver `server/src/http/routes/register-api.routes.ts`).
 * Toasts y confirmaciones: `useToast` / `useConfirm` de `FeedbackContext`.
 */
import { useState, useEffect, useRef, useMemo, type CSSProperties } from 'react';
import { useStaffPermissions } from '../context/StaffPermissionsContext';
import { canSeeAdminSection, hasAnyPermission } from '../lib/crmPermissions';
import { fetchAdminEventos, fetchRawCharlas, fetchRawEmpleos } from '../lib/db';
import { authFetch, readApiError } from '../lib/serverApi';
import type { DbEvento, DbCharla, DbEmpleo, Speaker } from '../types';
import SiteImagesPanel from '../components/admin/SiteImagesPanel';
import ThumbnailUpload from '../components/admin/ThumbnailUpload';
import EmailCampaignsHub from '../components/admin/EmailCampaignsHub';
import DatabasePanel, { EventAudiencePanel } from '../components/admin/DatabasePanel';
import AnalyticsPanel from '../components/admin/AnalyticsPanel';
import StaffAccountsPanel from '../components/admin/StaffAccountsPanel';
import CandidatesPanel from '../components/admin/CandidatesPanel';
import AdminShell, { type AdminSectionId, type AdminNavItem } from '../components/admin/crm/AdminShell';
import {
  CrmSection,
  FormScreen,
  SectionIntro,
  Field,
  TA,
  Sel,
  TwoCol,
  ThreeCol,
  FormSection,
  ActionBtn,
  Spinner,
  Empty,
  ListCard,
} from '../components/admin/crm/CrmUi';
import { crm } from '../components/admin/crm/crmTheme';
import { useToast, useConfirm } from '../context/FeedbackContext';

const SPEAKER_EMPTY: Speaker = { name: '', role: '', initials: '', bio: '' };

const NAV_ITEMS: AdminNavItem[] = [
  { id: 'sitio', title: 'Sitio', desc: 'Home pública: fotos, logo, marcas' },
  { id: 'eventos', title: 'Próximos eventos', desc: 'Lo que ves en la página de eventos' },
  {
    id: 'charlas',
    title: 'Eventos pasados',
    desc: 'Archivo en la web, CSV Luma e inscriptos por meet',
  },
  { id: 'empleos', title: 'Empleos', desc: 'Bolsa laboral del sitio' },
  {
    id: 'campanas_email',
    title: 'Email',
    desc: 'Redactar campañas y ver quién recibió cada envío',
  },
  {
    id: 'candidatos',
    title: 'Postulaciones',
    desc: 'Sponsors y solicitudes para sumarse a Xplora',
  },
  { id: 'analytics', title: 'Analytics', desc: 'Métricas del club' },
  { id: 'database', title: 'Miembros', desc: 'Listado de miembros y listas guardadas' },
  {
    id: 'equipo',
    title: 'Equipo',
    desc: 'Cuentas del panel y permisos',
  },
];

interface Props {
  signOut: () => void;
  goToSite: () => void;
}

export default function Admin({ signOut, goToSite }: Props) {
  const { loading, permissions, nombre, apellido, email } = useStaffPermissions();
  const staffDisplayName = useMemo(() => {
    const n = [nombre?.trim(), apellido?.trim()].filter(Boolean).join(' ');
    return n || (email?.trim() ?? '');
  }, [nombre, apellido, email]);
  const visibleNav = useMemo(
    () => NAV_ITEMS.filter((i) => canSeeAdminSection(i.id, permissions)),
    [permissions],
  );
  const [section, setSection] = useState<AdminSectionId>('sitio');

  useEffect(() => {
    if (loading) return;
    if (visibleNav.length === 0) return;
    if (!canSeeAdminSection(section, permissions)) {
      setSection(visibleNav[0]!.id);
    }
  }, [loading, permissions, section, visibleNav]);

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: "'Instrument Sans', sans-serif",
          color: 'var(--ink-muted)',
          background: 'linear-gradient(165deg, #F3EEE6 0%, #FAF8F5 45%, #F7F2EC 100%)',
        }}
      >
        Cargando permisos…
      </div>
    );
  }

  if (visibleNav.length === 0) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          fontFamily: "'Instrument Sans', sans-serif",
          textAlign: 'center',
          color: 'var(--ink-soft)',
        }}
      >
        <div>
          <p style={{ marginBottom: 16 }}>Tu cuenta no tiene ninguna sección del panel habilitada.</p>
          <button type="button" style={crm.chipBtn} onClick={goToSite}>
            Volver al sitio
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <AdminShell
        section={section}
        onSection={setSection}
        navItems={visibleNav}
        goToSite={goToSite}
        signOut={signOut}
        staffDisplayName={staffDisplayName}
      >
      {section === 'sitio' && (
        <>
          <SectionIntro
            kicker="Web pública"
            title="Contenido de la home"
            subtitle="Un solo lugar para hero, carrusel, marcas y logos. Dentro del editor abrís pestañas (Inicio, Empresas, Sponsors); guardás una vez al pie y se publica todo junto."
          />
          <SiteImagesPanel />
        </>
      )}
      {section === 'eventos' && <EventosSection />}
      {section === 'charlas' && <CharlasSection />}
      {section === 'empleos' && <EmpleosSection />}
      {section === 'campanas_email' && <EmailCampaignsHub />}
      {section === 'candidatos' && <CandidatesPanel />}
      {section === 'analytics' && <AnalyticsPanel />}
      {section === 'database' && <DatabasePanel />}
      {section === 'equipo' && <StaffAccountsPanel />}
    </AdminShell>
    </>
  );
}

// ── EVENTOS ────────────────────────────────────────────────────────────

const EVENTO_EMPTY: Omit<DbEvento, 'id' | 'created_at'> = {
  title: '',
  emoji: '',
  tag_type: 'p',
  tag_label: 'Charla',
  date_display: '',
  day: '',
  month: '',
  location: '',
  modality: 'Presencial',
  capacity: '',
  cost: 'Gratuito',
  registration_link: '',
  summary: '',
  about: '',
  speaker_name: '',
  speaker_role: '',
  speaker_initials: '',
  speaker_bio: '',
  speakers: [],
  thumbnail_url: null,
  total_inscriptos: 0,
  total_asistieron: 0,
  luma_csv_imported_at: null,
  realizado: false,
};

function EventosSection() {
  const toast = useToast();
  const confirm = useConfirm();
  const [rows, setRows] = useState<DbEvento[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editRow, setEditRow] = useState<DbEvento | null>(null);
  const [form, setForm] = useState(EVENTO_EMPTY);
  const [speakers, setSpeakers] = useState<Speaker[]>([{ ...SPEAKER_EMPTY }]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setRows(await fetchAdminEventos());
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setForm(EVENTO_EMPTY);
    setSpeakers([{ ...SPEAKER_EMPTY }]);
    setEditRow(null);
    setFormOpen(true);
    setError('');
  };
  const openEdit = (r: DbEvento) => {
    setForm({ ...EVENTO_EMPTY, ...r });
    setSpeakers(
      r.speakers?.length
        ? r.speakers
        : [{ name: r.speaker_name, role: r.speaker_role, initials: r.speaker_initials, bio: r.speaker_bio }],
    );
    setEditRow(r);
    setFormOpen(true);
    setError('');
  };
  const closeForm = () => {
    setFormOpen(false);
    setEditRow(null);
  };

  const save = async () => {
    if (!form.title.trim()) {
      setError('El título es obligatorio');
      return;
    }
    setSaving(true);
    setError('');
    const validSpeakers = speakers.filter(sp => sp.name.trim());
    const first = validSpeakers[0];
    const payload = {
      ...form,
      speakers: validSpeakers,
      speaker_name: first?.name || '',
      speaker_role: first?.role || '',
      speaker_initials: first?.initials || '',
      speaker_bio: first?.bio || '',
    };
    const res = editRow
      ? await authFetch(`/api/admin/eventos/${editRow.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      : await authFetch('/api/admin/eventos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
    if (!res.ok) {
      setError(await readApiError(res));
      setSaving(false);
      return;
    }
    setSaving(false);
    closeForm();
    load();
  };

  const remove = async (id: string) => {
    const ok = await confirm({
      title: 'Eliminar evento',
      message: '¿Eliminar este evento? No podés deshacer esta acción.',
      confirmLabel: 'Eliminar',
      cancelLabel: 'Cancelar',
      danger: true,
    });
    if (!ok) return;
    const res = await authFetch(`/api/admin/eventos/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      toast.error(await readApiError(res));
      return;
    }
    toast.success('Evento eliminado.');
    load();
  };

  const f = (k: keyof typeof form, v: string) => setForm(p => ({ ...p, [k]: v }));

  const setSp = (i: number, k: keyof Speaker, v: string) =>
    setSpeakers(p => p.map((sp, idx) => (idx === i ? { ...sp, [k]: v } : sp)));
  const addSpeaker = () => setSpeakers(p => [...p, { ...SPEAKER_EMPTY }]);
  const removeSpeaker = (i: number) => setSpeakers(p => p.filter((_, idx) => idx !== i));

  const { activeRows, pastRows } = useMemo(() => {
    const active: DbEvento[] = [];
    const past: DbEvento[] = [];
    for (const r of rows) {
      if (r.realizado) past.push(r);
      else active.push(r);
    }
    return { activeRows: active, pastRows: past };
  }, [rows]);

  return (
    <CrmSection
      kicker="Calendario"
      title="Próximos eventos"
      subtitle="Son las tarjetas que ves en la página de eventos. Agregá fecha, lugar y oradores; la gente usa esto para anotarse."
      onNew={openCreate}
      newLabel="+ Nuevo evento"
    >
      {loading ? (
        <Spinner />
      ) : rows.length === 0 ? (
        <Empty
          title="Todavía no hay eventos"
          text="Creá el primero con el botón de arriba. Solo necesitás un título y una fecha; el resto lo podés completar después."
        />
      ) : (
        <div style={crm.list}>
          {activeRows.length > 0 ? (
            <>
              <p style={{ ...crm.pageSubtitle, marginBottom: 12, maxWidth: 'none' }}>
                <strong>Activos</strong> · {activeRows.length} evento{activeRows.length === 1 ? '' : 's'}
              </p>
              {activeRows.map(r => (
                <ListCard
                  key={r.id}
                  title={r.title}
                  meta={`${r.date_display || 'Sin fecha'} · ${r.location || 'Sin ubicación'}${
                    (r.total_inscriptos ?? 0) > 0 || (r.total_asistieron ?? 0) > 0
                      ? ` · ${r.total_inscriptos ?? 0} inscriptos · ${r.total_asistieron ?? 0} asistieron`
                      : ''
                  }`}
                  actions={
                    <>
                      <ActionBtn onClick={() => openEdit(r)}>Editar</ActionBtn>
                      <ActionBtn danger onClick={() => remove(r.id)}>
                        Eliminar
                      </ActionBtn>
                    </>
                  }
                />
              ))}
            </>
          ) : (
            <p style={{ ...crm.pageSubtitle, marginBottom: 12, maxWidth: 'none', color: 'var(--ink-muted)' }}>
              No hay eventos activos ahora mismo.
            </p>
          )}

          {pastRows.length > 0 ? (
            <>
              <div style={{ height: 10 }} />
              <p style={{ ...crm.pageSubtitle, marginBottom: 12, maxWidth: 'none' }}>
                <strong>Ya pasados / archivados</strong> · {pastRows.length} evento{pastRows.length === 1 ? '' : 's'}
              </p>
              {pastRows.map(r => (
                <ListCard
                  key={r.id}
                  title={r.title}
                  meta={`${r.date_display || 'Sin fecha'} · ${r.location || 'Sin ubicación'} · Realizado${
                    (r.total_inscriptos ?? 0) > 0 || (r.total_asistieron ?? 0) > 0
                      ? ` · ${r.total_inscriptos ?? 0} inscriptos · ${r.total_asistieron ?? 0} asistieron`
                      : ''
                  }`}
                  actions={
                    <>
                      <ActionBtn onClick={() => openEdit(r)}>Editar</ActionBtn>
                      <ActionBtn danger onClick={() => remove(r.id)}>
                        Eliminar
                      </ActionBtn>
                    </>
                  }
                />
              ))}
            </>
          ) : null}
        </div>
      )}

      {formOpen && (
        <FormScreen
          title={editRow ? 'Editar evento' : 'Nuevo evento'}
          subtitle="Completá lo que puedas ahora; siempre podés volver a editar. Lo marcado con * es obligatorio."
          onClose={closeForm}
          onSave={save}
          saving={saving}
          error={error}
        >
          <FormSection title="Tarjeta y miniatura">
            <TwoCol>
              <Field
                label="Símbolo en la tarjeta (opcional)"
                hint="Un carácter o pictograma que se muestra en el sitio público; podés dejarlo vacío."
                value={form.emoji}
                onChange={v => f('emoji', v)}
              />
              <Field
                label="Etiqueta corta"
                hint="Aparece arriba del título, ej. «Charla», «Workshop»."
                value={form.tag_label}
                onChange={v => f('tag_label', v)}
                placeholder="Charla"
              />
            </TwoCol>
            <ThumbnailUpload
              label="Miniatura"
              hint="Imagen para la tarjeta en la página de eventos y en «Próximo evento». Si no cargás, se muestra el símbolo o un fondo por defecto."
              value={form.thumbnail_url ?? ''}
              onChange={v => setForm(p => ({ ...p, thumbnail_url: v || null }))}
            />
          </FormSection>

          <FormSection title="Título y texto">
            <Field
              label="Título del evento *"
              hint="El nombre que verán en grande en la tarjeta."
              value={form.title}
              onChange={v => f('title', v)}
              placeholder="IA en el mundo de los negocios"
            />
            <Field
              label="Descripción corta"
              hint="2–3 líneas que resumen el evento en la lista (no el texto largo)."
              value={form.summary}
              onChange={v => f('summary', v)}
              placeholder="Breve descripción..."
            />
            <TA
              label="Detalle completo"
              hint="Texto largo con de qué se trata: ideal para quien ya quiere saber más."
              value={form.about}
              onChange={v => f('about', v)}
            />
          </FormSection>

          <FormSection title="Presentación en el sitio">
            <TwoCol>
              <Sel
                label="Color de la etiqueta"
                hint="Solo cambia el color del chip en el sitio."
                value={form.tag_type}
                onChange={v => f('tag_type', v)}
                options={[
                  { value: 'p', label: 'Charla (morado)' },
                  { value: 'g', label: 'Workshop (verde)' },
                  { value: 'o', label: 'Panel (naranja)' },
                  { value: 'n', label: 'Networking (gris)' },
                ]}
              />
              <Sel
                label="Modalidad"
                value={form.modality}
                onChange={v => f('modality', v)}
                options={[
                  { value: 'Presencial', label: 'Presencial' },
                  { value: 'Online', label: 'Online' },
                  { value: 'Híbrido', label: 'Híbrido' },
                ]}
              />
            </TwoCol>
          </FormSection>

          <FormSection title="Fecha y lugar">
            <ThreeCol>
              <Field
                label="Fecha como la querés mostrar"
                hint="Ej.: 18 de abril, 2025. Es el texto que lee el visitante."
                value={form.date_display}
                onChange={v => f('date_display', v)}
              />
              <Field label="Día (número)" hint="Para el calendario chico, ej. 18" value={form.day} onChange={v => f('day', v)} />
              <Field label="Mes abreviado" hint="Ej. ABR o NOV" value={form.month} onChange={v => f('month', v)} />
            </ThreeCol>
            <TwoCol>
              <Field
                label="Lugar"
                hint="Dirección o nombre del espacio."
                value={form.location}
                onChange={v => f('location', v)}
                placeholder="Auditorio UCEMA"
              />
              <Field
                label="Cupos"
                hint="Texto libre, ej. «40 lugares» o «Cupo limitado»."
                value={form.capacity}
                onChange={v => f('capacity', v)}
              />
            </TwoCol>
          </FormSection>

          <FormSection title="Inscripción">
            <TwoCol>
              <Field label="Costo" value={form.cost} onChange={v => f('cost', v)} placeholder="Gratuito" />
              <Field
                label="Link de inscripción"
                hint="Pegá el enlace a Google Forms, Typeform, etc."
                value={form.registration_link}
                onChange={v => f('registration_link', v)}
                placeholder="https://forms.gle/..."
              />
            </TwoCol>
          </FormSection>

          <FormSection
            title="Oradores / panelistas"
            action={
              <button type="button" onClick={addSpeaker} style={crm.addSpeakerBtn}>
                + Agregar orador/a
              </button>
            }
          >
          {speakers.map((sp, i) => (
            <div key={i} style={crm.speakerCard}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-muted)' }}>Persona {i + 1}</span>
                {speakers.length > 1 && (
                  <button type="button" onClick={() => removeSpeaker(i)} style={crm.removeSpeakerBtn}>
                    Quitar
                  </button>
                )}
              </div>
              <TwoCol>
                <Field label="Nombre completo" value={sp.name} onChange={v => setSp(i, 'name', v)} placeholder="María García" />
                <Field
                  label="Iniciales"
                  hint="Para el avatar circular, ej. MG"
                  value={sp.initials}
                  onChange={v => setSp(i, 'initials', v)}
                  placeholder="MG"
                />
              </TwoCol>
              <Field label="Rol o cargo" value={sp.role} onChange={v => setSp(i, 'role', v)} placeholder="Founder & CEO" />
              <TA label="Bio breve" value={sp.bio} onChange={v => setSp(i, 'bio', v)} rows={2} />
            </div>
          ))}
          </FormSection>
        </FormScreen>
      )}
    </CrmSection>
  );
}

// ── CHARLAS ────────────────────────────────────────────────────────────

const CHARLA_EMPTY: Omit<DbCharla, 'id' | 'created_at'> = {
  evento_id: undefined,
  title: '',
  emoji: '',
  speaker_name: '',
  speaker_initials: '',
  speaker_bio: '',
  tag_type: 'p',
  tag_label: 'Charla',
  date_display: '',
  about: '',
  topics: [],
  why_xplora: '',
  duration: '',
  attendees: '',
  recording_link: '',
  material_link: '',
  thumbnail_url: null,
};

function CharlasSection() {
  const toast = useToast();
  const confirm = useConfirm();
  const [rows, setRows] = useState<DbCharla[]>([]);
  const [eventos, setEventos] = useState<DbEvento[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editRow, setEditRow] = useState<DbCharla | null>(null);
  const [form, setForm] = useState(CHARLA_EMPTY);
  const [topicsText, setTopicsText] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [csvBusy, setCsvBusy] = useState(false);
  const csvInputRef = useRef<HTMLInputElement>(null);

  const { permissions } = useStaffPermissions();
  const canArchivePasados = hasAnyPermission(permissions, ['past_events_create', 'past_events_edit_delete']);
  const canAudienciaEvento = hasAnyPermission(permissions, ['database_full', 'database_event_audience_only']);
  const showPasadosHubNav = canArchivePasados && canAudienciaEvento;
  const [pasadosTab, setPasadosTab] = useState<'archivo' | 'inscriptos'>('archivo');

  useEffect(() => {
    if (!canArchivePasados && canAudienciaEvento) setPasadosTab('inscriptos');
  }, [canArchivePasados, canAudienciaEvento]);

  const eventoSelectOptions = useMemo(() => {
    const sid = form.evento_id;
    const linked = sid ? eventos.find(e => e.id === sid) : undefined;
    let list = eventos.filter(e => !(e.realizado ?? false));
    if (linked && (linked.realizado ?? false) && !list.some(e => e.id === linked.id)) {
      list = [linked, ...list];
    }
    return [
      { value: '', label: '— Ninguno —' },
      ...list.map(e => ({
        value: e.id,
        label: e.realizado ? `${e.title} (ya archivado)` : e.title,
      })),
    ];
  }, [eventos, form.evento_id]);

  const load = async () => {
    setLoading(true);
    const [c, evs] = await Promise.all([fetchRawCharlas(), fetchAdminEventos()]);
    setRows(c);
    setEventos(evs);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setForm(CHARLA_EMPTY);
    setTopicsText('');
    setEditRow(null);
    setFormOpen(true);
    setError('');
  };
  const openEdit = (r: DbCharla) => {
    setForm({ ...CHARLA_EMPTY, ...r });
    setTopicsText((r.topics || []).join('\n'));
    setEditRow(r);
    setFormOpen(true);
    setError('');
  };
  const closeForm = () => {
    setFormOpen(false);
    setEditRow(null);
  };

  const importEvento = (eventoId: string) => {
    const ev = eventos.find(e => e.id === eventoId);
    if (!ev) return;
    setForm(p => ({
      ...p,
      evento_id: ev.id,
      title: ev.title,
      emoji: ev.emoji,
      thumbnail_url: ev.thumbnail_url ?? null,
      speaker_name: ev.speaker_name,
      speaker_initials: ev.speaker_initials,
      speaker_bio: ev.speaker_bio,
      tag_type: ev.tag_type,
      tag_label: ev.tag_label,
      date_display: ev.date_display,
      about: ev.about,
    }));
  };

  const save = async () => {
    if (!form.title.trim()) {
      setError('El título es obligatorio');
      return;
    }
    setSaving(true);
    setError('');
    const payload = { ...form, topics: topicsText.split('\n').map(t => t.trim()).filter(Boolean) };
    const res = editRow
      ? await authFetch(`/api/admin/charlas/${editRow.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      : await authFetch('/api/admin/charlas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
    if (!res.ok) {
      setError(await readApiError(res));
      setSaving(false);
      return;
    }
    if (payload.evento_id) {
      const evRes = await authFetch(`/api/admin/eventos/${payload.evento_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ realizado: true }),
      });
      if (!evRes.ok) {
        toast.error(await readApiError(evRes));
      }
    }
    setSaving(false);
    closeForm();
    load();
  };

  const remove = async (id: string) => {
    const ok = await confirm({
      title: 'Eliminar evento pasado',
      message: '¿Eliminar este registro del archivo? No podés deshacer esta acción.',
      confirmLabel: 'Eliminar',
      cancelLabel: 'Cancelar',
      danger: true,
    });
    if (!ok) return;
    const res = await authFetch(`/api/admin/charlas/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      toast.error(await readApiError(res));
      return;
    }
    toast.success('Registro eliminado.');
    load();
  };

  const f = (k: keyof typeof form, v: string) => setForm(p => ({ ...p, [k]: v }));

  const importLumaCsv = async (file: File | null) => {
    if (!file) return;
    if (!form.evento_id) {
      toast.error('Elegí primero el evento de la lista de arriba (debe ser el mismo que en Luma).');
      return;
    }
    setCsvBusy(true);
    setError('');
    const fd = new FormData();
    fd.append('csv', file);
    const res = await authFetch(`/api/admin/eventos/${form.evento_id}/luma-csv`, {
      method: 'POST',
      body: fd,
    });
    setCsvBusy(false);
    if (csvInputRef.current) csvInputRef.current.value = '';
    if (!res.ok) {
      const msg = await readApiError(res);
      setError(msg);
      toast.error(msg);
      return;
    }
    const data = (await res.json()) as {
      emails_procesados: number;
      usuarios_nuevos: number;
      usuarios_existentes: number;
      warnings?: string[];
    };
    toast.success(
      `Importación lista: ${data.emails_procesados} emails (${data.usuarios_nuevos} usuarios nuevos, ${data.usuarios_existentes} ya existían).`,
    );
    if (data.warnings?.length) {
      for (const w of data.warnings) toast.info(w);
    }
    void load();
  };

  const archivoDePasados = (
    <CrmSection
      kicker="Historial"
      title="Archivo en la web"
      subtitle="Registrá cada meet ya realizado: vinculá un evento de Próximos eventos, subí el CSV de Luma y archivá la fecha en el sitio público."
      onNew={openCreate}
      newLabel="+ Nuevo evento pasado"
    >
      {loading ? (
        <Spinner />
      ) : rows.length === 0 ? (
        <Empty
          title="No hay eventos pasados cargados"
          text="Usá «Nuevo evento pasado». Si el meet ya estaba en Eventos, vinculalo: al guardar se marca como realizado y deja de mostrarse en la página de próximos eventos."
        />
      ) : (
        <div style={crm.list}>
          {rows.map(r => (
            <ListCard
              key={r.id}
              title={r.title}
              meta={`${r.speaker_name || 'Sin orador'} · ${r.date_display || 'Sin fecha'}`}
              actions={
                <>
                  <ActionBtn onClick={() => openEdit(r)}>Editar</ActionBtn>
                  <ActionBtn danger onClick={() => remove(r.id)}>
                    Eliminar
                  </ActionBtn>
                </>
              }
            />
          ))}
        </div>
      )}

      {formOpen && (
        <FormScreen
          title={editRow ? 'Editar evento pasado' : 'Nuevo evento pasado'}
          subtitle="Vinculá el mismo evento que tenés en Luma y en Eventos (si aplica). Al guardar, ese evento deja el listado público de próximos."
          onClose={closeForm}
          onSave={save}
          saving={saving}
          error={error}
        >
          {eventos.length > 0 ? (
            <FormSection title="Evento en Xplora (origen)">
              <Sel
                label="Evento que ya publicaste"
                hint="Al guardar este formulario, ese evento pasa a «realizado» y ya no aparece en la web como próximo. Podés copiar título, fecha y orador."
                value={form.evento_id || ''}
                onChange={v => {
                  if (v) importEvento(v);
                  else setForm(p => ({ ...p, evento_id: undefined }));
                }}
                options={eventoSelectOptions}
              />
            </FormSection>
          ) : (
            <FormSection title="Evento en Xplora">
              <p style={{ fontSize: 13, color: 'var(--ink-muted)', margin: 0 }}>
                Todavía no hay eventos en la pestaña Eventos. Creá uno primero si querés vincular, o completá la tarjeta solo a mano.
              </p>
            </FormSection>
          )}

          <FormSection title="Invitados Luma (CSV)">
            <p style={{ fontSize: 13, color: 'var(--ink-muted)', marginTop: 0, marginBottom: 12, lineHeight: 1.5 }}>
              Exportá invitados desde Luma (Guests → CSV). Necesitás haber elegido arriba el **mismo evento** en Xplora para que los mails se crucen con{' '}
              <code style={{ fontSize: 12 }}>inscripciones_evento</code>. El archivo usa <code style={{ fontSize: 12 }}>checked_in_at</code> para asistencia.
            </p>
            <TwoCol>
              <div>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: '1px',
                    textTransform: 'uppercase',
                    color: 'var(--ink-muted)',
                  }}
                >
                  Archivo
                </span>
                <p style={{ margin: '8px 0 0', fontSize: 13, color: 'var(--ink-muted)' }}>
                  {form.evento_id
                    ? 'Listo para importar.'
                    : 'Primero elegí el evento de origen para habilitar la importación.'}
                </p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, justifyContent: 'flex-end' }}>
                <input
                  ref={csvInputRef}
                  type="file"
                  accept=".csv,text/csv"
                  style={{ fontSize: 13 }}
                  disabled={csvBusy || !form.evento_id}
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) void importLumaCsv(file);
                  }}
                />
                {csvBusy && <Spinner />}
              </div>
            </TwoCol>
          </FormSection>

          <FormSection title="Tarjeta y datos principales">
            <TwoCol>
              <Field
                label="Símbolo en la tarjeta (opcional)"
                value={form.emoji}
                onChange={v => f('emoji', v)}
              />
              <Field label="Etiqueta" value={form.tag_label} onChange={v => f('tag_label', v)} />
            </TwoCol>
            <ThumbnailUpload
              label="Miniatura"
              hint="Imagen de la tarjeta en Eventos pasados y cabecera del detalle. Si no cargás, se usa el símbolo o un fondo."
              value={form.thumbnail_url ?? ''}
              onChange={v => setForm(p => ({ ...p, thumbnail_url: v || null }))}
            />
            <Field label="Título *" value={form.title} onChange={v => f('title', v)} />
            <TwoCol>
              <Sel
                label="Color de categoría"
                value={form.tag_type}
                onChange={v => f('tag_type', v)}
                options={[
                  { value: 'p', label: 'Morado' },
                  { value: 'g', label: 'Verde' },
                  { value: 'o', label: 'Naranja' },
                  { value: 'n', label: 'Gris' },
                ]}
              />
              <Field label="Fecha mostrada" hint="Ej: Nov 2024 o 12 mar 2024" value={form.date_display} onChange={v => f('date_display', v)} />
            </TwoCol>
          </FormSection>

          <FormSection title="Contenido de la charla">
            <TA label="Sobre la charla" value={form.about} onChange={v => f('about', v)} />
            <TA
              label="Temas tocados"
              hint="Un tema por línea. Aparecen como lista en el sitio."
              value={topicsText}
              onChange={v => setTopicsText(v)}
              rows={4}
              placeholder={'Fundraising en etapas tempranas\nCómo evaluar el product-market fit'}
            />
            <TA label="¿Por qué vino a Xplora?" value={form.why_xplora} onChange={v => f('why_xplora', v)} rows={2} />
          </FormSection>

          <FormSection title="Orador/a">
            <TwoCol>
              <Field label="Nombre" value={form.speaker_name} onChange={v => f('speaker_name', v)} />
              <Field label="Iniciales" value={form.speaker_initials} onChange={v => f('speaker_initials', v)} />
            </TwoCol>
            <TA label="Biografía" value={form.speaker_bio} onChange={v => f('speaker_bio', v)} rows={2} />
          </FormSection>

          <FormSection title="Métricas y enlaces">
            <TwoCol>
              <Field label="Duración" hint="Ej: 75 min" value={form.duration} onChange={v => f('duration', v)} />
              <Field label="Asistentes" hint="Ej: +120 o el número que quieras mostrar" value={form.attendees} onChange={v => f('attendees', v)} />
            </TwoCol>
            <Field
              label="Link a la grabación"
              hint="YouTube, Drive, etc."
              value={form.recording_link}
              onChange={v => f('recording_link', v)}
              placeholder="https://youtube.com/..."
            />
            <Field
              label="Link a material"
              hint="Presentación, PDF, carpeta compartida…"
              value={form.material_link}
              onChange={v => f('material_link', v)}
              placeholder="https://..."
            />
          </FormSection>
        </FormScreen>
      )}
    </CrmSection>
  );

  if (!canArchivePasados && canAudienciaEvento) {
    return (
      <>
        <SectionIntro
          kicker="Historial"
          title="Inscriptos por evento"
          subtitle="Eventos ya realizados: revisá quién se anotó y si hizo check-in. Para cargar charlas en la web usá la pestaña «Archivo» cuando tengas permiso de edición."
        />
        <EventAudiencePanel />
      </>
    );
  }

  if (!showPasadosHubNav) {
    return archivoDePasados;
  }

  const subNavPasados: CSSProperties = { marginBottom: 18 };

  return (
    <>
      <SectionIntro
        kicker="Historial"
        title="Eventos pasados"
        subtitle="Dos vistas: el archivo público (charlas en la web) y la lista operativa de inscriptos y asistencia por cada meet."
      />
      <nav style={subNavPasados} aria-label="Vistas de eventos pasados">
        <div style={crm.segmentRail}>
          <div className="xplora-admin-segment-scroll">
            <div className="xplora-admin-segment-track" style={crm.segmentTrack} role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={pasadosTab === 'archivo'}
                title="Tarjetas en sitio y CSV Luma"
                className={`xplora-admin-seg${pasadosTab === 'archivo' ? ' is-active' : ''}`}
                style={crm.segmentBtn(pasadosTab === 'archivo')}
                onClick={() => setPasadosTab('archivo')}
              >
                <span style={crm.segmentLabel}>Archivo en la web</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={pasadosTab === 'inscriptos'}
                title="Inscriptos y check-in"
                className={`xplora-admin-seg${pasadosTab === 'inscriptos' ? ' is-active' : ''}`}
                style={crm.segmentBtn(pasadosTab === 'inscriptos')}
                onClick={() => setPasadosTab('inscriptos')}
              >
                <span style={crm.segmentLabel}>Inscriptos por evento</span>
              </button>
            </div>
          </div>
        </div>
      </nav>
      {pasadosTab === 'inscriptos' ? <EventAudiencePanel /> : archivoDePasados}
    </>
  );
}

// ── EMPLEOS ────────────────────────────────────────────────────────────

const EMPLEO_EMPTY: Omit<DbEmpleo, 'id' | 'created_at'> = {
  title: '',
  company: '',
  location: '',
  emoji: '',
  type: 'Full-time',
  type_tag: 'g',
  area: 'Tech',
  description: '',
  requirements: '',
  benefits: '',
  application_link: '',
  thumbnail_url: null,
};

function EmpleosSection() {
  const toast = useToast();
  const confirm = useConfirm();
  const [rows, setRows] = useState<DbEmpleo[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editRow, setEditRow] = useState<DbEmpleo | null>(null);
  const [form, setForm] = useState(EMPLEO_EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setRows(await fetchRawEmpleos());
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setForm(EMPLEO_EMPTY);
    setEditRow(null);
    setFormOpen(true);
    setError('');
  };
  const openEdit = (r: DbEmpleo) => {
    setForm({ ...r });
    setEditRow(r);
    setFormOpen(true);
    setError('');
  };
  const closeForm = () => {
    setFormOpen(false);
    setEditRow(null);
  };

  const save = async () => {
    if (!form.title.trim()) {
      setError('El título es obligatorio');
      return;
    }
    setSaving(true);
    setError('');
    const res = editRow
      ? await authFetch(`/api/admin/empleos/${editRow.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
      : await authFetch('/api/admin/empleos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
    if (!res.ok) {
      setError(await readApiError(res));
      setSaving(false);
      return;
    }
    setSaving(false);
    closeForm();
    load();
  };

  const remove = async (id: string) => {
    const ok = await confirm({
      title: 'Eliminar oferta',
      message: '¿Eliminar esta oferta de la bolsa? No podés deshacer esta acción.',
      confirmLabel: 'Eliminar',
      cancelLabel: 'Cancelar',
      danger: true,
    });
    if (!ok) return;
    const res = await authFetch(`/api/admin/empleos/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      toast.error(await readApiError(res));
      return;
    }
    toast.success('Oferta eliminada.');
    load();
  };

  const f = (k: keyof typeof form, v: string) => setForm(p => ({ ...p, [k]: v }));

  return (
    <CrmSection
      kicker="Bolsa laboral"
      title="Ofertas de empleo"
      subtitle="Cada oferta es una tarjeta en la bolsa pública. El botón de aplicar lleva al formulario que elijas (Google Forms, etc.)."
      onNew={openCreate}
      newLabel="+ Nueva oferta"
    >
      {loading ? (
        <Spinner />
      ) : rows.length === 0 ? (
        <Empty
          title="Todavía no hay ofertas"
          text="Publicá la primera vacante con empresa, tipo de contrato y un link claro para aplicar."
        />
      ) : (
        <div style={crm.list}>
          {rows.map(r => (
            <ListCard
              key={r.id}
              title={r.title}
              meta={`${r.company} · ${r.type} · ${r.area}`}
              actions={
                <>
                  <ActionBtn onClick={() => openEdit(r)}>Editar</ActionBtn>
                  <ActionBtn danger onClick={() => remove(r.id)}>
                    Eliminar
                  </ActionBtn>
                </>
              }
            />
          ))}
        </div>
      )}

      {formOpen && (
        <FormScreen
          title={editRow ? 'Editar oferta' : 'Nueva oferta'}
          subtitle="Convencé en pocas líneas; el detalle largo va en descripción y requisitos."
          onClose={closeForm}
          onSave={save}
          saving={saving}
          error={error}
        >
          <FormSection title="Tarjeta y empresa">
            <TwoCol>
              <Field
                label="Símbolo en la tarjeta (opcional)"
                value={form.emoji}
                onChange={v => f('emoji', v)}
              />
              <Field
                label="Área"
                hint="Ej: Tech, Finanzas, Operaciones"
                value={form.area}
                onChange={v => f('area', v)}
                placeholder="Tech"
              />
            </TwoCol>
            <ThumbnailUpload
              label="Miniatura"
              hint="Logo de la empresa o imagen del puesto; se muestra en la bolsa y en el detalle. Opcional."
              value={form.thumbnail_url ?? ''}
              onChange={v => setForm(p => ({ ...p, thumbnail_url: v || null }))}
            />
          </FormSection>

          <FormSection title="Resumen del puesto">
            <Field
              label="Título del puesto *"
              hint="El nombre del rol tal como lo busca la gente."
              value={form.title}
              onChange={v => f('title', v)}
              placeholder="Analista de datos Jr."
            />
            <TwoCol>
              <Field label="Empresa" value={form.company} onChange={v => f('company', v)} />
              <Field label="Ubicación / modalidad" value={form.location} onChange={v => f('location', v)} placeholder="CABA · Híbrido" />
            </TwoCol>
            <TwoCol>
              <Sel
                label="Tipo de puesto"
                value={form.type}
                onChange={v => f('type', v)}
                options={[
                  { value: 'Full-time', label: 'Full-time' },
                  { value: 'Part-time', label: 'Part-time' },
                  { value: 'Pasantía', label: 'Pasantía' },
                  { value: 'Remoto', label: 'Remoto' },
                ]}
              />
              <Sel
                label="Color de la etiqueta"
                hint="Debe coincidir con el tipo de contrato para que los colores tengan sentido en el sitio."
                value={form.type_tag}
                onChange={v => f('type_tag', v)}
                options={[
                  { value: 'g', label: 'Verde (Full-time)' },
                  { value: 'o', label: 'Naranja (Part-time)' },
                  { value: 'p', label: 'Morado (Pasantía)' },
                  { value: 'n', label: 'Gris (Remoto)' },
                ]}
              />
            </TwoCol>
          </FormSection>

          <FormSection title="Descripción y requisitos">
            <TA label="Descripción del puesto" value={form.description} onChange={v => f('description', v)} rows={4} />
            <TA
              label="Requisitos"
              hint="Un requisito por línea se lee muy bien en la web."
              value={form.requirements}
              onChange={v => f('requirements', v)}
              rows={4}
              placeholder={'— Estudiante de últimos años\n— Experiencia con Python'}
            />
            <TA label="Beneficios y qué ofrecemos" value={form.benefits} onChange={v => f('benefits', v)} rows={3} />
          </FormSection>

          <FormSection title="Postulación">
            <Field
              label="Link para aplicar"
              hint="Pegá el enlace al Google Form o página de postulación."
              value={form.application_link}
              onChange={v => f('application_link', v)}
              placeholder="https://forms.gle/..."
            />
          </FormSection>
        </FormScreen>
      )}
    </CrmSection>
  );
}
