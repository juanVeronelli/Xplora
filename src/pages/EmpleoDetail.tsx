import { useEffect, useState } from 'react';
import type { Empleo } from '../types';
import Footer from '../components/Footer';
import { BackBtn } from './EventoDetail';
import Tag from '../components/Tag';
import { useIsMobile } from '../hooks/useIsMobile';
import { supabase } from '../lib/supabase';
import { apiUrl } from '../lib/apiBase';
import { publicApplyReturnBasePath } from '../config/publicFeatures';

interface Props {
  empleo: Empleo;
  goBack: () => void;
  autoOpenApply?: boolean;
  onAutoOpenApplyConsumed?: () => void;
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
} | null;

function ApplyModal({
  empleoId,
  empleoTitle,
  open,
  onClose,
}: {
  empleoId: string;
  empleoTitle: string;
  open: boolean;
  onClose: () => void;
}) {
  const [sessionEmail, setSessionEmail] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cover, setCover] = useState('');
  const [profile, setProfile] = useState<TalentProfile>(null);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [toast, setToast] = useState<{ kind: 'error' | 'ok'; text: string } | null>(null);

  const pushToast = (kind: 'error' | 'ok', text: string) => {
    setToast({ kind, text });
    window.setTimeout(() => setToast(null), 3200);
  };

  const missingProfileFields = (() => {
    if (!profile) return ['Perfil de talento'];
    const missing: string[] = [];
    if (!String(profile.full_name || '').trim()) missing.push('Nombre');
    if (!String(profile.career || '').trim()) missing.push('Carrera');
    if (!String(profile.cv_url || '').trim()) missing.push('CV');
    return missing;
  })();

  useEffect(() => {
    if (!open) return;
    setErr('');
    setMsg('');
    setSubmitted(false);
    supabase.auth.getSession().then(({ data }) => {
      setSessionEmail(data.session?.user?.email ?? null);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, s) => {
      setSessionEmail(s?.user?.email ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (!sessionEmail) return;
    void (async () => {
      setLoading(true);
      const res = await authFetch('/api/talent/profile');
      if (res.ok) {
        setProfile(((await res.json()) as TalentProfile) ?? null);
      }
      setLoading(false);
    })();
  }, [open, sessionEmail]);

  const sendMagic = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');
    setMsg('');
    setSending(true);
    const redirectTo = `${window.location.origin}${publicApplyReturnBasePath()}#apply=${encodeURIComponent(empleoId)}`;
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: redirectTo },
    });
    setSending(false);
    if (error) setErr(error.message);
    else setMsg('Te enviamos un link para ingresar y continuar la postulación.');
  };

  const apply = async () => {
    setErr('');
    setMsg('');
    if (missingProfileFields.length > 0) {
      pushToast('error', `Antes de aplicar te falta completar: ${missingProfileFields.join(', ')}.`);
      return;
    }
    setLoading(true);
    const res = await authFetch('/api/talent/apply', {
      method: 'POST',
      body: JSON.stringify({ job_id: empleoId, cover_letter: cover }),
    });
    setLoading(false);
    if (!res.ok) {
      setErr(await res.text());
      pushToast('error', 'No se pudo enviar. Revisá tus datos e intentá de nuevo.');
      return;
    }
    setSubmitted(true);
    setMsg('Postulación enviada.');
    pushToast('ok', 'Postulación enviada.');
  };

  if (!open) return null;

  return (
    <div style={m.overlay} onClick={onClose}>
      <div style={m.card} onClick={e => e.stopPropagation()}>
        <button type="button" style={m.close} onClick={onClose}>
          ✕
        </button>
        <div style={m.kicker}>Aplicar</div>
        <h3 style={m.title}>{empleoTitle}</h3>
        {toast ? (
          <div
            style={{
              margin: '8px 0 10px',
              padding: '10px 12px',
              borderRadius: 12,
              border: toast.kind === 'error' ? '1px solid rgba(155,44,32,0.22)' : '1px solid rgba(31,111,58,0.22)',
              background: toast.kind === 'error' ? 'rgba(155,44,32,0.06)' : 'rgba(31,111,58,0.06)',
              color: toast.kind === 'error' ? '#9b2c20' : '#1f6f3a',
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            {toast.text}
          </div>
        ) : null}

        {!sessionEmail ? (
          <>
            <p style={m.sub}>Ingresá con magic link para autocompletar tus datos y enviar la solicitud.</p>
            <form onSubmit={sendMagic}>
              <label style={m.label}>Email</label>
              <input value={email} onChange={e => setEmail(e.target.value)} style={m.input} inputMode="email" required />
              {err ? <p style={m.err}>{err}</p> : null}
              {msg ? <p style={m.ok}>{msg}</p> : null}
              <button type="submit" style={{ ...m.btn, opacity: sending ? 0.6 : 1 }} disabled={sending}>
                {sending ? 'Enviando…' : 'Enviar link'}
              </button>
            </form>
          </>
        ) : loading && !submitted ? (
          <p style={m.sub}>Cargando…</p>
        ) : (
          <>
            <div style={m.profileBox}>
              <div style={m.profileTitle}>Tus datos (autocompletado)</div>
              <div style={m.profileGrid}>
                <div>
                  <div style={m.k}>Nombre</div>
                  <div style={m.v}>{profile?.full_name || '—'}</div>
                </div>
                <div>
                  <div style={m.k}>Email</div>
                  <div style={m.v}>{profile?.email || sessionEmail}</div>
                </div>
                <div>
                  <div style={m.k}>Teléfono</div>
                  <div style={m.v}>{profile?.phone || '—'}</div>
                </div>
                <div>
                  <div style={m.k}>Carrera</div>
                  <div style={m.v}>{profile?.career || '—'}</div>
                </div>
                <div>
                  <div style={m.k}>LinkedIn</div>
                  <div style={m.v}>{profile?.linkedin_url || '—'}</div>
                </div>
                <div>
                  <div style={m.k}>CV</div>
                  <div style={m.v}>{profile?.cv_url || '—'}</div>
                </div>
              </div>
              <p style={m.hint}>
                Si querés completar/editar estos datos, abrí tu perfil y volvé acá (se reabre el modal).
              </p>
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
              <a
                href={`/talento#apply=${encodeURIComponent(empleoId)}`}
                style={{
                  display: 'inline-block',
                  padding: '9px 12px',
                  borderRadius: 999,
                  border: '1.5px solid rgba(26,16,40,0.12)',
                  background: '#fff',
                  textDecoration: 'none',
                  color: 'var(--ink-soft)',
                  fontSize: 13,
                  fontWeight: 800,
                }}
              >
                Editar mi perfil →
              </a>
            </div>

            {!profile ? (
              <div style={{ ...m.profileBox, background: '#fff8f0', borderColor: 'rgba(200,120,40,0.25)' }}>
                <div style={m.profileTitle}>Falta crear tu perfil</div>
                <p style={m.sub}>(Necesitás perfil de talento para poder aplicar.)</p>
              </div>
            ) : missingProfileFields.length > 0 ? (
              <div style={{ ...m.profileBox, background: '#fff8f0', borderColor: 'rgba(200,120,40,0.25)' }}>
                <div style={m.profileTitle}>Te faltan datos para aplicar</div>
                <p style={m.sub}>Completá: <strong>{missingProfileFields.join(', ')}</strong>.</p>
              </div>
            ) : null}

            <label style={m.label}>Mensaje (opcional)</label>
            <textarea value={cover} onChange={e => setCover(e.target.value)} style={m.ta} rows={5} placeholder="Contales por qué te interesa y tu disponibilidad." />

            {err ? <p style={m.err}>{err}</p> : null}
            {msg ? <p style={m.ok}>{msg}</p> : null}

            <button
              type="button"
              style={{ ...m.btn, opacity: loading || submitted || !profile ? 0.6 : 1 }}
              disabled={loading || submitted || missingProfileFields.length > 0}
              onClick={() => void apply()}
            >
              {submitted ? 'Enviado' : loading ? 'Enviando…' : 'Enviar postulación'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

const m: Record<string, React.CSSProperties> = {
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
    maxWidth: 560,
    background: '#fff',
    borderRadius: 18,
    border: '1px solid rgba(26,16,40,0.10)',
    boxShadow: '0 24px 70px rgba(26,16,40,0.22)',
    padding: 22,
    position: 'relative',
  },
  close: { position: 'absolute', top: 14, right: 14, border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 16, color: 'var(--ink-muted)' },
  kicker: { fontSize: 11, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-muted)' },
  title: { margin: '6px 0 10px', fontFamily: "'Fraunces', serif", fontWeight: 700, color: 'var(--ink)', letterSpacing: '-0.02em' },
  sub: { marginTop: 0, color: 'var(--ink-muted)', fontSize: 13, lineHeight: 1.5, marginBottom: 14 },
  label: { display: 'block', fontSize: 12, fontWeight: 800, color: 'var(--ink-muted)', marginBottom: 6 },
  input: { width: '100%', padding: '10px 12px', borderRadius: 12, border: '1.5px solid var(--border-warm)', fontSize: 14, boxSizing: 'border-box' },
  ta: { width: '100%', padding: '10px 12px', borderRadius: 12, border: '1.5px solid var(--border-warm)', fontSize: 14, boxSizing: 'border-box', fontFamily: "'Instrument Sans', sans-serif" },
  btn: { width: '100%', marginTop: 12, padding: '12px 14px', borderRadius: 12, border: 'none', background: 'var(--ink)', color: '#fff', fontWeight: 900, cursor: 'pointer' },
  err: { color: '#9b2c20', fontSize: 13, margin: '10px 0 0' },
  ok: { color: '#1f6f3a', fontSize: 13, margin: '10px 0 0' },
  profileBox: { margin: '10px 0 14px', padding: 12, borderRadius: 14, background: 'rgba(96,62,249,0.06)', border: '1px solid rgba(96,62,249,0.14)' },
  profileTitle: { fontSize: 13, fontWeight: 900, color: 'var(--ink)', marginBottom: 8 },
  profileGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 },
  k: { fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-muted)' },
  v: { fontSize: 13, color: 'var(--ink)' },
  hint: { margin: '10px 0 0', fontSize: 12, color: 'var(--ink-muted)', lineHeight: 1.5 },
};

export default function EmpleoDetail({ empleo: emp, goBack, autoOpenApply, onAutoOpenApplyConsumed }: Props) {
  const isMobile = useIsMobile();
  const [applyOpen, setApplyOpen] = useState(false);

  useEffect(() => {
    if (!autoOpenApply) return;
    setApplyOpen(true);
    onAutoOpenApplyConsumed?.();
  }, [autoOpenApply, onAutoOpenApplyConsumed]);

  return (
    <>
      <BackBtn onClick={goBack} label="Volver a Bolsa de Empleo" />
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '1fr 320px',
        gap: isMobile ? 24 : 40,
        padding: isMobile ? '16px 16px 40px' : '28px 80px 80px',
        alignItems: 'start',
      }}>
        {/* Main */}
        <div>
          <div style={s.header}>
            <div style={s.ico}>
              {emp.thumbnailUrl ? (
                <img src={emp.thumbnailUrl} alt="" style={s.icoImg} />
              ) : emp.emoji ? (
                <span>{emp.emoji}</span>
              ) : (
                <span style={s.icoLetter}>{emp.title.slice(0, 1).toUpperCase()}</span>
              )}
            </div>
            <div>
              <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                <Tag type={emp.typeTag}>{emp.type}</Tag>
                <Tag type="n">{emp.area}</Tag>
              </div>
              <h1 style={{ ...s.h1, fontSize: isMobile ? 24 : 32 }}>{emp.title}</h1>
              <p style={s.company}>{emp.company} · {emp.location}</p>
            </div>
          </div>

          {emp.description && <Section title="Sobre el puesto"><p style={s.body}>{emp.description}</p></Section>}

          {emp.requirements && (
            <Section title="Requisitos">
              <ul style={s.ul}>
                {emp.requirements.split('\n').filter(Boolean).map((r, i) => (
                  <li key={i} style={s.li}>{r.replace(/^[-–•]\s*/, '')}</li>
                ))}
              </ul>
            </Section>
          )}

          {emp.benefits && (
            <Section title="¿Qué ofrecemos?">
              <ul style={s.ul}>
                {emp.benefits.split('\n').filter(Boolean).map((b, i) => (
                  <li key={i} style={s.li}>{b.replace(/^[-–•]\s*/, '')}</li>
                ))}
              </ul>
            </Section>
          )}

          <div style={s.xploraBox}>
            <h4 style={s.xBoxTitle}>Sobre Xplora UCEMA</h4>
            <p style={s.xBoxP}>
              Xplora es el club de emprendedores de la Universidad del CEMA. Esta oferta fue publicada
              especialmente para nuestra comunidad de estudiantes y egresados.
            </p>
          </div>
        </div>

        {/* Sidebar */}
        <div>
          <div style={{ ...s.sbCard, position: isMobile ? 'static' : 'sticky' }}>
            <h4 style={s.sbTitle}>Detalles</h4>
            <SbItem label="Empresa" value={emp.company || '—'} />
            <SbItem label="Ubicación" value={emp.location || '—'} />
            <SbItem label="Modalidad" value={emp.type || '—'} />
            <SbItem label="Área" value={emp.area || '—'} />

            <button
              type="button"
              style={{ ...s.applyBtn, border: 'none', cursor: 'pointer' }}
              onClick={() => setApplyOpen(true)}
            >
              Aplicar →
            </button>
            <p style={s.sbNote}>Se abre un formulario en esta página (magic link si no estás logueado).</p>
          </div>
        </div>
      </div>
      <Footer minimal />
      <ApplyModal empleoId={emp.id} empleoTitle={emp.title} open={applyOpen} onClose={() => setApplyOpen(false)} />
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <h4 style={{ fontFamily: "'Fraunces', serif", fontSize: 16, fontWeight: 700, marginBottom: 10, color: 'var(--ink)', letterSpacing: '-0.3px' }}>{title}</h4>
      {children}
    </div>
  );
}

function SbItem({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--ink-faint)', display: 'block', marginBottom: 3 }}>{label}</label>
      <span style={{ fontSize: 14, color: 'var(--ink)', fontWeight: 500 }}>{value}</span>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  header: { display: 'flex', alignItems: 'flex-start', gap: 20, marginBottom: 28 },
  ico: {
    width: 64, height: 64, borderRadius: 16, background: 'var(--warm)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 28, flexShrink: 0,
    overflow: 'hidden',
  },
  icoImg: { width: '100%', height: '100%', objectFit: 'cover' },
  icoLetter: {
    fontFamily: "'Fraunces', serif",
    fontSize: 26,
    fontWeight: 700,
    color: 'var(--ink)',
  },
  h1: {
    fontFamily: "'Fraunces', serif",
    fontWeight: 700, letterSpacing: '-1px',
    marginBottom: 4, lineHeight: 1.15, color: 'var(--ink)',
  },
  company: { fontSize: 14, color: 'var(--ink-muted)' },
  body: { color: 'var(--ink-muted)', lineHeight: 1.85, fontSize: 14 },
  ul: { paddingLeft: 0, margin: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 },
  li: {
    color: 'var(--ink-muted)', fontSize: 14, lineHeight: 1.6,
    paddingLeft: 18, position: 'relative',
  },
  xploraBox: {
    borderRadius: 14, border: '1.5px solid rgba(96,62,249,.2)',
    background: 'var(--purple-soft)', padding: 20,
  },
  xBoxTitle: {
    fontFamily: "'Fraunces', serif",
    fontSize: 14, fontWeight: 700, marginBottom: 8, color: 'var(--ink)',
  },
  xBoxP: { fontSize: 12, color: 'var(--ink-muted)', lineHeight: 1.75 },
  sbCard: {
    borderRadius: 16, border: '1.5px solid var(--border-warm)',
    background: 'var(--white)', padding: 24, top: 82,
  },
  sbTitle: {
    fontFamily: "'Fraunces', serif",
    fontSize: 15, fontWeight: 700, marginBottom: 16, color: 'var(--ink)',
  },
  applyBtn: {
    display: 'block', width: '100%', marginTop: 16, padding: 13,
    borderRadius: 12, background: 'var(--purple)', color: 'white',
    textAlign: 'center', textDecoration: 'none', fontWeight: 700,
    fontSize: 14, fontFamily: "'Instrument Sans', sans-serif",
    boxSizing: 'border-box',
  },
  sbNote: { textAlign: 'center', marginTop: 10, fontSize: 11, color: 'var(--ink-faint)' },
};
