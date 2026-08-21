/**
 * Cuenta Xplora: login/registro + área interna (overview / perfil / eventos).
 */
import { useEffect, useState, type FormEvent } from 'react';
import { useMemberAuth } from '../context/MemberAuthContext';
import { useSiteMedia } from '../context/SiteMediaContext';
import { MemberEventsPanel } from '../components/member/MemberEventsPanel';
import { MemberOverview } from '../components/member/MemberOverview';
import { MemberProfileForm } from '../components/member/MemberProfileForm';
import { MemberProposalsPanel } from '../components/member/MemberProposalsPanel';
import { MemberShell } from '../components/member/MemberShell';
import { DEFAULT_LOGO_URL } from '../lib/defaultsMedia';
import {
  memberLoginRequest,
  memberLoginVerify,
  memberRegister,
} from '../lib/memberAuth';
import { normalizePath } from '../lib/routes';
import '../styles/memberAccount.css';

type AuthMode = 'login' | 'register' | 'code';
export type MemberSection = 'overview' | 'perfil' | 'eventos' | 'propuestas';

function MaBackdrop() {
  return (
    <div className="ma-fx" aria-hidden>
      <div className="ma-fx__aurora ma-fx__aurora--a" />
      <div className="ma-fx__aurora ma-fx__aurora--b" />
      <div className="ma-fx__grain" />
    </div>
  );
}

export default function MemberAccount({ section = 'overview' }: { section?: MemberSection }) {
  const { logoUrl } = useSiteMedia();
  const brandLogo = logoUrl || DEFAULT_LOGO_URL;
  const { account, loading, refresh, signInWithToken } = useMemberAuth();
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [resendLeftSec, setResendLeftSec] = useState(0);

  useEffect(() => {
    if (loading || account) return;
    if (section === 'overview') return;
    if (normalizePath(window.location.pathname) === '/cuenta') return;
    window.history.replaceState({}, '', '/cuenta');
    window.dispatchEvent(new PopStateEvent('popstate'));
  }, [loading, account, section]);

  useEffect(() => {
    if (resendLeftSec <= 0) return;
    const t = window.setTimeout(() => setResendLeftSec((s) => Math.max(0, s - 1)), 1000);
    return () => window.clearTimeout(t);
  }, [resendLeftSec]);

  const onRegister = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr('');
    setMsg('');
    const r = await memberRegister(email);
    setBusy(false);
    if ('error' in r) setErr(r.error);
    else setMsg('Revisá tu email y tocá Confirmar para activar la cuenta.');
  };

  const requestLoginCode = async () => {
    setBusy(true);
    setErr('');
    setMsg('');
    const r = await memberLoginRequest(email);
    setBusy(false);
    if ('error' in r) {
      setErr(r.error);
      return false;
    }
    setMsg('Te enviamos un código a tu email.');
    setResendLeftSec(r.resendAfterSec);
    setCode('');
    return true;
  };

  const onRequestCode = async (e: FormEvent) => {
    e.preventDefault();
    const ok = await requestLoginCode();
    if (ok) setMode('code');
  };

  const onResendCode = async () => {
    if (resendLeftSec > 0 || busy) return;
    await requestLoginCode();
  };

  const onVerifyCode = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr('');
    const r = await memberLoginVerify(email, code);
    setBusy(false);
    if ('error' in r) setErr(r.error);
    else {
      signInWithToken(r.accessToken, r.account);
      await refresh();
    }
  };

  if (loading) {
    return (
      <div className="ma-page ma-page--gate">
        <MaBackdrop />
        <div className="ma-loading">
          <img className="ma-brand__logo ma-brand__logo--pulse" src={brandLogo} alt="" />
          <p className="ma-muted">Cargando…</p>
        </div>
      </div>
    );
  }

  if (account) {
    const active =
      section === 'perfil'
        ? 'perfil'
        : section === 'eventos'
          ? 'eventos'
          : section === 'propuestas'
            ? 'propuestas'
            : 'overview';
    return (
      <MemberShell active={active}>
        {section === 'perfil' ? <MemberProfileForm /> : null}
        {section === 'eventos' ? <MemberEventsPanel /> : null}
        {section === 'propuestas' ? <MemberProposalsPanel /> : null}
        {section === 'overview' ? <MemberOverview /> : null}
      </MemberShell>
    );
  }

  return (
    <div className="ma-page ma-page--gate">
      <MaBackdrop />

      <header className="ma-top">
        <a className="ma-brand" href="/" aria-label="Xplora">
          <img
            className="ma-brand__logo"
            src={brandLogo}
            alt="Xplora"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = DEFAULT_LOGO_URL;
            }}
          />
        </a>
      </header>

      <main className="ma-main ma-main--gate">
        <div className="ma-gate">
          <section className="ma-card ma-card--gate">
            <h1 className="ma-h1">
              {mode === 'register' ? 'Crear cuenta' : mode === 'code' ? 'Tu código' : 'Entrar'}
            </h1>
            <p className="ma-lead">
              {mode === 'register'
                ? 'Solo con tu email. Te mandamos un botón para confirmar.'
                : mode === 'code'
                  ? 'Ingresá el código de 5 dígitos que te llegó al mail.'
                  : 'Poné tu email y te mandamos un código de acceso.'}
            </p>

            {mode === 'register' ? (
              <form className="ma-form" onSubmit={onRegister}>
                <label>
                  Email
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    placeholder="vos@email.com"
                  />
                </label>
                <button className="ma-btn" type="submit" disabled={busy}>
                  {busy ? 'Enviando…' : 'Enviar confirmación'}
                </button>
                <button type="button" className="ma-linkbtn" onClick={() => setMode('login')}>
                  Ya tengo cuenta
                </button>
              </form>
            ) : null}

            {mode === 'login' ? (
              <form className="ma-form" onSubmit={onRequestCode}>
                <label>
                  Email
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    placeholder="vos@email.com"
                  />
                </label>
                <button className="ma-btn" type="submit" disabled={busy}>
                  {busy ? 'Enviando…' : 'Enviar código'}
                </button>
                <button type="button" className="ma-linkbtn" onClick={() => setMode('register')}>
                  Crear cuenta
                </button>
              </form>
            ) : null}

            {mode === 'code' ? (
              <form className="ma-form" onSubmit={onVerifyCode}>
                <label>
                  Código de 5 dígitos
                  <input
                    className="ma-code"
                    inputMode="numeric"
                    pattern="[0-9]{5}"
                    maxLength={5}
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 5))}
                    autoComplete="one-time-code"
                    placeholder="•••••"
                  />
                </label>
                <button className="ma-btn" type="submit" disabled={busy || code.length !== 5}>
                  {busy ? 'Verificando…' : 'Entrar'}
                </button>
                <button
                  type="button"
                  className="ma-linkbtn"
                  disabled={busy || resendLeftSec > 0}
                  onClick={() => void onResendCode()}
                >
                  {resendLeftSec > 0
                    ? `Reenviar en ${Math.floor(resendLeftSec / 60)}:${String(resendLeftSec % 60).padStart(2, '0')}`
                    : 'Reenviar código'}
                </button>
                <button
                  type="button"
                  className="ma-linkbtn"
                  onClick={() => {
                    setMode('login');
                    setCode('');
                    setMsg('');
                    setErr('');
                  }}
                >
                  Volver
                </button>
              </form>
            ) : null}

            {err ? <p className="ma-err">{err}</p> : null}
            {msg ? <p className="ma-ok">{msg}</p> : null}
          </section>
          <a className="ma-home-link" href="/">
            ← Inicio
          </a>
        </div>
      </main>
    </div>
  );
}
