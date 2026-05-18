import { useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { apiUrl } from '../lib/apiBase';
import { PUBLIC_BOLSA_ENABLED, publicApplyReturnBasePath } from '../config/publicFeatures';

type TalentProfile = {
  user_id: string;
  email: string;
  full_name: string;
  phone: string;
  photo_url?: string;
  career: string;
  graduation_year: string;
  linkedin_url: string;
  portfolio_url: string;
  cv_url: string;
  about: string;
};

type TalentApplicationRow = {
  id: string;
  status: string;
  created_at: string;
  job_id: string;
  empleos?: {
    id: string;
    title: string;
    company: string;
    emoji?: string | null;
    location?: string | null;
    type?: string | null;
    area?: string | null;
  } | null;
};

function fmtDate(ts: string): string {
  try {
    return new Date(ts).toLocaleString('es-AR', { dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return ts;
  }
}

function useLoadingDots(active: boolean): string {
  const [dots, setDots] = useState('');
  useEffect(() => {
    if (!active) {
      setDots('');
      return;
    }
    const id = window.setInterval(() => {
      setDots(prev => (prev.length >= 3 ? '' : `${prev}.`));
    }, 350);
    return () => window.clearInterval(id);
  }, [active]);
  return dots;
}

async function authFetchJson(path: string, init?: RequestInit) {
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

async function authFetchForm(path: string, form: FormData) {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return fetch(apiUrl(path), {
    method: 'POST',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      // NO setear Content-Type: el browser arma el boundary de multipart.
    },
    body: form,
  });
}

export default function Talento() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [otpEmail, setOtpEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [otpEnabled, setOtpEnabled] = useState(false);
  const [sendingMagic, setSendingMagic] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const sendDots = useLoadingDots(sendingMagic);
  const verifyDots = useLoadingDots(verifyingOtp);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const [profile, setProfile] = useState<TalentProfile | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingCv, setUploadingCv] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [memberNombre, setMemberNombre] = useState('');
  const [memberCarrera, setMemberCarrera] = useState('');
  const [memberCema, setMemberCema] = useState(true);
  const [apps, setApps] = useState<TalentApplicationRow[]>([]);
  const [appsLoading, setAppsLoading] = useState(false);
  const [appsError, setAppsError] = useState('');
  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const cvInputRef = useRef<HTMLInputElement | null>(null);
  const returnApplyId = (() => {
    const h = String(window.location.hash || '');
    const m = h.match(/^#apply=([a-f0-9-]+)$/i);
    return m?.[1] ?? null;
  })();

  const displayName = useMemo(() => {
    const n = String(profile?.full_name ?? memberNombre ?? '').trim();
    return n || 'Mi perfil';
  }, [profile?.full_name, memberNombre]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUserEmail(data.session?.user?.email ?? null);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
      setUserEmail(session?.user?.email ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!userEmail) return;
    void (async () => {
      const boot = await authFetchJson('/api/talent/bootstrap');
      if (boot.ok) {
        const json = (await boot.json()) as any;
        setNeedsOnboarding(Boolean(json.needs_onboarding));
        if (json.member) {
          setMemberNombre(String(json.member.nombre ?? '').trim());
          setMemberCarrera(String(json.member.carrera ?? '').trim());
          setMemberCema(Boolean(json.member.es_alumno_cema));
        }
        setProfile((json.talent_profile as TalentProfile | null) ?? null);
        if (json.member && !json.talent_profile) {
          setProfile({
            user_id: '',
            email: userEmail,
            full_name: String(json.member.nombre ?? '').trim(),
            phone: '',
            career: String(json.member.carrera ?? '').trim(),
            graduation_year: '',
            linkedin_url: '',
            portfolio_url: '',
            cv_url: '',
            about: '',
          });
        }
        return;
      }

      const res = await authFetchJson('/api/talent/profile');
      if (!res.ok) return;
      setProfile(((await res.json()) as TalentProfile | null) ?? null);
    })();
  }, [userEmail]);

  useEffect(() => {
    if (!userEmail) return;
    void (async () => {
      setAppsError('');
      setAppsLoading(true);
      const res = await authFetchJson('/api/talent/applications');
      setAppsLoading(false);
      if (!res.ok) {
        setAppsError(await res.text());
        return;
      }
      setApps((await res.json()) as TalentApplicationRow[]);
    })();
  }, [userEmail]);

  const sendMagic = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');
    setMsg('');
    setSendingMagic(true);
    const cleaned = email.trim();
    setOtpEmail(cleaned);
    setOtpEnabled(true);
    const redirectTo = `${window.location.origin}/talento`;
    const { error } = await supabase.auth.signInWithOtp({
      email: cleaned,
      options: { emailRedirectTo: redirectTo },
    });
    setSendingMagic(false);
    if (error) setErr(error.message);
    else setMsg('Te enviamos un link a tu email para ingresar. Si te llegó un código, también lo podés pegar acá.');
  };

  const verifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');
    setMsg('');
    const code = otp.trim();
    const em = (otpEmail || email).trim();
    if (!em) {
      setErr('Ingresá tu email.');
      return;
    }
    if (!code) {
      setErr('Ingresá el código.');
      return;
    }
    setVerifyingOtp(true);
    const { error } = await supabase.auth.verifyOtp({
      email: em,
      token: code,
      type: 'email',
    });
    setVerifyingOtp(false);
    if (error) setErr(error.message);
    else setMsg('¡Listo! Ya iniciaste sesión.');
  };

  const save = async () => {
    if (!profile) return;
    setSaving(true);
    const res = await authFetchJson('/api/talent/profile', { method: 'PUT', body: JSON.stringify(profile) });
    setSaving(false);
    if (!res.ok) {
      setErr(await res.text());
      return;
    }
    setMsg('Perfil guardado.');
    setProfile((await res.json()) as TalentProfile);
  };

  const submitOnboarding = async () => {
    setErr('');
    setMsg('');
    setSaving(true);
    const payload = {
      nombre: memberNombre.trim(),
      carrera: memberCarrera.trim(),
      es_alumno_cema: memberCema,
      full_name: (profile?.full_name ?? memberNombre).trim(),
      phone: profile?.phone ?? '',
      graduation_year: profile?.graduation_year ?? '',
      linkedin_url: profile?.linkedin_url ?? '',
      portfolio_url: profile?.portfolio_url ?? '',
      cv_url: profile?.cv_url ?? '',
      about: profile?.about ?? '',
    };
    const res = await authFetchJson('/api/talent/onboard', { method: 'POST', body: JSON.stringify(payload) });
    setSaving(false);
    if (!res.ok) {
      setErr(await res.text());
      return;
    }
    const json = (await res.json()) as any;
    setNeedsOnboarding(false);
    setProfile((json.talent_profile as TalentProfile) ?? profile);
    setMsg('Listo. Tu perfil quedó creado.');
  };

  const uploadPhoto = async (file: File) => {
    setErr('');
    setMsg('');
    setUploadingPhoto(true);
    const form = new FormData();
    form.append('file', file);
    const res = await authFetchForm('/api/talent/profile/photo', form);
    setUploadingPhoto(false);
    if (!res.ok) {
      setErr(await res.text());
      return;
    }
    const json = (await res.json()) as any;
    if (json?.profile) setProfile(json.profile as TalentProfile);
    else setMsg('Foto actualizada.');
  };

  const uploadCv = async (file: File) => {
    setErr('');
    setMsg('');
    if (file.type !== 'application/pdf') {
      setErr('Subí tu CV en PDF.');
      return;
    }
    setUploadingCv(true);
    const form = new FormData();
    form.append('cv', file);
    const res = await authFetchForm('/api/talent/profile/cv', form);
    setUploadingCv(false);
    if (!res.ok) {
      setErr(await res.text());
      return;
    }
    const json = (await res.json()) as any;
    if (json?.profile) setProfile(json.profile as TalentProfile);
    else setMsg('CV actualizado.');
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setMsg('');
    setErr('');
  };

  if (!userEmail) {
    return (
      <div style={s.wrap}>
        <div style={s.card}>
          <h1 style={s.h1}>Mi perfil</h1>
          <p style={s.sub}>Ingresá con magic link (o código) para ver y completar tu perfil.</p>
          <form onSubmit={sendMagic}>
            <label style={s.label}>Email</label>
            <input
              style={s.input}
              value={email}
              onChange={e => setEmail(e.target.value)}
              inputMode="email"
              required
              disabled={sendingMagic || verifyingOtp}
            />
            {err ? <p style={s.err}>{err}</p> : null}
            {msg ? <p style={s.ok}>{msg}</p> : null}
            <button
              type="submit"
              style={{ ...s.btn, opacity: sendingMagic ? 0.72 : 1 }}
              disabled={sendingMagic || verifyingOtp}
            >
              {sendingMagic ? `Enviando${sendDots}` : 'Enviar link'}
            </button>
          </form>

          {otpEnabled ? (
            <>
              <div style={s.dividerRow}>
                <div style={s.dividerLine} />
                <div style={s.dividerText}>o</div>
                <div style={s.dividerLine} />
              </div>

              <form onSubmit={verifyCode}>
                <label style={s.label}>Código</label>
                <input
                  style={s.input}
                  value={otp}
                  onChange={e => setOtp(e.target.value)}
                  inputMode="numeric"
                  placeholder="Ej: 123456"
                  disabled={sendingMagic || verifyingOtp}
                />
                <button
                  type="submit"
                  style={{ ...s.btnSecondary, opacity: verifyingOtp ? 0.72 : 1 }}
                  disabled={sendingMagic || verifyingOtp}
                >
                  {verifyingOtp ? `Verificando${verifyDots}` : 'Ingresar con código'}
                </button>
              </form>
            </>
          ) : null}
        </div>
      </div>
    );
  }

  const p = profile ?? {
    user_id: '',
    email: userEmail,
    full_name: '',
    phone: '',
    photo_url: '',
    career: '',
    graduation_year: '',
    linkedin_url: '',
    portfolio_url: '',
    cv_url: '',
    about: '',
  };

  return (
    <div style={s.page}>
      <header style={s.top}>
        <div style={{ minWidth: 0 }}>
          <div style={s.kicker}>Mi perfil</div>
          <div style={s.me}>{userEmail}</div>
        </div>
        <button type="button" style={s.out} onClick={() => void signOut()}>
          Salir
        </button>
      </header>

      <div style={s.shell}>
        <div style={s.leftCol}>
          <div style={s.panel}>
            <div style={s.heroRow}>
              <div style={s.avatarWrap}>
                {p.photo_url ? (
                  <img alt={displayName} src={p.photo_url} style={s.avatarImg} />
                ) : (
                  <div style={s.avatarFallback} aria-hidden>
                    {(displayName || 'X').slice(0, 2).toUpperCase()}
                  </div>
                )}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={s.h2}>{displayName}</div>
                <div style={s.smallMuted}>Tu perfil se usa para autocompletar postulaciones.</div>
                <div style={s.assetRow}>
                  <input
                    ref={photoInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={e => {
                      const f = e.target.files?.[0];
                      if (f) void uploadPhoto(f);
                      e.currentTarget.value = '';
                    }}
                  />
                  <button
                    type="button"
                    style={{ ...s.pillBtn, opacity: uploadingPhoto ? 0.6 : 1 }}
                    disabled={uploadingPhoto}
                    onClick={() => photoInputRef.current?.click()}
                  >
                    {uploadingPhoto ? 'Subiendo foto…' : p.photo_url ? 'Cambiar foto' : 'Subir foto'}
                  </button>

                  <input
                    ref={cvInputRef}
                    type="file"
                    accept="application/pdf"
                    style={{ display: 'none' }}
                    onChange={e => {
                      const f = e.target.files?.[0];
                      if (f) void uploadCv(f);
                      e.currentTarget.value = '';
                    }}
                  />
                  <button
                    type="button"
                    style={{ ...s.pillBtn, opacity: uploadingCv ? 0.6 : 1 }}
                    disabled={uploadingCv}
                    onClick={() => cvInputRef.current?.click()}
                  >
                    {uploadingCv ? 'Subiendo CV…' : p.cv_url ? 'Reemplazar CV (PDF)' : 'Subir CV (PDF)'}
                  </button>

                  {p.cv_url ? (
                    <a href={p.cv_url} target="_blank" rel="noreferrer" style={s.pillLink}>
                      Ver CV
                    </a>
                  ) : (
                    <span style={s.missingTag}>Falta CV</span>
                  )}
                </div>
              </div>
            </div>

            {returnApplyId && PUBLIC_BOLSA_ENABLED ? (
              <div style={s.callout}>
                <div style={s.calloutTitle}>Volver a la postulación</div>
                <div style={s.calloutBody}>Cuando termines, podés volver al empleo donde estabas aplicando.</div>
                <button
                  type="button"
                  style={{ ...s.btn, width: 'auto', marginTop: 10, padding: '10px 14px' }}
                  onClick={() => {
                    window.location.href = `${window.location.origin}${publicApplyReturnBasePath()}#apply=${encodeURIComponent(returnApplyId)}`;
                  }}
                >
                  Volver al empleo →
                </button>
              </div>
            ) : null}

            {needsOnboarding ? (
              <>
                <div style={s.warnCallout}>
                  <div style={s.calloutTitle}>Primero: completá tus datos</div>
                  <div style={s.calloutBody}>
                    No encontramos tu email en la base de miembros. Completá esto para crear tu registro y habilitarte a aplicar.
                  </div>
                </div>

                <div style={s.grid}>
                  <Field label="Nombre y apellido" value={memberNombre} onChange={v => setMemberNombre(v)} />
                  <Field label="Carrera" value={memberCarrera} onChange={v => setMemberCarrera(v)} />
                  <div>
                    <label style={s.label}>¿Sos estudiante del CEMA?</label>
                    <select style={s.input} value={memberCema ? 'yes' : 'no'} onChange={e => setMemberCema(e.target.value === 'yes')}>
                      <option value="yes">Sí</option>
                      <option value="no">No</option>
                    </select>
                  </div>
                  <Field label="Teléfono" value={p.phone} onChange={v => setProfile({ ...(p as any), phone: v })} />
                  <Field label="LinkedIn" value={p.linkedin_url} onChange={v => setProfile({ ...(p as any), linkedin_url: v })} />
                </div>

                <label style={{ ...s.label, marginTop: 12 }}>Sobre mí</label>
                <textarea style={s.ta} value={p.about} onChange={e => setProfile({ ...(p as any), about: e.target.value })} rows={5} />

                {err ? <p style={s.err}>{err}</p> : null}
                {msg ? <p style={s.ok}>{msg}</p> : null}

                <button
                  type="button"
                  style={{ ...s.btn, opacity: saving ? 0.6 : 1 }}
                  onClick={() => void submitOnboarding()}
                  disabled={saving}
                >
                  {saving ? 'Guardando…' : 'Crear mi perfil'}
                </button>
              </>
            ) : (
              <>
                <div style={s.grid}>
                  <Field label="Nombre y apellido" value={p.full_name} onChange={v => setProfile({ ...(p as any), full_name: v })} />
                  <Field label="Teléfono" value={p.phone} onChange={v => setProfile({ ...(p as any), phone: v })} />
                  <Field label="Carrera" value={p.career} onChange={v => setProfile({ ...(p as any), career: v })} />
                  <Field label="Año egreso" value={p.graduation_year} onChange={v => setProfile({ ...(p as any), graduation_year: v })} />
                  <Field label="LinkedIn" value={p.linkedin_url} onChange={v => setProfile({ ...(p as any), linkedin_url: v })} />
                  <Field label="Portfolio" value={p.portfolio_url} onChange={v => setProfile({ ...(p as any), portfolio_url: v })} />
                </div>

                <label style={{ ...s.label, marginTop: 12 }}>Sobre mí</label>
                <textarea style={s.ta} value={p.about} onChange={e => setProfile({ ...(p as any), about: e.target.value })} rows={5} />

                {err ? <p style={s.err}>{err}</p> : null}
                {msg ? <p style={s.ok}>{msg}</p> : null}

                <button type="button" style={{ ...s.btn, opacity: saving ? 0.6 : 1 }} onClick={() => void save()} disabled={saving}>
                  {saving ? 'Guardando…' : 'Guardar cambios'}
                </button>
              </>
            )}
          </div>
        </div>

        <aside style={s.rightCol}>
          <div style={s.panel}>
            <div style={s.sideTitle}>Mis postulaciones</div>
            <div style={s.sideSub}>Acá aparecen las postulaciones que hiciste desde Xplora.</div>

            {appsLoading ? <div style={s.sideLoading}>Cargando…</div> : null}
            {appsError ? <div style={s.sideError}>{appsError}</div> : null}

            {!appsLoading && !appsError && apps.length === 0 ? (
              <div style={s.sideEmpty}>
                {PUBLIC_BOLSA_ENABLED ? (
                  <>
                    Todavía no tenés postulaciones. Podés ver oportunidades en{' '}
                    <a href="/bolsa" style={s.inlineLink}>
                      Bolsa de empleo
                    </a>
                    .
                  </>
                ) : (
                  'Todavía no tenés postulaciones. La bolsa de empleo pública está pausada por ahora.'
                )}
              </div>
            ) : null}

            {!appsLoading && !appsError && apps.length > 0 ? (
              <div style={s.appsList}>
                {apps.map(a => {
                  const job = a.empleos;
                  return (
                    <div key={a.id} style={s.appItem}>
                      <div style={s.appTop}>
                        <div style={s.appTitle}>
                          <span style={{ marginRight: 8 }}>{job?.emoji || '💼'}</span>
                          <span style={{ fontWeight: 900 }}>{job?.title || 'Empleo'}</span>
                        </div>
                        <span style={s.statusPill}>{String(a.status || 'new')}</span>
                      </div>
                      <div style={s.appMeta}>
                        <div style={s.metaLine}>{job?.company ? job.company : '—'}</div>
                        <div style={s.metaLine}>{fmtDate(a.created_at)}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : null}
          </div>
        </aside>
      </div>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label style={s.label}>{label}</label>
      <input style={s.input} value={value} onChange={e => onChange(e.target.value)} />
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  wrap: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    background: '#f6f1ea',
  },
  card: {
    width: '100%',
    maxWidth: 440,
    background: 'linear-gradient(165deg, #ffffff 0%, #faf8fc 52%, #f4f1fa 100%)',
    borderRadius: 20,
    border: '1px solid rgba(96, 62, 249, 0.14)',
    boxShadow: '0 12px 42px rgba(96, 62, 249, 0.07), 0 4px 14px rgba(26, 16, 40, 0.05)',
    padding: 30,
  },
  h1: { fontFamily: "'Fraunces', serif", margin: 0, marginBottom: 8, color: 'var(--ink)', letterSpacing: '-0.02em' },
  sub: { marginTop: 0, color: 'var(--ink-muted)', fontSize: 13, lineHeight: 1.5, marginBottom: 18 },
  label: { display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--ink-muted)', marginBottom: 6 },
  input: { width: '100%', padding: '10px 12px', borderRadius: 12, border: '1.5px solid var(--border-warm)', fontSize: 14, boxSizing: 'border-box' },
  ta: { width: '100%', padding: '10px 12px', borderRadius: 12, border: '1.5px solid var(--border-warm)', fontSize: 14, boxSizing: 'border-box', fontFamily: "'Instrument Sans', sans-serif" },
  btn: { width: '100%', marginTop: 14, padding: '12px 14px', borderRadius: 12, border: 'none', background: 'var(--ink)', color: '#fff', fontWeight: 800, cursor: 'pointer' },
  btnSecondary: {
    width: '100%',
    marginTop: 10,
    padding: '12px 14px',
    borderRadius: 12,
    border: '1.5px solid rgba(26,16,40,0.12)',
    background: '#fff',
    color: 'var(--ink)',
    fontWeight: 900,
    cursor: 'pointer',
  },
  err: { color: '#9b2c20', fontSize: 13, margin: '10px 0 0' },
  ok: { color: '#1f6f3a', fontSize: 13, margin: '10px 0 0' },
  dividerRow: { display: 'flex', alignItems: 'center', gap: 10, margin: '14px 0 8px' },
  dividerLine: { flex: 1, height: 1, background: 'rgba(26,16,40,0.10)' },
  dividerText: { fontSize: 12, fontWeight: 900, color: 'var(--ink-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' },
  hint: { marginTop: 10, fontSize: 12, color: 'var(--ink-muted)', lineHeight: 1.45 },
  page: { minHeight: '100vh', background: '#f6f1ea', padding: '18px 18px 40px' },
  top: { maxWidth: 1120, margin: '0 auto 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 14 },
  kicker: { fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--purple)', fontWeight: 900 },
  me: { fontSize: 13, color: 'var(--ink)', fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  out: {
    border: '1px solid rgba(26,16,40,0.12)',
    borderRadius: 999,
    padding: '9px 14px',
    background: '#fff',
    cursor: 'pointer',
    fontWeight: 800,
    flexShrink: 0,
  },
  shell: { maxWidth: 1120, margin: '0 auto', display: 'grid', gridTemplateColumns: '1.35fr 0.85fr', gap: 16, alignItems: 'start' },
  leftCol: { minWidth: 0 },
  rightCol: { minWidth: 0 },
  panel: {
    background: 'linear-gradient(165deg, #ffffff 0%, #faf8fc 52%, #f4f1fa 100%)',
    borderRadius: 18,
    border: '1px solid rgba(96, 62, 249, 0.14)',
    padding: 18,
    boxShadow: '0 12px 42px rgba(96, 62, 249, 0.07), 0 4px 14px rgba(26, 16, 40, 0.05)',
  },
  h2: { fontFamily: "'Fraunces', serif", fontSize: 20, fontWeight: 800, color: 'var(--ink)', letterSpacing: '-0.02em' },
  heroRow: { display: 'grid', gridTemplateColumns: '76px 1fr', gap: 14, alignItems: 'center', marginBottom: 14 },
  avatarWrap: { width: 76, height: 76, borderRadius: 22, overflow: 'hidden', background: 'rgba(96,62,249,0.10)', border: '1px solid rgba(96,62,249,0.16)' },
  avatarImg: { width: '100%', height: '100%', objectFit: 'cover', display: 'block' },
  avatarFallback: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: "'Fraunces', serif",
    fontSize: 22,
    fontWeight: 900,
    color: '#fff',
    background: 'linear-gradient(145deg, #603ef9 0%, #4a2fc4 100%)',
  },
  smallMuted: { fontSize: 13, color: 'var(--ink-soft)', marginTop: 4, lineHeight: 1.45 },
  assetRow: { display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 12, alignItems: 'center' },
  pillBtn: {
    border: '1px solid rgba(26,16,40,0.12)',
    borderRadius: 999,
    padding: '9px 12px',
    background: '#fff',
    cursor: 'pointer',
    fontWeight: 800,
    fontSize: 13,
  },
  pillLink: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid rgba(26,16,40,0.12)',
    borderRadius: 999,
    padding: '9px 12px',
    background: 'rgba(96,62,249,0.06)',
    textDecoration: 'none',
    color: 'var(--ink)',
    fontWeight: 900,
    fontSize: 13,
  },
  missingTag: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '8px 10px',
    borderRadius: 999,
    background: 'rgba(200,120,40,0.10)',
    border: '1px solid rgba(200,120,40,0.25)',
    fontSize: 12,
    fontWeight: 900,
    color: 'var(--ink)',
  },
  callout: {
    margin: '14px 0 0',
    padding: 14,
    borderRadius: 16,
    background: 'rgba(96,62,249,0.06)',
    border: '1px solid rgba(96,62,249,0.14)',
  },
  warnCallout: {
    margin: '14px 0 0',
    padding: 14,
    borderRadius: 16,
    background: '#fff8f0',
    border: '1px solid rgba(200,120,40,0.25)',
  },
  calloutTitle: { fontSize: 13, fontWeight: 900, color: 'var(--ink)', marginBottom: 6 },
  calloutBody: { fontSize: 13, color: 'var(--ink-soft)', lineHeight: 1.55 },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 14 },
  sideTitle: { fontFamily: "'Fraunces', serif", fontSize: 18, fontWeight: 900, color: 'var(--ink)' },
  sideSub: { marginTop: 6, color: 'var(--ink-soft)', fontSize: 13, lineHeight: 1.45, marginBottom: 12 },
  sideLoading: { color: 'var(--ink-muted)', fontSize: 13 },
  sideError: { color: '#9b2c20', fontSize: 13, lineHeight: 1.45 },
  sideEmpty: { color: 'var(--ink-soft)', fontSize: 13, lineHeight: 1.55 },
  inlineLink: { color: 'var(--ink)', fontWeight: 900, textDecoration: 'underline' },
  appsList: { display: 'grid', gap: 10, marginTop: 10 },
  appItem: { padding: 12, borderRadius: 16, background: '#fff', border: '1px solid rgba(26,16,40,0.08)' },
  appTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 },
  appTitle: { color: 'var(--ink)', fontSize: 13, lineHeight: 1.35, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' },
  statusPill: {
    flexShrink: 0,
    fontSize: 11,
    fontWeight: 900,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    padding: '6px 10px',
    borderRadius: 999,
    background: 'rgba(26,16,40,0.05)',
    border: '1px solid rgba(26,16,40,0.10)',
    color: 'var(--ink)',
  },
  appMeta: { display: 'flex', justifyContent: 'space-between', gap: 10, marginTop: 8, color: 'var(--ink-muted)', fontSize: 12 },
  metaLine: { whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 },
};

