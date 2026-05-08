import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { apiUrl } from '../lib/apiBase';

type TalentProfile = {
  user_id: string;
  email: string;
  full_name: string;
  phone: string;
  career: string;
  graduation_year: string;
  linkedin_url: string;
  portfolio_url: string;
  cv_url: string;
  about: string;
};

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

export default function Talento() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const [profile, setProfile] = useState<TalentProfile | null>(null);
  const [saving, setSaving] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [memberNombre, setMemberNombre] = useState('');
  const [memberCarrera, setMemberCarrera] = useState('');
  const [memberCema, setMemberCema] = useState(true);
  const returnApplyId = (() => {
    const h = String(window.location.hash || '');
    const m = h.match(/^#apply=([a-f0-9-]+)$/i);
    return m?.[1] ?? null;
  })();

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
      const boot = await authFetch('/api/talent/bootstrap');
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

      const res = await authFetch('/api/talent/profile');
      if (!res.ok) return;
      setProfile(((await res.json()) as TalentProfile | null) ?? null);
    })();
  }, [userEmail]);

  const sendMagic = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');
    setMsg('');
    const redirectTo = `${window.location.origin}/talento`;
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: redirectTo },
    });
    if (error) setErr(error.message);
    else setMsg('Te enviamos un link a tu email para ingresar.');
  };

  const save = async () => {
    if (!profile) return;
    setSaving(true);
    const res = await authFetch('/api/talent/profile', { method: 'PUT', body: JSON.stringify(profile) });
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
    const res = await authFetch('/api/talent/onboard', { method: 'POST', body: JSON.stringify(payload) });
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
          <h1 style={s.h1}>Acceso Talento</h1>
          <p style={s.sub}>Ingresá con magic link. Usá tu email.</p>
          <form onSubmit={sendMagic}>
            <label style={s.label}>Email</label>
            <input style={s.input} value={email} onChange={e => setEmail(e.target.value)} inputMode="email" required />
            {err ? <p style={s.err}>{err}</p> : null}
            {msg ? <p style={s.ok}>{msg}</p> : null}
            <button type="submit" style={s.btn}>Enviar link</button>
          </form>
        </div>
      </div>
    );
  }

  const p = profile ?? {
    user_id: '',
    email: userEmail,
    full_name: '',
    phone: '',
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
        <div>
          <div style={s.kicker}>Talento</div>
          <div style={s.me}>{userEmail}</div>
        </div>
        <button type="button" style={s.out} onClick={() => void signOut()}>Salir</button>
      </header>

      <div style={s.panel}>
        <h2 style={s.h2}>Mi perfil</h2>
        {returnApplyId ? (
          <div style={{ margin: '0 0 12px', padding: 12, borderRadius: 14, background: 'rgba(96,62,249,0.06)', border: '1px solid rgba(96,62,249,0.14)' }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--ink)', marginBottom: 6 }}>Volver a la postulación</div>
            <button
              type="button"
              style={{ ...s.btn, marginTop: 0, width: 'auto', padding: '10px 14px' }}
              onClick={() => {
                window.location.href = `/bolsa#apply=${encodeURIComponent(returnApplyId)}`;
              }}
            >
              Volver al empleo →
            </button>
          </div>
        ) : null}
        {needsOnboarding ? (
          <>
            <div
              style={{
                margin: '0 0 12px',
                padding: 12,
                borderRadius: 14,
                background: '#fff8f0',
                border: '1px solid rgba(200,120,40,0.25)',
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 900, color: 'var(--ink)', marginBottom: 6 }}>Primero: completá tus datos</div>
              <div style={{ fontSize: 13, color: 'var(--ink-soft)', lineHeight: 1.55 }}>
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
              <Field label="CV (URL)" value={p.cv_url} onChange={v => setProfile({ ...(p as any), cv_url: v })} />
            </div>

            <label style={{ ...s.label, marginTop: 12 }}>Sobre mí</label>
            <textarea style={s.ta} value={p.about} onChange={e => setProfile({ ...(p as any), about: e.target.value })} rows={5} />

            {err ? <p style={s.err}>{err}</p> : null}
            {msg ? <p style={s.ok}>{msg}</p> : null}

            <button type="button" style={{ ...s.btn, opacity: saving ? 0.6 : 1 }} onClick={() => void submitOnboarding()} disabled={saving}>
              {saving ? 'Guardando…' : 'Crear mi perfil'}
            </button>
          </>
        ) : (
          <>
            <div style={s.grid}>
              <Field label="Nombre" value={p.full_name} onChange={v => setProfile({ ...(p as any), full_name: v })} />
              <Field label="Teléfono" value={p.phone} onChange={v => setProfile({ ...(p as any), phone: v })} />
              <Field label="Carrera" value={p.career} onChange={v => setProfile({ ...(p as any), career: v })} />
              <Field label="Año egreso" value={p.graduation_year} onChange={v => setProfile({ ...(p as any), graduation_year: v })} />
              <Field label="LinkedIn" value={p.linkedin_url} onChange={v => setProfile({ ...(p as any), linkedin_url: v })} />
              <Field label="Portfolio" value={p.portfolio_url} onChange={v => setProfile({ ...(p as any), portfolio_url: v })} />
              <Field label="CV (URL)" value={p.cv_url} onChange={v => setProfile({ ...(p as any), cv_url: v })} />
            </div>
            <label style={{ ...s.label, marginTop: 12 }}>Sobre mí</label>
            <textarea style={s.ta} value={p.about} onChange={e => setProfile({ ...(p as any), about: e.target.value })} rows={5} />

            {err ? <p style={s.err}>{err}</p> : null}
            {msg ? <p style={s.ok}>{msg}</p> : null}

            <button type="button" style={{ ...s.btn, opacity: saving ? 0.6 : 1 }} onClick={() => void save()} disabled={saving}>
              {saving ? 'Guardando…' : 'Guardar perfil'}
            </button>
          </>
        )}
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
  wrap: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: '#f6f1ea' },
  card: { width: '100%', maxWidth: 420, background: '#fff', borderRadius: 18, border: '1px solid rgba(26,16,40,0.08)', padding: 28 },
  h1: { fontFamily: "'Fraunces', serif", margin: 0, marginBottom: 8, color: 'var(--ink)', letterSpacing: '-0.02em' },
  sub: { marginTop: 0, color: 'var(--ink-muted)', fontSize: 13, lineHeight: 1.5, marginBottom: 18 },
  label: { display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--ink-muted)', marginBottom: 6 },
  input: { width: '100%', padding: '10px 12px', borderRadius: 12, border: '1.5px solid var(--border-warm)', fontSize: 14, boxSizing: 'border-box' },
  ta: { width: '100%', padding: '10px 12px', borderRadius: 12, border: '1.5px solid var(--border-warm)', fontSize: 14, boxSizing: 'border-box', fontFamily: "'Instrument Sans', sans-serif" },
  btn: { width: '100%', marginTop: 14, padding: '12px 14px', borderRadius: 12, border: 'none', background: 'var(--ink)', color: '#fff', fontWeight: 800, cursor: 'pointer' },
  err: { color: '#9b2c20', fontSize: 13, margin: '10px 0 0' },
  ok: { color: '#1f6f3a', fontSize: 13, margin: '10px 0 0' },
  page: { minHeight: '100vh', background: '#f6f1ea', padding: '18px 22px 40px' },
  top: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  kicker: { fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-muted)', fontWeight: 800 },
  me: { fontSize: 13, color: 'var(--ink)', fontWeight: 700 },
  out: { border: '1px solid rgba(26,16,40,0.12)', borderRadius: 10, padding: '8px 12px', background: '#fff', cursor: 'pointer', fontWeight: 700 },
  panel: { background: '#fff', borderRadius: 16, border: '1px solid rgba(26,16,40,0.08)', padding: 16, maxWidth: 920 },
  h2: { margin: 0, marginBottom: 12, fontFamily: "'Fraunces', serif", color: 'var(--ink)', letterSpacing: '-0.01em' },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 },
};

