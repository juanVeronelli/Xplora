import { useCallback, useEffect, useMemo, useState } from 'react';
import { authFetch, readApiError } from '../../lib/serverApi';
import { CrmSection, Field, FormScreen, FormSection, Spinner, Empty } from './crm/CrmUi';
import { crm } from './crm/crmTheme';
import { useToast } from '../../context/FeedbackContext';

type PartnerCompany = {
  id: string;
  name: string;
  domain: string;
  logo_url: string;
  created_at: string;
};

type PartnerUserRow = {
  user_id: string;
  company_id: string;
  email: string;
  created_at: string;
};

export default function AdminPartnersPanel() {
  const toast = useToast();
  const [rows, setRows] = useState<PartnerCompany[]>([]);
  const [users, setUsers] = useState<PartnerUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [companyId, setCompanyId] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [companyDomain, setCompanyDomain] = useState('');
  const [companyLogo, setCompanyLogo] = useState('');

  const [userEmail, setUserEmail] = useState('');
  const [userPassword, setUserPassword] = useState('');

  const selectedCompany = useMemo(() => rows.find(r => r.id === companyId) ?? null, [rows, companyId]);

  const loadUsers = useCallback(
    async (cid: string) => {
      if (!cid) {
        setUsers([]);
        return;
      }
      const res = await authFetch(`/api/admin/partners/users?company_id=${encodeURIComponent(cid)}`);
      if (!res.ok) {
        const msg = await readApiError(res);
        toast.error(msg);
        setUsers([]);
        return;
      }
      const json = (await res.json()) as { rows: PartnerUserRow[] };
      setUsers(json.rows ?? []);
    },
    [toast],
  );

  const load = useCallback(async () => {
    setLoading(true);
    const res = await authFetch('/api/admin/partners/companies');
    if (!res.ok) {
      const msg = await readApiError(res);
      toast.error(msg);
      setLoading(false);
      return;
    }
    const json = (await res.json()) as { rows: PartnerCompany[] };
    setRows(json.rows ?? []);
    setLoading(false);
    const first = json.rows?.[0]?.id ?? '';
    if (first) {
      setCompanyId(prev => prev || first);
      void loadUsers(first);
    }
  }, [toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const open = () => {
    setFormOpen(true);
    setError('');
    setCompanyId(rows[0]?.id ?? '');
    void loadUsers(rows[0]?.id ?? '');
    setCompanyName('');
    setCompanyDomain('');
    setCompanyLogo('');
    setUserEmail('');
    setUserPassword('');
  };

  const createCompany = async () => {
    setSaving(true);
    setError('');
    const res = await authFetch('/api/admin/partners/companies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: companyName, domain: companyDomain, logo_url: companyLogo }),
    });
    setSaving(false);
    if (!res.ok) {
      setError(await readApiError(res));
      return;
    }
    toast.success('Empresa creada.');
    setCompanyName('');
    setCompanyDomain('');
    setCompanyLogo('');
    await load();
  };

  const createUser = async () => {
    if (!companyId) {
      setError('Elegí una empresa.');
      return;
    }
    if (!userEmail.trim()) {
      setError('Email obligatorio.');
      return;
    }
    setSaving(true);
    setError('');
    const res = await authFetch('/api/admin/partners/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ company_id: companyId, email: userEmail, password: userPassword.trim() ? userPassword : undefined }),
    });
    setSaving(false);
    if (!res.ok) {
      setError(await readApiError(res));
      return;
    }
    const j = (await res.json()) as { temporary_password?: string };
    if (j.temporary_password) toast.success(`Cuenta creada. Password temporal: ${j.temporary_password}`);
    else toast.success('Cuenta partner creada.');
    setUserEmail('');
    setUserPassword('');
    await loadUsers(companyId);
  };

  const resetPassword = async (uid: string) => {
    setSaving(true);
    setError('');
    const res = await authFetch(`/api/admin/partners/users/${encodeURIComponent(uid)}/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    setSaving(false);
    if (!res.ok) {
      setError(await readApiError(res));
      return;
    }
    const j = (await res.json()) as { temporary_password?: string };
    toast.success(`Password reseteada: ${j.temporary_password ?? 'OK'}`);
  };

  return (
    <CrmSection
      kicker="Bolsa"
      title="Partners"
      subtitle="Alta de empresas asociadas y cuentas de acceso al Partner Portal."
      onNew={() => open()}
      showNew
      newLabel="Dar de alta"
    >
      {loading ? (
        <Spinner />
      ) : rows.length === 0 ? (
        <Empty title="Sin partners" text="Creá una empresa partner para empezar." />
      ) : (
        <>
          <div style={{ ...crm.listCard, marginBottom: 12, flexDirection: 'column', alignItems: 'stretch', gap: 10 }}>
            <strong style={{ fontSize: 13, color: 'var(--ink)' }}>Empresas ({rows.length})</strong>
            <div style={{ fontSize: 13, color: 'var(--ink-muted)' }}>
              La empresa del partner queda fija (readonly) en el portal. Desde acá también podés resetear passwords.
            </div>
          </div>

          {selectedCompany ? (
            <div style={{ ...crm.listCard, marginBottom: 0, flexDirection: 'column', alignItems: 'stretch', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <strong style={{ fontSize: 13, color: 'var(--ink)' }}>Usuarios de {selectedCompany.name}</strong>
                <button type="button" style={crm.secondaryBtn} onClick={() => void loadUsers(companyId)} disabled={saving}>
                  Refrescar
                </button>
              </div>
              {users.length === 0 ? (
                <div style={{ fontSize: 13, color: 'var(--ink-muted)' }}>Sin usuarios todavía.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {users.map(u => (
                    <div
                      key={u.user_id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 12,
                        padding: '10px 12px',
                        borderRadius: 12,
                        border: '1px solid rgba(26,16,40,0.08)',
                        background: '#fff',
                      }}
                    >
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 13, color: 'var(--ink)', fontWeight: 700 }}>{u.email || u.user_id}</div>
                        <div style={{ fontSize: 12, color: 'var(--ink-muted)' }}>{u.user_id}</div>
                      </div>
                      <button type="button" style={crm.secondaryBtn} onClick={() => void resetPassword(u.user_id)} disabled={saving}>
                        Reset password
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : null}
        </>
      )}

      {formOpen ? (
        <FormScreen
          title="Alta de partner"
          onClose={() => setFormOpen(false)}
          saving={saving}
          error={error}
          onSave={() => {}}
        >
          <FormSection title="Crear empresa (opcional)">
            <Field label="Nombre" value={companyName} onChange={setCompanyName} placeholder="Ej: Globant" />
            <Field label="Dominio" value={companyDomain} onChange={setCompanyDomain} placeholder="globant.com" />
            <Field label="Logo URL" value={companyLogo} onChange={setCompanyLogo} placeholder="https://..." />
            <button type="button" style={crm.primaryBtn} onClick={() => void createCompany()} disabled={saving || !companyName.trim()}>
              Crear empresa
            </button>
          </FormSection>

          <FormSection title="Crear cuenta (email + contraseña)">
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-muted)', marginBottom: 6, display: 'block' }}>Empresa</label>
            <select
              value={companyId}
              onChange={e => {
                const v = e.target.value;
                setCompanyId(v);
                void loadUsers(v);
              }}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 12,
                border: '1.5px solid var(--border-warm)',
                fontFamily: "'Instrument Sans', sans-serif",
                marginBottom: 12,
              }}
            >
              {rows.map(r => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>

            {selectedCompany ? (
              <div style={{ fontSize: 13, color: 'var(--ink-muted)', marginBottom: 10 }}>
                Se creará una cuenta para <strong>{selectedCompany.name}</strong>.
              </div>
            ) : null}

            <Field label="Email" value={userEmail} onChange={setUserEmail} placeholder="rrhh@empresa.com" />
            <Field
              label="Contraseña (opcional)"
              value={userPassword}
              onChange={setUserPassword}
              placeholder="Si dejás vacío: Xplora.2026"
              type="password"
            />
            <button type="button" style={crm.primaryBtn} onClick={() => void createUser()} disabled={saving}>
              Crear cuenta
            </button>
          </FormSection>
        </FormScreen>
      ) : null}
    </CrmSection>
  );
}

