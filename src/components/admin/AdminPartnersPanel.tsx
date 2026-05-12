import { useCallback, useEffect, useMemo, useState } from 'react';
import { authFetch, readApiError } from '../../lib/serverApi';
import { CrmSection, Field, FormScreen, FormSection, Spinner, Empty } from './crm/CrmUi';
import { crm } from './crm/crmTheme';
import { useConfirm, useToast } from '../../context/FeedbackContext';

type PartnerRow = {
  id: string;
  name: string;
  domain: string;
  logo_url: string;
  created_at: string;
  partner_user_id: string | null;
  partner_email: string | null;
};

export default function AdminPartnersPanel() {
  const toast = useToast();
  const confirm = useConfirm();
  const [rows, setRows] = useState<PartnerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [createOpen, setCreateOpen] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [companyDomain, setCompanyDomain] = useState('');
  const [companyLogo, setCompanyLogo] = useState('');
  const [accountEmail, setAccountEmail] = useState('');
  const [accountPassword, setAccountPassword] = useState('');

  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<PartnerRow | null>(null);
  const [editName, setEditName] = useState('');
  const [editDomain, setEditDomain] = useState('');
  const [editLogo, setEditLogo] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPassword, setEditPassword] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const res = await authFetch('/api/admin/partners/companies');
    if (!res.ok) {
      toast.error(await readApiError(res));
      setLoading(false);
      return;
    }
    const json = (await res.json()) as { rows: PartnerRow[] };
    setRows(json.rows ?? []);
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const openCreate = () => {
    setCreateOpen(true);
    setError('');
    setCompanyName('');
    setCompanyDomain('');
    setCompanyLogo('');
    setAccountEmail('');
    setAccountPassword('');
  };

  const openEdit = (r: PartnerRow) => {
    setEditing(r);
    setEditName(r.name || '');
    setEditDomain(r.domain || '');
    setEditLogo(r.logo_url || '');
    setEditEmail(r.partner_email || '');
    setEditPassword('');
    setEditOpen(true);
    setError('');
  };

  const createPartner = async () => {
    setSaving(true);
    setError('');
    const res = await authFetch('/api/admin/partners', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: companyName,
        domain: companyDomain,
        logo_url: companyLogo,
        email: accountEmail,
        password: accountPassword.trim() ? accountPassword : undefined,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      setError(await readApiError(res));
      return;
    }
    const j = (await res.json().catch(() => ({}))) as { temporary_password?: string };
    if (j.temporary_password) toast.success(`Partner creado. Password temporal: ${j.temporary_password}`);
    else toast.success('Partner creado.');
    setCreateOpen(false);
    await load();
  };

  const saveCompany = async () => {
    if (!editing) return;
    setSaving(true);
    setError('');
    const res = await authFetch(`/api/admin/partners/companies/${encodeURIComponent(editing.id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editName, domain: editDomain, logo_url: editLogo }),
    });
    setSaving(false);
    if (!res.ok) {
      setError(await readApiError(res));
      return;
    }
    toast.success('Empresa actualizada.');
    setEditOpen(false);
    await load();
  };

  const saveAccount = async () => {
    if (!editing) return;
    setSaving(true);
    setError('');
    const res = await authFetch(`/api/admin/partners/companies/${encodeURIComponent(editing.id)}/account`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: editEmail, password: editPassword.trim() ? editPassword : undefined }),
    });
    setSaving(false);
    if (!res.ok) {
      setError(await readApiError(res));
      return;
    }
    toast.success('Cuenta actualizada.');
    setEditPassword('');
    await load();
  };

  const deletePartner = async (r: PartnerRow) => {
    const ok = await confirm({
      title: 'Eliminar partner',
      message: `Vas a eliminar “${r.name}” y su cuenta de acceso. ¿Confirmás?`,
      danger: true,
      confirmLabel: 'Eliminar',
      cancelLabel: 'Cancelar',
    });
    if (!ok) return;
    setSaving(true);
    setError('');
    const res = await authFetch(`/api/admin/partners/companies/${encodeURIComponent(r.id)}`, { method: 'DELETE' });
    setSaving(false);
    if (!res.ok) {
      setError(await readApiError(res));
      return;
    }
    toast.success('Partner eliminado.');
    await load();
  };

  const headerNote = useMemo(() => {
    return 'Cada partner es una empresa con 1 cuenta (email + contraseña). El portal usa estos datos para completar publicaciones.';
  }, []);

  return (
    <CrmSection
      kicker="Bolsa"
      title="Partners"
      subtitle={headerNote}
      onNew={() => openCreate()}
      showNew
      newLabel="Dar de alta"
    >
      {loading ? (
        <Spinner />
      ) : rows.length === 0 ? (
        <Empty title="Sin partners" text="Creá una empresa partner para empezar." />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 12 }}>
          {rows.map(r => (
            <div
              key={r.id}
              style={{
                ...crm.listCard,
                flexDirection: 'column',
                alignItems: 'stretch',
                gap: 10,
              }}
            >
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 16,
                    overflow: 'hidden',
                    background: 'rgba(96,62,249,0.10)',
                    border: '1px solid rgba(96,62,249,0.16)',
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 900,
                    color: 'var(--purple)',
                  }}
                  aria-hidden
                >
                  {r.logo_url ? (
                    <img src={r.logo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  ) : (
                    (r.name || 'P').slice(0, 2).toUpperCase()
                  )}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 900, color: 'var(--ink)' }}>{r.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--ink-muted)' }}>{r.partner_email || '—'}</div>
                  {r.domain ? <div style={{ fontSize: 12, color: 'var(--ink-muted)' }}>{r.domain}</div> : null}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button type="button" style={crm.secondaryBtn} onClick={() => openEdit(r)} disabled={saving}>
                  Editar
                </button>
                <button
                  type="button"
                  style={{
                    ...crm.secondaryBtn,
                    color: '#c0392b',
                    borderColor: 'rgba(192,57,43,0.25)',
                    background: 'rgba(192,57,43,0.06)',
                  }}
                  onClick={() => void deletePartner(r)}
                  disabled={saving}
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {createOpen ? (
        <FormScreen title="Alta de partner" onClose={() => setCreateOpen(false)} saving={saving} error={error} onSave={() => void createPartner()}>
          <FormSection title="Empresa">
            <Field label="Nombre" value={companyName} onChange={setCompanyName} placeholder="Ej: Globant" />
            <Field label="Dominio" value={companyDomain} onChange={setCompanyDomain} placeholder="globant.com" />
            <Field label="Foto / logo (URL)" value={companyLogo} onChange={setCompanyLogo} placeholder="https://..." />
          </FormSection>
          <FormSection title="Cuenta (empresa)">
            <Field label="Email" value={accountEmail} onChange={setAccountEmail} placeholder="contacto@empresa.com" />
            <Field label="Contraseña (opcional)" value={accountPassword} onChange={setAccountPassword} placeholder="Vacío → se usa default" type="password" />
          </FormSection>
        </FormScreen>
      ) : null}

      {editOpen && editing ? (
        <FormScreen title={`Editar partner: ${editing.name}`} onClose={() => setEditOpen(false)} saving={saving} error={error} onSave={() => void saveCompany()}>
          <FormSection title="Empresa">
            <Field label="Nombre" value={editName} onChange={setEditName} placeholder="Ej: Globant" />
            <Field label="Dominio" value={editDomain} onChange={setEditDomain} placeholder="globant.com" />
            <Field label="Foto / logo (URL)" value={editLogo} onChange={setEditLogo} placeholder="https://..." />
            <button type="button" style={crm.primaryBtn} onClick={() => void saveCompany()} disabled={saving || !editName.trim()}>
              Guardar empresa
            </button>
          </FormSection>
          <FormSection title="Cuenta (empresa)">
            <Field label="Email" value={editEmail} onChange={setEditEmail} placeholder="contacto@empresa.com" />
            <Field label="Nueva contraseña (opcional)" value={editPassword} onChange={setEditPassword} placeholder="Min 8 caracteres" type="password" />
            <button type="button" style={crm.primaryBtn} onClick={() => void saveAccount()} disabled={saving || !editEmail.trim()}>
              Guardar cuenta
            </button>
          </FormSection>
        </FormScreen>
      ) : null}
    </CrmSection>
  );
}

