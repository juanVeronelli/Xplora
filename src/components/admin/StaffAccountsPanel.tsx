/**
 * Pestaña **Equipo**: cuentas del panel CRM (`crm_staff`) — crear, perfil, permisos, mail/pass (acceso total).
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { authFetch, readApiError } from '../../lib/serverApi';
import {
  CRM_PERMISSION_KEYS,
  CRM_PERMISSION_LABELS,
  canGrantAccessTotal,
  canManageStaffAccounts,
  type CrmPermissionKey,
} from '../../lib/crmPermissions';
import { useStaffPermissions } from '../../context/StaffPermissionsContext';
import { useAuth } from '../../hooks/useAuth';
import {
  CrmSection,
  Spinner,
  Empty,
  Field,
  FormSection,
  FormScreen,
  TwoCol,
  ThreeCol,
} from './crm/CrmUi';
import { crm } from './crm/crmTheme';
import { useToast, useConfirm } from '../../context/FeedbackContext';
import { supabaseStaff as supabase } from '../../lib/supabase';

interface StaffRow {
  auth_user_id: string;
  email: string;
  nombre: string;
  apellido: string;
  equipo: string;
  permissions: CrmPermissionKey[];
  created_at: string;
}

function permissionSummary(perms: CrmPermissionKey[]): string {
  if (perms.includes('access_total')) return 'Acceso total';
  if (perms.length === 0) return '—';
  if (perms.length === 1) return CRM_PERMISSION_LABELS[perms[0]!];
  return `${perms.length} permisos`;
}

function permissionTitles(perms: CrmPermissionKey[]): string {
  return perms.map(p => CRM_PERMISSION_LABELS[p]).join('\n');
}

function formatAlta(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('es-AR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '—';
  }
}

/** Una línea; tooltip con `title` para el valor completo */
function truncateOneLine(s: string, maxChars: number): string {
  const t = s.trim();
  if (t.length <= maxChars) return t;
  return `${t.slice(0, Math.max(0, maxChars - 1))}…`;
}

function profileInitials(nombre: string, apellido: string, email: string): string {
  const n = nombre.trim();
  const a = apellido.trim();
  if (n && a) return `${n.charAt(0)}${a.charAt(0)}`.toUpperCase();
  if (n.length >= 2) return n.slice(0, 2).toUpperCase();
  if (n) return n.charAt(0).toUpperCase();
  if (a.length >= 2) return a.slice(0, 2).toUpperCase();
  if (a) return a.charAt(0).toUpperCase();
  const e = email.trim();
  return e ? e.charAt(0).toUpperCase() : '?';
}

export default function StaffAccountsPanel() {
  const toast = useToast();
  const confirm = useConfirm();
  const { user } = useAuth();
  const currentUserId = user?.id ?? null;
  const { permissions: actorPerms, refresh: refreshMe } = useStaffPermissions();
  const canManage = canManageStaffAccounts(actorPerms);
  const canTotal = canGrantAccessTotal(actorPerms);

  const [rows, setRows] = useState<StaffRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editRow, setEditRow] = useState<StaffRow | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [equipo, setEquipo] = useState('');
  /** Solo edición por admin total: nueva contraseña para otra cuenta */
  const [adminNewPassword, setAdminNewPassword] = useState('');
  /** Cambio de contraseña propia (FormScreen, mismo flujo que /api/auth/change-password) */
  const [pwCurrent, setPwCurrent] = useState('');
  const [pwNext, setPwNext] = useState('');
  const [pwConfirm, setPwConfirm] = useState('');
  const [selected, setSelected] = useState<Record<CrmPermissionKey, boolean>>(() =>
    Object.fromEntries(CRM_PERMISSION_KEYS.map(k => [k, false])) as Record<CrmPermissionKey, boolean>,
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [listError, setListError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setListError(null);
    const res = await authFetch('/api/admin/crm-staff');
    if (!res.ok) {
      const msg = await readApiError(res);
      setListError(msg);
      toast.error(msg);
      setRows([]);
      setLoading(false);
      return;
    }
    const j = (await res.json()) as { rows: StaffRow[] };
    setRows(j.rows ?? []);
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const { myRow, otherRows } = useMemo(() => {
    if (!currentUserId) return { myRow: undefined as StaffRow | undefined, otherRows: rows };
    const mine = rows.find(r => r.auth_user_id === currentUserId);
    if (!mine) return { myRow: undefined, otherRows: rows };
    return { myRow: mine, otherRows: rows.filter(r => r.auth_user_id !== currentUserId) };
  }, [rows, currentUserId]);

  const resetFormFields = () => {
    setEmail('');
    setPassword('');
    setNombre('');
    setApellido('');
    setEquipo('');
    setAdminNewPassword('');
    setPwCurrent('');
    setPwNext('');
    setPwConfirm('');
    setSelected(Object.fromEntries(CRM_PERMISSION_KEYS.map(k => [k, false])) as Record<CrmPermissionKey, boolean>);
  };

  const openCreate = () => {
    setEditRow(null);
    resetFormFields();
    setFormOpen(true);
    setError('');
  };

  const openEdit = (r: StaffRow) => {
    setEditRow(r);
    setEmail(r.email);
    setPassword('');
    setNombre(r.nombre ?? '');
    setApellido(r.apellido ?? '');
    setEquipo(r.equipo ?? '');
    setAdminNewPassword('');
    const next = Object.fromEntries(CRM_PERMISSION_KEYS.map(k => [k, false])) as Record<CrmPermissionKey, boolean>;
    for (const p of r.permissions) {
      if ((CRM_PERMISSION_KEYS as readonly string[]).includes(p)) next[p as CrmPermissionKey] = true;
    }
    setSelected(next);
    setPwCurrent('');
    setPwNext('');
    setPwConfirm('');
    setFormOpen(true);
    setError('');
  };

  const toggle = (k: CrmPermissionKey, v: boolean) => {
    if (k === 'access_total' && v && !canTotal) {
      toast.info('Solo un usuario con acceso total puede otorgar ese permiso.');
      return;
    }
    setSelected(s => ({ ...s, [k]: v }));
  };

  const permissionsPayload = useMemo(
    () => (CRM_PERMISSION_KEYS as readonly CrmPermissionKey[]).filter(k => selected[k]),
    [selected],
  );

  const save = async () => {
    const isSelf = Boolean(editRow && currentUserId && editRow.auth_user_id === currentUserId);
    const wantOwnPw =
      Boolean(editRow && isSelf) &&
      (pwCurrent.trim().length > 0 || pwNext.trim().length > 0 || pwConfirm.trim().length > 0);

    if (!editRow && !email.trim()) {
      setError('El email es obligatorio.');
      return;
    }
    if (!editRow && !permissionsPayload.length) {
      setError('Elegí al menos un permiso.');
      return;
    }
    if (editRow && canManage && canTotal && !isSelf && adminNewPassword.trim() && adminNewPassword.trim().length < 8) {
      setError('La nueva contraseña debe tener al menos 8 caracteres (o dejala vacía para no cambiarla).');
      return;
    }
    if (wantOwnPw) {
      if (!pwCurrent.trim()) {
        setError('Para cambiar tu contraseña, ingresá la actual.');
        return;
      }
      if (pwNext.length < 8) {
        setError('La nueva contraseña debe tener al menos 8 caracteres.');
        return;
      }
      if (pwNext !== pwConfirm) {
        setError('La confirmación no coincide con la nueva contraseña.');
        return;
      }
    }
    setSaving(true);
    setError('');
    if (editRow) {
      if (!canManage) {
        const res = await authFetch(`/api/admin/crm-staff/${editRow.auth_user_id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nombre, apellido, equipo }),
        });
        if (!res.ok) {
          setSaving(false);
          setError(await readApiError(res));
          return;
        }
        if (wantOwnPw) {
          const pr = await authFetch('/api/auth/change-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ current_password: pwCurrent.trim(), new_password: pwNext }),
          });
          setSaving(false);
          if (!pr.ok) {
            setError(await readApiError(pr));
            return;
          }
        } else {
          setSaving(false);
        }
        toast.success(wantOwnPw ? 'Perfil y contraseña actualizados.' : 'Tus datos se actualizaron.');
        setFormOpen(false);
        await load();
        await refreshMe();
        return;
      }
      const payload: Record<string, unknown> = {
        permissions: permissionsPayload,
        nombre,
        apellido,
        equipo,
      };
      if (canTotal && !isSelf) {
        payload.email = email.trim().toLowerCase();
        if (adminNewPassword.trim().length >= 8) {
          payload.new_password = adminNewPassword.trim();
        }
      }
      const res = await authFetch(`/api/admin/crm-staff/${editRow.auth_user_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        setSaving(false);
        setError(await readApiError(res));
        return;
      }
      if (isSelf && wantOwnPw) {
        const pr = await authFetch('/api/auth/change-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ current_password: pwCurrent.trim(), new_password: pwNext }),
        });
        setSaving(false);
        if (!pr.ok) {
          setError(await readApiError(pr));
          return;
        }
        toast.success('Perfil y contraseña actualizados.');
      } else {
        setSaving(false);
        toast.success('Cuenta actualizada.');
      }
      setFormOpen(false);
      await load();
      await refreshMe();
      return;
    }
    const res = await authFetch('/api/admin/crm-staff', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
        password: password.trim() || undefined,
        nombre,
        apellido,
        equipo,
        permissions: permissionsPayload,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      setError(await readApiError(res));
      return;
    }
    const created = (await res.json()) as { temporary_password?: string };
    if (created.temporary_password) {
      toast.success(`Usuario creado. Contraseña temporal: ${created.temporary_password}`);
    } else {
      toast.success('Usuario creado.');
    }
    setFormOpen(false);
    await load();
  };

  const remove = async (r: StaffRow) => {
    const self = (await supabase.auth.getUser()).data.user?.id;
    if (r.auth_user_id === self) {
      toast.error('No podés eliminar tu propia sesión.');
      return;
    }
    const ok = await confirm({
      title: 'Eliminar cuenta del equipo',
      message: `¿Eliminar ${r.email} del panel? No podés deshacer.`,
      confirmLabel: 'Eliminar',
      cancelLabel: 'Cancelar',
      danger: true,
    });
    if (!ok) return;
    const res = await authFetch(`/api/admin/crm-staff/${r.auth_user_id}`, { method: 'DELETE' });
    if (!res.ok) {
      toast.error(await readApiError(res));
      return;
    }
    toast.success('Cuenta eliminada.');
    await load();
  };

  const resetPw = async (r: StaffRow) => {
    const ok = await confirm({
      title: 'Restablecer contraseña',
      message: `¿Generar una contraseña nueva para ${r.email}? Se mostrará una sola vez.`,
      confirmLabel: 'Restablecer',
      cancelLabel: 'Cancelar',
    });
    if (!ok) return;
    const res = await authFetch(`/api/admin/crm-staff/${r.auth_user_id}/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    if (!res.ok) {
      toast.error(await readApiError(res));
      return;
    }
    const j = (await res.json()) as { temporary_password?: string };
    toast.success(
      j.temporary_password
        ? `Nueva contraseña temporal: ${j.temporary_password}`
        : 'Contraseña actualizada.',
    );
  };

  const isSelfForm = Boolean(editRow && currentUserId && editRow.auth_user_id === currentUserId);

  return (
    <CrmSection
      kicker="Accesos"
      title="Equipo CRM"
      subtitle="Quién tiene acceso al panel y cómo se organiza el equipo. Tu perfil va arriba; el resto del equipo en la tabla."
      onNew={openCreate}
      newLabel="+ Nueva cuenta"
      showNew={canManage}
    >
      {listError ? (
        <div
          style={{
            ...crm.listCard,
            marginBottom: 16,
            background: '#fff8f5',
            borderColor: 'rgba(192, 57, 43, 0.25)',
          }}
        >
          <p style={{ margin: 0, fontSize: 13, color: '#7a2e23', lineHeight: 1.5 }}>
            <strong>No se pudo cargar el listado.</strong> {listError}
            {/SERVICE_ROLE|service role|service_role/i.test(listError) ? (
              <>
                {' '}
                El servidor necesita <code style={{ fontSize: 12 }}>SUPABASE_SERVICE_ROLE_KEY</code> en el{' '}
                <code style={{ fontSize: 12 }}>.env</code> para crear y listar cuentas desde acá.
              </>
            ) : null}
          </p>
          <button type="button" style={{ ...crm.chipBtn, marginTop: 10 }} onClick={() => void load()}>
            Reintentar
          </button>
        </div>
      ) : null}

      {loading ? (
        <Spinner />
      ) : listError ? null : rows.length === 0 ? (
        <Empty
          title="Todavía no hay cuentas del equipo"
          text={
            canManage
              ? 'Creá la primera con «+ Nueva cuenta». Si sos el administrador inicial y no aparece tu usuario, revisá CRM_BOOTSTRAP_EMAIL en el servidor.'
              : 'Cuando existan cuentas, aparecerán acá. Si no ves ninguna y deberías, contactá a quien administra el panel.'
          }
        />
      ) : (
        <>
          {!loading && myRow ? (
            <div className="xplora-equipo-profile">
              <div className="xplora-equipo-profile-avatar" aria-hidden>
                {profileInitials(myRow.nombre, myRow.apellido, myRow.email)}
              </div>
              <div className="xplora-equipo-profile-body">
                <div className="xplora-equipo-profile-kicker">Tu perfil</div>
                <div className="xplora-equipo-profile-name">
                  {[myRow.nombre?.trim(), myRow.apellido?.trim()].filter(Boolean).join(' ') || '—'}
                </div>
                <div className="xplora-equipo-profile-meta">
                  <div className="xplora-equipo-meta-item">
                    <span className="xplora-equipo-meta-label">Equipo / área</span>
                    <span>{myRow.equipo?.trim() || '—'}</span>
                  </div>
                  <div className="xplora-equipo-meta-item">
                    <span className="xplora-equipo-meta-label">Email</span>
                    <span className="xplora-equipo-profile-email" title={myRow.email}>
                      {myRow.email}
                    </span>
                  </div>
                  <div className="xplora-equipo-meta-item">
                    <span className="xplora-equipo-meta-label">Alta</span>
                    <span>{formatAlta(myRow.created_at)}</span>
                  </div>
                </div>
              </div>
              <button type="button" className="xplora-equipo-profile-cta" onClick={() => openEdit(myRow)}>
                Editar perfil
              </button>
            </div>
          ) : null}

          {otherRows.length === 0 ? (
            myRow ? (
              <div className="xplora-equipo-solo-hint">No hay otras cuentas del equipo además de la tuya.</div>
            ) : null
          ) : (
            <>
              {myRow ? (
                <div className="xplora-equipo-section-label">Resto del equipo</div>
              ) : null}
              <div className="xplora-equipo-table-wrap" style={{ minWidth: canTotal ? 700 : 560 }}>
              <table className="xplora-equipo-table">
                <thead>
                  <tr>
                    <th style={{ width: '14%' }}>Nombre</th>
                    <th style={{ width: '14%' }}>Apellido</th>
                    <th style={{ width: '16%' }}>Equipo / área</th>
                    <th style={{ width: canTotal ? '22%' : '28%' }}>Email</th>
                    {canTotal ? <th style={{ width: '18%' }}>Permisos</th> : null}
                    <th style={{ width: '10%' }}>Alta</th>
                    <th style={{ width: canTotal ? '12%' : '16%', textAlign: 'right' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {otherRows.map(r => {
                    const showEdit = canManage;
                    const permText = truncateOneLine(permissionSummary(r.permissions), 46);
                    const permTitle =
                      r.permissions.length === 0 ? undefined : permissionTitles(r.permissions);
                    return (
                      <tr key={r.auth_user_id}>
                        <td className="xplora-equipo-cell-clip" title={r.nombre?.trim() || undefined}>
                          {r.nombre?.trim() || '—'}
                        </td>
                        <td className="xplora-equipo-cell-clip" title={r.apellido?.trim() || undefined}>
                          {r.apellido?.trim() || '—'}
                        </td>
                        <td className="xplora-equipo-cell-clip" title={r.equipo?.trim() || undefined}>
                          {r.equipo?.trim() || '—'}
                        </td>
                        <td className="xplora-equipo-cell-clip" title={r.email}>
                          {r.email}
                        </td>
                        {canTotal ? (
                          <td className="xplora-equipo-cell-clip" title={permTitle}>
                            {permText}
                          </td>
                        ) : null}
                        <td>{formatAlta(r.created_at)}</td>
                        <td style={{ textAlign: 'right' }}>
                          <div className="xplora-equipo-actions">
                            {showEdit ? (
                              <button
                                type="button"
                                className="xplora-equipo-btn xplora-equipo-btn--primary"
                                onClick={() => openEdit(r)}
                              >
                                Editar
                              </button>
                            ) : null}
                            {canManage ? (
                              <>
                                <button
                                  type="button"
                                  className="xplora-equipo-btn xplora-equipo-btn--muted"
                                  onClick={() => void resetPw(r)}
                                >
                                  Reset pass
                                </button>
                                <button
                                  type="button"
                                  className="xplora-equipo-btn xplora-equipo-btn--danger"
                                  onClick={() => void remove(r)}
                                >
                                  Eliminar
                                </button>
                              </>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              </div>
            </>
          )}
        </>
      )}

      {formOpen && (
        <FormScreen
          title={
            !editRow ? 'Nueva cuenta del equipo' : isSelfForm ? 'Tu perfil' : 'Editar cuenta del equipo'
          }
          subtitle={
            !editRow
              ? 'El alta es desde el CRM (sin Supabase Dashboard). Email obligatorio; contraseña opcional.'
              : isSelfForm
                ? 'Nombre, apellido y equipo/área. Cambio de contraseña opcional en la siguiente sección.'
                : canTotal
                  ? 'Datos, permisos, y —si tenés acceso total— mail y contraseña de esta cuenta.'
                  : 'Datos personales y permisos.'
          }
          onClose={() => setFormOpen(false)}
          onSave={() => void save()}
          saving={saving}
          error={error}
        >
          <FormSection title="Persona">
            <ThreeCol>
              <Field label="Nombre" value={nombre} onChange={setNombre} placeholder="Nombre" />
              <Field label="Apellido" value={apellido} onChange={setApellido} placeholder="Apellido" />
              <Field
                label="Equipo / área"
                hint="Ej. Media, Infra, Contenidos…"
                value={equipo}
                onChange={setEquipo}
                placeholder="Texto libre"
              />
            </ThreeCol>
          </FormSection>

          {isSelfForm ? (
            <FormSection title="Contraseña (opcional)">
              <Field
                label="Contraseña actual"
                hint="Solo si querés cambiarla."
                type="password"
                value={pwCurrent}
                onChange={setPwCurrent}
                placeholder="••••••••"
              />
              <Field
                label="Nueva contraseña"
                type="password"
                value={pwNext}
                onChange={setPwNext}
                placeholder="Mínimo 8 caracteres"
              />
              <Field
                label="Repetir nueva contraseña"
                type="password"
                value={pwConfirm}
                onChange={setPwConfirm}
                placeholder="Igual que arriba"
              />
            </FormSection>
          ) : null}

          {!editRow && (
            <FormSection title="Acceso (login)">
              <TwoCol>
                <Field label="Email *" type="email" value={email} onChange={setEmail} placeholder="nombre@ucema.edu.ar" />
                <Field
                  label="Contraseña (opcional)"
                  hint="Vacío = temporal del servidor."
                  type="password"
                  value={password}
                  onChange={setPassword}
                  placeholder="Mínimo 8 caracteres si la completás"
                />
              </TwoCol>
            </FormSection>
          )}

          {editRow && canManage && canTotal && !isSelfForm ? (
            <FormSection title="Login (solo acceso total, cuentas de otros)">
              <TwoCol>
                <Field label="Email" type="email" value={email} onChange={setEmail} placeholder="correo de la cuenta" />
                <Field
                  label="Nueva contraseña (opcional)"
                  hint="Dejala vacía para no cambiar. Mín. 8 caracteres si la ponés."
                  type="password"
                  value={adminNewPassword}
                  onChange={setAdminNewPassword}
                  placeholder="Solo si querés reemplazarla"
                />
              </TwoCol>
            </FormSection>
          ) : null}

          {(!editRow || canManage) && (
            <FormSection title="Permisos">
              <div style={{ display: 'grid', gap: 10 }}>
                {(CRM_PERMISSION_KEYS as readonly CrmPermissionKey[]).map(k => (
                  <label
                    key={k}
                    style={{
                      display: 'flex',
                      gap: 10,
                      alignItems: 'flex-start',
                      cursor: k === 'access_total' && !canTotal ? 'not-allowed' : 'pointer',
                      opacity: k === 'access_total' && !canTotal ? 0.45 : 1,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selected[k]}
                      disabled={k === 'access_total' && !canTotal}
                      onChange={e => toggle(k, e.target.checked)}
                    />
                  <span
                    style={{
                      fontSize: 14,
                      color: 'var(--ink-soft)',
                      lineHeight: 1.35,
                      display: '-webkit-box',
                      WebkitBoxOrient: 'vertical',
                      WebkitLineClamp: 2,
                      overflow: 'hidden',
                    }}
                    title={CRM_PERMISSION_LABELS[k]}
                  >
                    <strong style={{ color: 'var(--ink)' }}>{k}</strong> — {CRM_PERMISSION_LABELS[k]}
                  </span>
                  </label>
                ))}
              </div>
            </FormSection>
          )}
        </FormScreen>
      )}
    </CrmSection>
  );
}
