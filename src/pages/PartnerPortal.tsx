import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { apiUrl } from '../lib/apiBase';

type PartnerEmpleoRow = {
  id: string;
  title: string;
  emoji?: string | null;
  company: string;
  location: string;
  type: string;
  type_tag?: string | null;
  area: string;
  description?: string | null;
  requirements?: string | null;
  benefits?: string | null;
  thumbnail_url?: string | null;
  created_at: string;
};

type PartnerApplicationRow = {
  id: string;
  status: string;
  notes: string;
  snapshot: any;
  created_at: string;
};

type PartnerCompany = {
  id: string;
  name: string;
  domain: string;
  logo_url: string;
  created_at: string;
};

function fmtDate(ts: string): string {
  try {
    return new Date(ts).toLocaleString('es-AR', { dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return ts;
  }
}

async function authFetch(path: string, init?: RequestInit) {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return fetch(apiUrl(path), {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      'Content-Type': 'application/json',
    },
  });
}

export default function PartnerPortal() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const [empleos, setEmpleos] = useState<PartnerEmpleoRow[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const selectedJob = useMemo(() => empleos.find(e => e.id === selectedJobId) ?? null, [empleos, selectedJobId]);
  const [apps, setApps] = useState<PartnerApplicationRow[]>([]);
  const [appsLoading, setAppsLoading] = useState(false);
  const [appsError, setAppsError] = useState('');
  const [jobsError, setJobsError] = useState('');
  const [company, setCompany] = useState<PartnerCompany | null>(null);
  const [editing, setEditing] = useState<PartnerEmpleoRow | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [savingJob, setSavingJob] = useState(false);

  const loadEmpleos = async () => {
    const res = await authFetch('/api/partner/empleos');
    if (!res.ok) throw new Error(await res.text());
    setEmpleos((await res.json()) as PartnerEmpleoRow[]);
  };

  const openCreate = () => {
    const companyName = company?.name ?? '';
    setEditing({
      id: '',
      title: '',
      emoji: '💼',
      company: companyName,
      location: '',
      type: 'Full-time',
      type_tag: 'g',
      area: '',
      description: '',
      requirements: '',
      benefits: '',
      thumbnail_url: null,
      created_at: new Date().toISOString(),
    });
    setFormOpen(true);
    setJobsError('');
  };

  const openEdit = (job: PartnerEmpleoRow) => {
    const companyName = company?.name ?? job.company ?? '';
    setEditing({ ...job, company: companyName });
    setFormOpen(true);
    setJobsError('');
  };

  const saveJob = async () => {
    if (!editing) return;
    setJobsError('');
    if (!editing.title.trim()) {
      setJobsError('El título es obligatorio.');
      return;
    }
    if (!company?.name?.trim()) {
      setJobsError('Tu cuenta no está asociada a una empresa.');
      return;
    }
    setSavingJob(true);
    const payload = {
      title: editing.title,
      emoji: editing.emoji ?? '💼',
      company: company.name,
      location: editing.location,
      type: editing.type,
      type_tag: editing.type_tag ?? 'g',
      area: editing.area,
      description: editing.description ?? '',
      requirements: editing.requirements ?? '',
      benefits: editing.benefits ?? '',
      thumbnail_url: editing.thumbnail_url ?? null,
    };
    const isNew = !editing.id;
    const res = await authFetch(isNew ? '/api/partner/empleos' : `/api/partner/empleos/${encodeURIComponent(editing.id)}`, {
      method: isNew ? 'POST' : 'PATCH',
      body: JSON.stringify(payload),
    });
    setSavingJob(false);
    if (!res.ok) {
      setJobsError(await res.text());
      return;
    }
    setFormOpen(false);
    setEditing(null);
    await loadEmpleos().catch(() => {});
  };

  const deleteJob = async (job: PartnerEmpleoRow) => {
    const ok = window.confirm(`Eliminar la oferta “${job.title}”?`);
    if (!ok) return;
    setJobsError('');
    const res = await authFetch(`/api/partner/empleos/${encodeURIComponent(job.id)}`, { method: 'DELETE' });
    if (!res.ok) {
      setJobsError(await res.text());
      return;
    }
    if (selectedJobId === job.id) {
      setSelectedJobId(null);
      setApps([]);
    }
    await loadEmpleos().catch(() => {});
  };

  const loadApps = async (jobId: string) => {
    setAppsLoading(true);
    setAppsError('');
    const res = await authFetch(`/api/partner/empleos/${encodeURIComponent(jobId)}/applications`);
    if (!res.ok) {
      setAppsError(await res.text());
      setAppsLoading(false);
      return;
    }
    const json = (await res.json()) as { applications: PartnerApplicationRow[] };
    setApps(json.applications ?? []);
    setAppsLoading(false);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUserEmail(data.session?.user?.email ?? null);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
      setUserEmail(session?.user?.email ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!userEmail) return;
    void (async () => {
      try {
        const me = await authFetch('/api/partner/me');
        if (me.ok) {
          const json = (await me.json()) as { company: PartnerCompany };
          setCompany(json.company);
        }
      } catch {
        /* ignore */
      }
      void loadEmpleos().catch(() => {});
    })();
  }, [userEmail]);

  const doLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) setAuthError(error.message);
  };

  const doLogout = async () => {
    await supabase.auth.signOut();
    setSelectedJobId(null);
    setApps([]);
  };

  if (loading) return null;

  if (!userEmail) {
    return (
      <div style={s.wrap}>
        <div style={s.card}>
          <h1 style={s.h1}>Partner Portal</h1>
          <p style={s.sub}>Acceso para empresas asociadas. Si no tenés usuario, pedilo al equipo Xplora.</p>
          <form onSubmit={doLogin}>
            <label style={s.label}>Email</label>
            <input value={email} onChange={e => setEmail(e.target.value)} style={s.input} inputMode="email" required />
            <label style={{ ...s.label, marginTop: 12 }}>Contraseña</label>
            <input value={password} onChange={e => setPassword(e.target.value)} style={s.input} type="password" required />
            {authError ? <p style={s.err}>{authError}</p> : null}
            <button type="submit" style={s.btn}>Ingresar</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={s.page}>
      <header style={s.top}>
        <div>
          <div style={s.kicker}>Partner Portal</div>
          <div style={s.me}>{userEmail}</div>
        </div>
        <button type="button" style={s.out} onClick={() => void doLogout()}>
          Salir
        </button>
      </header>

      {company ? (
        <div style={{ ...s.panel, marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10 }}>
            <div>
              <div style={s.kicker}>Mi empresa</div>
              <div style={{ fontSize: 16, fontWeight: 900, color: 'var(--ink)' }}>{company.name}</div>
              <div style={{ fontSize: 12, color: 'var(--ink-muted)', marginTop: 4 }}>
                {company.domain ? <>Dominio: {company.domain}</> : 'Dominio: —'}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <div style={s.grid}>
        <section style={s.panel}>
          <div style={s.panelHead}>
            <h2 style={s.h2}>Mis ofertas</h2>
            <button type="button" style={s.smallBtn} onClick={openCreate}>
              + Nueva
            </button>
          </div>
          {jobsError ? <p style={s.err}>{jobsError}</p> : null}
          <div style={s.list}>
            {empleos.map(j => (
              <div key={j.id} style={{ ...s.item, ...(selectedJobId === j.id ? s.itemActive : {}) }}>
                <button
                  type="button"
                  style={s.itemMainBtn}
                  onClick={() => {
                    setSelectedJobId(j.id);
                    void loadApps(j.id);
                  }}
                >
                  <div style={s.itemTitle}>{j.title}</div>
                  <div style={s.itemMeta}>
                    {j.company} · {j.location} · {j.type} · {j.area}
                  </div>
                </button>
                <div style={s.itemActions}>
                  <button type="button" style={s.iconBtn} onClick={() => openEdit(j)} title="Editar">
                    Editar
                  </button>
                  <button type="button" style={{ ...s.iconBtn, color: '#9b2c20' }} onClick={() => void deleteJob(j)} title="Eliminar">
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section style={s.panel}>
          <h2 style={s.h2}>Postulantes</h2>
          {!selectedJob ? (
            <p style={s.muted}>Seleccioná una oferta para ver postulantes.</p>
          ) : appsLoading ? (
            <p style={s.muted}>Cargando…</p>
          ) : appsError ? (
            <p style={s.err}>{appsError}</p>
          ) : apps.length === 0 ? (
            <p style={s.muted}>Todavía no hay postulaciones para “{selectedJob.title}”.</p>
          ) : (
            <div style={s.apps}>
              {apps.map(a => {
                const p = a.snapshot?.profile ?? {};
                return (
                  <div key={a.id} style={s.appCard}>
                    <div style={s.appTop}>
                      <div style={s.appName}>{p.full_name || p.email || 'Postulante'}</div>
                      <div style={s.appDate}>{fmtDate(a.created_at)}</div>
                    </div>
                    <div style={s.appGrid}>
                      <div><span style={s.k}>Email</span><div style={s.v}>{p.email || '—'}</div></div>
                      <div><span style={s.k}>Teléfono</span><div style={s.v}>{p.phone || '—'}</div></div>
                      <div><span style={s.k}>Carrera</span><div style={s.v}>{p.career || '—'}</div></div>
                      <div><span style={s.k}>LinkedIn</span><div style={s.v}>{p.linkedin_url || '—'}</div></div>
                      <div><span style={s.k}>CV</span><div style={s.v}>{p.cv_url || '—'}</div></div>
                    </div>
                    {a.snapshot?.cover_letter ? (
                      <div style={{ marginTop: 12 }}>
                        <div style={s.k}>Mensaje</div>
                        <div style={s.v}>{String(a.snapshot.cover_letter)}</div>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {formOpen && editing ? (
        <div style={f.overlay} onClick={() => setFormOpen(false)}>
          <div style={f.card} onClick={e => e.stopPropagation()}>
            <div style={f.head}>
              <div>
                <div style={f.kicker}>{editing.id ? 'Editar oferta' : 'Nueva oferta'}</div>
                <div style={f.title}>{editing.title || '—'}</div>
              </div>
              <button type="button" style={f.close} onClick={() => setFormOpen(false)}>
                ✕
              </button>
            </div>

            <div style={f.grid}>
              <Field label="Título" value={editing.title} onChange={v => setEditing({ ...editing, title: v })} />
              <div>
                <label style={f.label}>Empresa</label>
                <input
                  style={{ ...f.input, background: 'rgba(26,16,40,0.03)' }}
                  value={company?.name ?? editing.company}
                  disabled
                />
              </div>
              <Field label="Ubicación" value={editing.location} onChange={v => setEditing({ ...editing, location: v })} />
              <Field label="Tipo" value={editing.type} onChange={v => setEditing({ ...editing, type: v })} />
              <Field label="Área" value={editing.area} onChange={v => setEditing({ ...editing, area: v })} />
              <Field label="Emoji" value={String(editing.emoji ?? '')} onChange={v => setEditing({ ...editing, emoji: v })} />
            </div>

            <label style={f.label}>Descripción</label>
            <textarea style={f.ta} rows={4} value={editing.description ?? ''} onChange={e => setEditing({ ...editing, description: e.target.value })} />

            <label style={f.label}>Requisitos</label>
            <textarea style={f.ta} rows={4} value={editing.requirements ?? ''} onChange={e => setEditing({ ...editing, requirements: e.target.value })} />

            <label style={f.label}>Beneficios</label>
            <textarea style={f.ta} rows={4} value={editing.benefits ?? ''} onChange={e => setEditing({ ...editing, benefits: e.target.value })} />

            {jobsError ? <p style={s.err}>{jobsError}</p> : null}

            <div style={f.footer}>
              <button type="button" style={f.ghost} onClick={() => setFormOpen(false)}>
                Cancelar
              </button>
              <button type="button" style={{ ...f.save, opacity: savingJob ? 0.6 : 1 }} disabled={savingJob} onClick={() => void saveJob()}>
                {savingJob ? 'Guardando…' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label style={f.label}>{label}</label>
      <input style={f.input} value={value} onChange={e => onChange(e.target.value)} />
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  wrap: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: '#f6f1ea' },
  card: { width: '100%', maxWidth: 420, background: '#fff', borderRadius: 18, border: '1px solid rgba(26,16,40,0.08)', padding: 28 },
  h1: { fontFamily: "'Fraunces', serif", margin: 0, marginBottom: 8, color: 'var(--ink)', letterSpacing: '-0.02em' },
  sub: { marginTop: 0, color: 'var(--ink-muted)', fontSize: 13, lineHeight: 1.5, marginBottom: 18 },
  label: { display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--ink-muted)', marginBottom: 6 },
  input: { width: '100%', padding: '10px 12px', borderRadius: 12, border: '1.5px solid var(--border-warm)', fontSize: 14, boxSizing: 'border-box' },
  btn: { width: '100%', marginTop: 14, padding: '12px 14px', borderRadius: 12, border: 'none', background: 'var(--ink)', color: '#fff', fontWeight: 800, cursor: 'pointer' },
  err: { color: '#9b2c20', fontSize: 13, margin: '10px 0 0' },

  page: { minHeight: '100vh', background: '#f6f1ea', padding: '18px 22px 40px' },
  top: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  kicker: { fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-muted)', fontWeight: 800 },
  me: { fontSize: 13, color: 'var(--ink)', fontWeight: 700 },
  out: { border: '1px solid rgba(26,16,40,0.12)', borderRadius: 10, padding: '8px 12px', background: '#fff', cursor: 'pointer', fontWeight: 700 },
  grid: { display: 'grid', gridTemplateColumns: '360px 1fr', gap: 16, alignItems: 'start' },
  panel: { background: '#fff', borderRadius: 16, border: '1px solid rgba(26,16,40,0.08)', padding: 16 },
  panelHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginBottom: 8 },
  h2: { margin: 0, marginBottom: 12, fontFamily: "'Fraunces', serif", color: 'var(--ink)', letterSpacing: '-0.01em' },
  smallBtn: { border: '1px solid rgba(26,16,40,0.12)', borderRadius: 10, padding: '8px 10px', background: '#fff', cursor: 'pointer', fontWeight: 800, fontSize: 12 },
  list: { display: 'flex', flexDirection: 'column', gap: 8 },
  item: { border: '1px solid rgba(26,16,40,0.10)', background: '#fff', borderRadius: 12, padding: 10, textAlign: 'left' },
  itemActive: { borderColor: 'rgba(96,62,249,0.25)', background: 'rgba(96,62,249,0.06)' },
  itemMainBtn: { width: '100%', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', padding: 2 },
  itemTitle: { fontSize: 14, fontWeight: 800, color: 'var(--ink)' },
  itemMeta: { fontSize: 12, color: 'var(--ink-muted)', marginTop: 4, lineHeight: 1.35 },
  itemActions: { display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 },
  iconBtn: { border: '1px solid rgba(26,16,40,0.12)', borderRadius: 10, padding: '6px 8px', background: '#fff', cursor: 'pointer', fontWeight: 800, fontSize: 12 },
  muted: { margin: 0, color: 'var(--ink-muted)', fontSize: 13 },
  apps: { display: 'flex', flexDirection: 'column', gap: 10 },
  appCard: { border: '1px solid rgba(26,16,40,0.08)', borderRadius: 14, padding: 14, background: '#fff' },
  appTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10, marginBottom: 10 },
  appName: { fontSize: 14, fontWeight: 900, color: 'var(--ink)' },
  appDate: { fontSize: 12, color: 'var(--ink-muted)' },
  appGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 },
  k: { fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-muted)' },
  v: { fontSize: 13, color: 'var(--ink)' },
};

const f: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    inset: 0,
    zIndex: 1000,
    background: 'rgba(26,16,40,0.6)',
    backdropFilter: 'blur(6px)',
    WebkitBackdropFilter: 'blur(6px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
  },
  card: {
    width: '100%',
    maxWidth: 820,
    background: '#fff',
    borderRadius: 18,
    border: '1px solid rgba(26,16,40,0.10)',
    boxShadow: '0 24px 70px rgba(26,16,40,0.22)',
    padding: 18,
    position: 'relative',
  },
  head: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 12 },
  kicker: { fontSize: 11, fontWeight: 900, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-muted)' },
  title: { fontFamily: "'Fraunces', serif", fontWeight: 700, color: 'var(--ink)', marginTop: 4 },
  close: { border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 16, color: 'var(--ink-muted)' },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 10 },
  label: { display: 'block', fontSize: 12, fontWeight: 800, color: 'var(--ink-muted)', marginBottom: 6 },
  input: { width: '100%', padding: '10px 12px', borderRadius: 12, border: '1.5px solid var(--border-warm)', fontSize: 14, boxSizing: 'border-box' },
  ta: { width: '100%', padding: '10px 12px', borderRadius: 12, border: '1.5px solid var(--border-warm)', fontSize: 14, boxSizing: 'border-box', fontFamily: "'Instrument Sans', sans-serif", marginBottom: 10 },
  footer: { display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 },
  ghost: { border: '1px solid rgba(26,16,40,0.12)', borderRadius: 12, padding: '10px 12px', background: '#fff', cursor: 'pointer', fontWeight: 900 },
  save: { border: 'none', borderRadius: 12, padding: '10px 14px', background: 'var(--ink)', color: '#fff', cursor: 'pointer', fontWeight: 900 },
};

