import { useEffect, useId, useMemo, useState } from 'react';
import { apiUrl } from '../lib/apiBase';
import { supabasePartner } from '../lib/supabase';
import { useSiteMedia } from '../context/SiteMediaContext';
import { PUBLIC_BOLSA_ENABLED } from '../config/publicFeatures';
import '../styles/partnerPortal.css';

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

async function partnerAuthHeader(): Promise<string | null> {
  const {
    data: { session },
  } = await supabasePartner.auth.getSession();
  const token = session?.access_token;
  return token ? `Bearer ${token}` : null;
}

async function authFetch(path: string, init?: RequestInit): Promise<Response> {
  const auth = await partnerAuthHeader();
  const headers = new Headers(init?.headers);
  if (auth) headers.set('Authorization', auth);
  if (!headers.has('Content-Type') && init?.body && !(init.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  return fetch(apiUrl(path), { ...init, headers });
}

function IconHome() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1h-5v-7H9v7H4a1 1 0 01-1-1V9.5z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconBriefcase() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2M12 12v3" strokeLinecap="round" />
    </svg>
  );
}

function IconCalendar() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M16 3v4M8 3v4M3 11h18" strokeLinecap="round" />
    </svg>
  );
}

function IconUser() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <circle cx="12" cy="9" r="3.5" />
      <path d="M6 19c0-3 2.5-5 6-5s6 2 6 5" strokeLinecap="round" />
    </svg>
  );
}

const QUICK_LINKS: { href: string; label: string; Icon: typeof IconHome }[] = [
  { href: '/', label: 'Sitio Xplora', Icon: IconHome },
  ...(PUBLIC_BOLSA_ENABLED ? [{ href: '/bolsa', label: 'Bolsa de empleo', Icon: IconBriefcase }] : []),
  { href: '/eventos', label: 'Eventos', Icon: IconCalendar },
  { href: '/talento', label: 'Talento', Icon: IconUser },
];

/** Pipeline de selección — mismos valores que valida el backend (`partner-applications.controller`). */
const PIPELINE_STATUSES = [
  { id: 'new', label: 'Nuevo' },
  { id: 'contactado', label: 'Contactado' },
  { id: 'entrevista', label: 'Entrevista' },
  { id: 'waitlist', label: 'Waitlist' },
  { id: 'descartado', label: 'Descartado' },
  { id: 'contratado', label: 'Contratado' },
] as const;

function normalizeApplicationStatus(s: string | undefined): string {
  const v = (s || 'new').trim().toLowerCase();
  return PIPELINE_STATUSES.some(x => x.id === v) ? v : 'new';
}

function pipelineLabel(id: string): string {
  const n = normalizeApplicationStatus(id);
  return PIPELINE_STATUSES.find(x => x.id === n)?.label ?? id;
}

export default function PartnerPortal() {
  const { logoUrl } = useSiteMedia();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const [empleos, setEmpleos] = useState<PartnerEmpleoRow[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [apps, setApps] = useState<PartnerApplicationRow[]>([]);
  const [appsLoading, setAppsLoading] = useState(false);
  const [appsError, setAppsError] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | string>('all');
  const [patchingAppId, setPatchingAppId] = useState<string | null>(null);
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const [jobsError, setJobsError] = useState('');
  const [company, setCompany] = useState<PartnerCompany | null>(null);
  const [editing, setEditing] = useState<PartnerEmpleoRow | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [savingJob, setSavingJob] = useState(false);

  const selectedJob = useMemo(() => empleos.find(e => e.id === selectedJobId) ?? null, [empleos, selectedJobId]);

  const filteredApps = useMemo(() => {
    if (statusFilter === 'all') return apps;
    return apps.filter(a => normalizeApplicationStatus(a.status) === statusFilter);
  }, [apps, statusFilter]);

  useEffect(() => {
    setNoteDrafts(prev => {
      const next = { ...prev };
      for (const a of apps) {
        if (next[a.id] === undefined) next[a.id] = a.notes ?? '';
      }
      return next;
    });
  }, [apps]);

  useEffect(() => {
    setStatusFilter('all');
  }, [selectedJobId]);

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
    const ok = window.confirm(`¿Eliminar la oferta “${job.title}”? Esta acción no se puede deshacer.`);
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

  const patchApplication = async (applicationId: string, patch: { status?: string; notes?: string }) => {
    setPatchingAppId(applicationId);
    setAppsError('');
    try {
      const res = await authFetch(`/api/partner/applications/${encodeURIComponent(applicationId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error(await res.text());
      const row = (await res.json()) as PartnerApplicationRow;
      setApps(prev => prev.map(x => (x.id === applicationId ? { ...x, ...row } : x)));
    } catch (e) {
      setAppsError(e instanceof Error ? e.message : 'No se pudo guardar.');
    } finally {
      setPatchingAppId(null);
    }
  };

  useEffect(() => {
    void (async () => {
      try {
        const {
          data: { session },
        } = await supabasePartner.auth.getSession();
        if (!session?.user) {
          setUserEmail(null);
          setLoading(false);
          return;
        }
        const me = await authFetch('/api/partner/me');
        if (!me.ok) {
          await supabasePartner.auth.signOut();
          setUserEmail(null);
          setLoading(false);
          return;
        }
        const json = (await me.json()) as { company: PartnerCompany };
        setCompany(json.company);
        setUserEmail(session.user.email ?? session.user.id);
        setLoading(false);
      } catch {
        setUserEmail(null);
        setLoading(false);
      }
    })();
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
    try {
      const { error } = await supabasePartner.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) throw new Error(error.message);
      const me = await authFetch('/api/partner/me');
      if (!me.ok) {
        await supabasePartner.auth.signOut();
        throw new Error((await me.text()) || 'Esta cuenta no tiene acceso al portal partner.');
      }
      const json = (await me.json()) as { company: PartnerCompany };
      setCompany(json.company);
      const {
        data: { session },
      } = await supabasePartner.auth.getSession();
      setUserEmail(session?.user?.email?.trim().toLowerCase() ?? email.trim().toLowerCase());
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'No se pudo iniciar sesión.';
      setAuthError(msg);
    }
  };

  const doLogout = async () => {
    await supabasePartner.auth.signOut();
    setSelectedJobId(null);
    setApps([]);
    setCompany(null);
    setUserEmail(null);
  };

  if (loading) {
    return (
      <div className="partner-ph partner-ph-loading">
        <img src={logoUrl} alt="" className="partner-ph-loading-logo" width={48} height={48} />
        <div className="partner-ph-loading-bar" role="progressbar" aria-label="Cargando" />
        <p className="partner-ph-loading-text">Cargando Partner Hub</p>
      </div>
    );
  }

  if (!userEmail) {
    return (
      <div className="partner-ph partner-ph-login-root">
        <div className="partner-ph-login-brand">
          <div className="partner-ph-login-brand-inner">
            <div className="partner-ph-login-badge">Espacio empresas</div>
            <h1 className="partner-ph-login-title">Gestioná tus ofertas con Xplora</h1>
            <p className="partner-ph-login-lead">
              {PUBLIC_BOLSA_ENABLED
                ? 'Publicá en la bolsa oficial, revisá postulantes y mantené tu marca alineada con la comunidad Xplora.'
                : 'Gestioná ofertas y postulantes; la bolsa pública del sitio está pausada por ahora.'}{' '}
              Acceso exclusivo para empresas asociadas.
            </p>
          </div>
        </div>
        <div className="partner-ph-login-panel">
          <div className="partner-ph-login-card">
            <div className="partner-ph-login-card-head">
              <img src={logoUrl} alt="Xplora" className="partner-ph-login-card-logo" width={56} height={56} />
              <h2 className="partner-ph-login-card-title">Partner Hub</h2>
              <p className="partner-ph-login-card-sub">Ingresá con el email y contraseña que te asignó el equipo Xplora.</p>
            </div>
            <form onSubmit={doLogin}>
              <div className="partner-ph-field">
                <label className="partner-ph-label" htmlFor="partner-email">
                  Email corporativo
                </label>
                <input
                  id="partner-email"
                  className="partner-ph-input"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  inputMode="email"
                  autoComplete="username"
                  required
                />
              </div>
              <div className="partner-ph-field">
                <label className="partner-ph-label" htmlFor="partner-password">
                  Contraseña
                </label>
                <input
                  id="partner-password"
                  className="partner-ph-input"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  type="password"
                  autoComplete="current-password"
                  required
                />
              </div>
              {authError ? <p className="partner-ph-error">{authError}</p> : null}
              <button type="submit" className="partner-ph-btn-primary">
                Entrar al panel
              </button>
            </form>
            <div className="partner-ph-login-help">
              <p>¿Necesitás acceso? Contactá al equipo Xplora.</p>
              <div className="partner-ph-links-row">
                {QUICK_LINKS.map(({ href, label, Icon }) => (
                  <a key={href} href={href} className="partner-ph-link-pill">
                    <Icon />
                    {label}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const companyInitial = (company?.name || 'E').trim().charAt(0).toUpperCase();

  return (
    <div className="partner-ph partner-ph-app">
      <header className="partner-ph-topbar">
        <div className="partner-ph-brand-row">
          <img src={logoUrl} alt="Xplora" className="partner-ph-top-logo" width={40} height={40} />
          <div className="partner-ph-top-titles">
            <p className="partner-ph-top-kicker">{PUBLIC_BOLSA_ENABLED ? 'Xplora · Bolsa de empleo' : 'Xplora · Partner Hub'}</p>
            <h1 className="partner-ph-top-title">Partner Hub</h1>
          </div>
        </div>
        <div className="partner-ph-top-actions">
          <div className="partner-ph-user-pill" title={userEmail}>
            <span>{userEmail}</span>
          </div>
          <button type="button" className="partner-ph-btn-ghost" onClick={() => void doLogout()}>
            Cerrar sesión
          </button>
        </div>
      </header>

      <nav className="partner-ph-quick" aria-label="Accesos rápidos">
        <div className="partner-ph-quick-inner">
          <span className="partner-ph-quick-label">Accesos</span>
          {QUICK_LINKS.map(({ href, label, Icon }) => (
            <a key={href} href={href} className="partner-ph-quick-link">
              <Icon />
              {label}
            </a>
          ))}
        </div>
      </nav>

      <main className="partner-ph-main">
        {company ? (
          <section className="partner-ph-company" aria-labelledby="partner-company-heading">
            {company.logo_url?.trim() ? (
              <img className="partner-ph-company-logo" src={company.logo_url} alt="" />
            ) : (
              <div className="partner-ph-company-logo ph-placeholder" aria-hidden>
                {companyInitial}
              </div>
            )}
            <div className="partner-ph-company-body">
              <h2 id="partner-company-heading" className="partner-ph-company-name">
                {company.name}
              </h2>
              <p className="partner-ph-company-meta">
                {company.domain?.trim() ? (
                  <>
                    Sitio web · {company.domain}
                    <br />
                  </>
                ) : null}
                Las ofertas que publiqués{' '}
                {PUBLIC_BOLSA_ENABLED ? (
                  <>
                    aparecen en la <a href="/bolsa">Bolsa de empleo</a> del sitio Xplora (comunidad UCEMA). Los candidatos
                    postulan con su perfil Talento.
                  </>
                ) : (
                  <>quedan guardadas; la bolsa pública del sitio está pausada. Los candidatos podrán postular con Talento cuando se reactive.</>
                )}
              </p>
            </div>
            <div className="partner-ph-stats">
              <div className="partner-ph-stat">
                <div className="partner-ph-stat-val">{empleos.length}</div>
                <div className="partner-ph-stat-label">Ofertas</div>
              </div>
              <div className="partner-ph-stat">
                <div className="partner-ph-stat-val">
                  {selectedJob
                    ? statusFilter === 'all'
                      ? apps.length
                      : `${filteredApps.length}/${apps.length}`
                    : '—'}
                </div>
                <div className="partner-ph-stat-label">
                  {selectedJob ? (statusFilter === 'all' ? 'Postulantes (esta oferta)' : 'Visibles / total') : 'Postulantes'}
                </div>
              </div>
            </div>
          </section>
        ) : null}

        <div className="partner-ph-grid">
          <section className="partner-ph-panel" aria-labelledby="jobs-heading">
            <div className="partner-ph-panel-head">
              <h2 id="jobs-heading" className="partner-ph-panel-title">
                Mis ofertas
              </h2>
              <button type="button" className="partner-ph-btn-accent" onClick={openCreate}>
                + Nueva oferta
              </button>
            </div>
            <div className="partner-ph-panel-body">
              {jobsError ? <p className="partner-ph-error">{jobsError}</p> : null}
              {empleos.length === 0 && !jobsError ? (
                <p className="partner-ph-empty">
                  Todavía no publicaste ofertas. Creá la primera
                  {PUBLIC_BOLSA_ENABLED ? ' para aparecer en la bolsa Xplora.' : ' para cuando reactivemos la bolsa pública.'}
                </p>
              ) : (
                <div className="partner-ph-job">
                  {empleos.map(j => (
                    <article
                      key={j.id}
                      className={`partner-ph-job-card${selectedJobId === j.id ? ' ph-selected' : ''}`}
                    >
                      <button
                        type="button"
                        className="partner-ph-job-main"
                        onClick={() => {
                          setSelectedJobId(j.id);
                          void loadApps(j.id);
                        }}
                      >
                        <div className="partner-ph-job-title">
                          {j.emoji ? `${j.emoji} ` : ''}
                          {j.title}
                        </div>
                        <div className="partner-ph-job-tags">
                          {j.area ? <span className="partner-ph-tag ph-accent">{j.area}</span> : null}
                          {j.location ? <span className="partner-ph-tag">{j.location}</span> : null}
                          <span className="partner-ph-tag">{j.type}</span>
                        </div>
                      </button>
                      <div className="partner-ph-job-actions">
                        <button type="button" className="partner-ph-btn-sm" onClick={() => openEdit(j)}>
                          Editar
                        </button>
                        <button type="button" className="partner-ph-btn-sm ph-danger" onClick={() => void deleteJob(j)}>
                          Eliminar
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </section>

          <section className="partner-ph-panel" aria-labelledby="apps-heading">
            <div className="partner-ph-panel-head">
              <h2 id="apps-heading" className="partner-ph-panel-title">
                Postulantes
              </h2>
            </div>
            <div className="partner-ph-panel-body partner-ph-apps-shell">
              {!selectedJob ? (
                <p className="partner-ph-empty">Seleccioná una oferta a la izquierda para ver candidatos y sus datos.</p>
              ) : (
                <>
                  <div className="partner-ph-apps-head">
                    <h3 className="partner-ph-apps-head-title">{selectedJob.title}</h3>
                    <p className="partner-ph-apps-head-meta">
                      {selectedJob.location} · {selectedJob.type}
                      {selectedJob.area ? ` · ${selectedJob.area}` : ''}
                      {apps.length > 0 && statusFilter !== 'all'
                        ? ` · Filtro: ${pipelineLabel(statusFilter)}`
                        : ''}
                    </p>
                  </div>
                  {appsLoading ? (
                    <p className="partner-ph-empty">Cargando postulaciones…</p>
                  ) : appsError ? (
                    <p className="partner-ph-error">{appsError}</p>
                  ) : apps.length === 0 ? (
                    <p className="partner-ph-empty">
                      Aún no hay postulaciones para esta oferta.
                      {PUBLIC_BOLSA_ENABLED ? (
                        <>
                          {' '}
                          Tu oferta ya está en la <a href="/bolsa">Bolsa de empleo</a>: compartí el link para que los
                          candidatos postulen con Talento.
                        </>
                      ) : (
                        ' La bolsa pública está pausada; cuando vuelva a estar activa podrás compartir el listado con candidatos.'
                      )}
                    </p>
                  ) : (
                    <>
                      <div className="partner-ph-pipeline-filters" role="tablist" aria-label="Filtrar por estado">
                        <button
                          type="button"
                          className={`partner-ph-filter-chip${statusFilter === 'all' ? ' ph-active' : ''}`}
                          onClick={() => setStatusFilter('all')}
                        >
                          Todos ({apps.length})
                        </button>
                        {PIPELINE_STATUSES.map(st => {
                          const count = apps.filter(a => normalizeApplicationStatus(a.status) === st.id).length;
                          return (
                            <button
                              key={st.id}
                              type="button"
                              className={`partner-ph-filter-chip ph-st-${st.id}${statusFilter === st.id ? ' ph-active' : ''}`}
                              onClick={() => setStatusFilter(st.id)}
                            >
                              {st.label} ({count})
                            </button>
                          );
                        })}
                      </div>
                      {filteredApps.length === 0 ? (
                        <p className="partner-ph-empty">
                          No hay candidatos con este estado. Elegí otro filtro o cambiá el pipeline de algún postulante.
                        </p>
                      ) : (
                        <div className="partner-ph-apps-list">
                          {filteredApps.map(a => {
                            const p = a.snapshot?.profile ?? {};
                            const st = normalizeApplicationStatus(a.status);
                            return (
                              <article key={a.id} className={`partner-ph-app-card ph-st-card-${st}`}>
                                <div className="partner-ph-app-top">
                                  <div className="partner-ph-app-name-row">
                                    <span className="partner-ph-app-name">{p.full_name || p.email || 'Postulante'}</span>
                                    <span className={`partner-ph-status-pill ph-st-${st}`}>{pipelineLabel(a.status)}</span>
                                  </div>
                                  <time className="partner-ph-app-date" dateTime={a.created_at}>
                                    {fmtDate(a.created_at)}
                                  </time>
                                </div>
                                <div className="partner-ph-app-controls">
                                  <label className="partner-ph-pipeline-label" htmlFor={`st-${a.id}`}>
                                    Pipeline
                                  </label>
                                  <select
                                    id={`st-${a.id}`}
                                    className="partner-ph-status-select"
                                    value={st}
                                    disabled={patchingAppId === a.id}
                                    onChange={e => void patchApplication(a.id, { status: e.target.value })}
                                  >
                                    {PIPELINE_STATUSES.map(opt => (
                                      <option key={opt.id} value={opt.id}>
                                        {opt.label}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                <div className="partner-ph-app-grid">
                                  <div>
                                    <span className="partner-ph-k">Email</span>
                                    <div className="partner-ph-v">{p.email || '—'}</div>
                                  </div>
                                  <div>
                                    <span className="partner-ph-k">Teléfono</span>
                                    <div className="partner-ph-v">{p.phone || '—'}</div>
                                  </div>
                                  <div>
                                    <span className="partner-ph-k">Carrera</span>
                                    <div className="partner-ph-v">{p.career || '—'}</div>
                                  </div>
                                  <div>
                                    <span className="partner-ph-k">LinkedIn</span>
                                    <div className="partner-ph-v">{p.linkedin_url || '—'}</div>
                                  </div>
                                  <div style={{ gridColumn: '1 / -1' }}>
                                    <span className="partner-ph-k">CV</span>
                                    <div className="partner-ph-v">{p.cv_url || '—'}</div>
                                  </div>
                                </div>
                                {a.snapshot?.cover_letter ? (
                                  <div className="partner-ph-app-msg">
                                    <span className="partner-ph-k">Mensaje del candidato</span>
                                    <div className="partner-ph-v">{String(a.snapshot.cover_letter)}</div>
                                  </div>
                                ) : null}
                                <div className="partner-ph-notes-block">
                                  <label className="partner-ph-k" htmlFor={`notes-${a.id}`}>
                                    Notas internas (solo tu empresa)
                                  </label>
                                  <textarea
                                    id={`notes-${a.id}`}
                                    className="partner-ph-notes-input"
                                    rows={2}
                                    value={noteDrafts[a.id] ?? ''}
                                    onChange={e =>
                                      setNoteDrafts(prev => ({
                                        ...prev,
                                        [a.id]: e.target.value,
                                      }))
                                    }
                                    placeholder="Ej.: Referido por… / feedback del hiring manager"
                                  />
                                  <button
                                    type="button"
                                    className="partner-ph-btn-notes-save"
                                    disabled={
                                      patchingAppId === a.id || (noteDrafts[a.id] ?? '') === (a.notes ?? '')
                                    }
                                    onClick={() =>
                                      void patchApplication(a.id, { notes: noteDrafts[a.id] ?? '' })
                                    }
                                  >
                                    {patchingAppId === a.id ? 'Guardando…' : 'Guardar nota'}
                                  </button>
                                </div>
                              </article>
                            );
                          })}
                        </div>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          </section>
        </div>
      </main>

      {formOpen && editing ? (
        <div className="partner-ph-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="modal-title" onClick={() => setFormOpen(false)}>
          <div className="partner-ph-modal" onClick={e => e.stopPropagation()}>
            <div className="partner-ph-modal-head">
              <div>
                <p className="partner-ph-modal-kicker">{editing.id ? 'Editar oferta' : 'Nueva oferta'}</p>
                <h3 id="modal-title" className="partner-ph-modal-title">
                  {editing.title.trim() || 'Sin título'}
                </h3>
              </div>
              <button type="button" className="partner-ph-modal-close" onClick={() => setFormOpen(false)} aria-label="Cerrar">
                ×
              </button>
            </div>
            <div className="partner-ph-modal-body">
              <div className="partner-ph-form-grid">
                <Field label="Título" value={editing.title} onChange={v => setEditing({ ...editing, title: v })} />
                <div className="partner-ph-field">
                  <span className="partner-ph-label">Empresa</span>
                  <input className="partner-ph-input" value={company?.name ?? editing.company} disabled readOnly />
                </div>
                <Field label="Ubicación" value={editing.location} onChange={v => setEditing({ ...editing, location: v })} />
                <Field label="Tipo de contrato" value={editing.type} onChange={v => setEditing({ ...editing, type: v })} />
                <Field label="Área" value={editing.area} onChange={v => setEditing({ ...editing, area: v })} />
                <Field label="Emoji" value={String(editing.emoji ?? '')} onChange={v => setEditing({ ...editing, emoji: v })} />
              </div>

              <span className="partner-ph-section-label">Descripción del puesto</span>
              <textarea
                className="partner-ph-textarea"
                rows={4}
                value={editing.description ?? ''}
                onChange={e => setEditing({ ...editing, description: e.target.value })}
              />

              <span className="partner-ph-section-label">Requisitos</span>
              <textarea
                className="partner-ph-textarea"
                rows={4}
                value={editing.requirements ?? ''}
                onChange={e => setEditing({ ...editing, requirements: e.target.value })}
              />

              <span className="partner-ph-section-label">Beneficios</span>
              <textarea
                className="partner-ph-textarea"
                rows={4}
                value={editing.benefits ?? ''}
                onChange={e => setEditing({ ...editing, benefits: e.target.value })}
              />

              {jobsError ? <p className="partner-ph-error">{jobsError}</p> : null}

              <div className="partner-ph-modal-footer">
                <button type="button" className="partner-ph-btn-ghost" onClick={() => setFormOpen(false)}>
                  Cancelar
                </button>
                <button
                  type="button"
                  className="partner-ph-btn-primary"
                  style={{ width: 'auto', marginTop: 0, paddingLeft: 22, paddingRight: 22 }}
                  disabled={savingJob}
                  onClick={() => void saveJob()}
                >
                  {savingJob ? 'Guardando…' : 'Guardar oferta'}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const id = useId();
  return (
    <div className="partner-ph-field">
      <label className="partner-ph-label" htmlFor={id}>
        {label}
      </label>
      <input id={id} className="partner-ph-input" value={value} onChange={e => onChange(e.target.value)} />
    </div>
  );
}
