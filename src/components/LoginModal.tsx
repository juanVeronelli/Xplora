import { useState } from 'react';

interface Props {
  onLogin: (email: string, password: string) => Promise<{ error: { message: string } | null }>;
  onClose: () => void;
}

const DEFAULT_EMAIL_DOMAIN = '@xploraucema.com';

function normalizeStaffEmail(raw: string): string {
  const v = raw.trim();
  if (!v) return '';
  // Si ya contiene '@', se respeta tal cual (solo trim).
  if (v.includes('@')) return v;
  return `${v}${DEFAULT_EMAIL_DOMAIN}`;
}

export default function LoginModal({ onLogin, onClose }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await onLogin(normalizeStaffEmail(email), password);
    setLoading(false);
    const err = result && 'error' in result ? result.error : null;
    if (err) setError(err.message || 'No se pudo iniciar sesión.');
  };

  return (
    <div style={s.overlay} onClick={onClose}>
      <div style={s.card} onClick={e => e.stopPropagation()}>
        <button style={s.close} onClick={onClose}>✕</button>
        <div style={s.logo}>🔐</div>
        <h2 style={s.title}>Acceso administrativo</h2>
        <p style={s.sub}>Solo personal autorizado</p>

        <form onSubmit={submit}>
          <div style={s.field}>
            <label style={s.label}>Email</label>
            <input
              type="text"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onBlur={() => setEmail((prev) => normalizeStaffEmail(prev))}
              style={s.input}
              placeholder={`usuario o usuario${DEFAULT_EMAIL_DOMAIN}`}
              required
              autoFocus
              inputMode="email"
            />
          </div>
          <div style={s.field}>
            <label style={s.label}>Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={s.input}
              placeholder="••••••••"
              required
            />
          </div>

          {error && <p style={s.error}>{error}</p>}

          <button
            type="submit"
            style={{ ...s.btn, opacity: loading ? 0.6 : 1 }}
            disabled={loading}
          >
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed', inset: 0, zIndex: 1000,
    background: 'rgba(26,16,40,0.6)', backdropFilter: 'blur(6px)',
    WebkitBackdropFilter: 'blur(6px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  card: {
    background: 'white', borderRadius: 20, padding: '40px 36px',
    width: '100%', maxWidth: 400, position: 'relative',
    boxShadow: '0 24px 60px rgba(26,16,40,.2)',
  },
  close: {
    position: 'absolute', top: 16, right: 16,
    background: 'none', border: 'none', cursor: 'pointer',
    fontSize: 16, color: 'var(--ink-muted)', padding: 4,
  },
  logo: { fontSize: 32, textAlign: 'center', marginBottom: 12 },
  title: {
    fontFamily: "'Fraunces', serif",
    fontSize: 22, fontWeight: 700, textAlign: 'center',
    color: 'var(--ink)', marginBottom: 4, letterSpacing: '-0.5px',
  },
  sub: { textAlign: 'center', color: 'var(--ink-muted)', fontSize: 13, marginBottom: 28 },
  field: { marginBottom: 16 },
  label: { display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--ink-muted)', marginBottom: 6, letterSpacing: '0.3px' },
  input: {
    width: '100%', padding: '10px 14px', borderRadius: 10,
    border: '1.5px solid var(--border-warm)',
    fontFamily: "'Instrument Sans', sans-serif",
    fontSize: 14, outline: 'none', boxSizing: 'border-box',
    color: 'var(--ink)',
  },
  error: { color: '#C0392B', fontSize: 13, marginBottom: 12, textAlign: 'center' },
  btn: {
    width: '100%', padding: '12px', borderRadius: 12, marginTop: 8,
    background: 'var(--ink)', color: 'white', border: 'none',
    cursor: 'pointer', fontFamily: "'Instrument Sans', sans-serif",
    fontSize: 14, fontWeight: 700, transition: 'background .2s',
  },
};
