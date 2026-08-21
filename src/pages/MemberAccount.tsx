/**
 * Cuenta Xplora: registro (confirmación por mail), login con código, perfil.
 */
import { useEffect, useState } from 'react';
import { useMemberAuth } from '../context/MemberAuthContext';
import { useSiteMedia } from '../context/SiteMediaContext';
import { DEFAULT_LOGO_URL } from '../lib/defaultsMedia';
import {
  memberFetch,
  memberLoginRequest,
  memberLoginVerify,
  memberRegister,
  type MemberProfile,
} from '../lib/memberAuth';
import '../styles/memberAccount.css';

type Mode = 'login' | 'register' | 'code' | 'profile';

function Avatar({ account }: { account: MemberProfile }) {
  if (account.avatarUrl) {
    return <img className="ma-avatar" src={account.avatarUrl} alt="" />;
  }
  const letter = (account.displayName || account.email || '?').slice(0, 1).toUpperCase();
  return (
    <div className="ma-avatar ma-avatar--ph" aria-hidden>
      {letter}
    </div>
  );
}

function MaBackdrop() {
  return (
    <div className="ma-fx" aria-hidden>
      <div className="ma-fx__aurora ma-fx__aurora--a" />
      <div className="ma-fx__aurora ma-fx__aurora--b" />
      <div className="ma-fx__grain" />
    </div>
  );
}

export default function MemberAccount({
  initialMode = 'login',
  onGoEmpleo,
}: {
  initialMode?: Mode;
  onGoEmpleo?: () => void;
}) {
  const { logoUrl } = useSiteMedia();
  const brandLogo = logoUrl || DEFAULT_LOGO_URL;
  const { account, events, loading, refresh, signInWithToken, signOut } = useMemberAuth();
  const [mode, setMode] = useState<Mode>(account ? 'profile' : initialMode);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [resendLeftSec, setResendLeftSec] = useState(0);

  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [skills, setSkills] = useState('');
  const [studiesText, setStudiesText] = useState('');
  const [jobsText, setJobsText] = useState('');
  const [langsText, setLangsText] = useState('');

  useEffect(() => {
    if (account) {
      setMode('profile');
      setDisplayName(account.displayName);
      setPhone(account.phone);
      setSkills(account.skills.join(', '));
      setStudiesText(
        account.studies.map((s) => [s.degree, s.institution, s.year].filter(Boolean).join(' · ')).join('\n'),
      );
      setJobsText(
        account.jobs.map((j) => [j.role, j.company, j.current ? 'actual' : j.to || ''].filter(Boolean).join(' · ')).join('\n'),
      );
      setLangsText(account.languages.map((l) => `${l.name}${l.level ? ` (${l.level})` : ''}`).join(', '));
    }
  }, [account]);

  useEffect(() => {
    if (resendLeftSec <= 0) return;
    const t = window.setTimeout(() => setResendLeftSec((s) => Math.max(0, s - 1)), 1000);
    return () => window.clearTimeout(t);
  }, [resendLeftSec]);

  const onRegister = async (e: React.FormEvent) => {
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

  const onRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await requestLoginCode();
    if (ok) setMode('code');
  };

  const onResendCode = async () => {
    if (resendLeftSec > 0 || busy) return;
    await requestLoginCode();
  };

  const onVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr('');
    const r = await memberLoginVerify(email, code);
    setBusy(false);
    if ('error' in r) setErr(r.error);
    else {
      signInWithToken(r.accessToken, r.account);
      setMode('profile');
      await refresh();
    }
  };

  const onSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr('');
    setMsg('');
    const studies = studiesText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [degree = '', institution = '', year = ''] = line.split('·').map((x) => x.trim());
        return { degree, institution, year: year || undefined };
      });
    const jobs = jobsText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const parts = line.split('·').map((x) => x.trim());
        return {
          role: parts[0] || '',
          company: parts[1] || '',
          current: (parts[2] || '').toLowerCase().includes('actual'),
          to: (parts[2] || '').toLowerCase().includes('actual') ? undefined : parts[2] || undefined,
        };
      });
    const languages = langsText
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean)
      .map((chunk) => {
        const m = /^(.+?)\s*\((.+)\)$/.exec(chunk);
        return m ? { name: m[1]!.trim(), level: m[2]!.trim() } : { name: chunk, level: '' };
      });

    const res = await memberFetch('/api/member/me', {
      method: 'PATCH',
      body: JSON.stringify({
        displayName,
        phone,
        skills: skills
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        studies,
        jobs,
        languages,
      }),
    });
    setBusy(false);
    if (!res.ok) {
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      setErr(j.error || 'No se pudo guardar');
      return;
    }
    setMsg('Perfil guardado');
    await refresh();
  };

  const onAvatar = async (file: File | null) => {
    if (!file) return;
    setBusy(true);
    const fd = new FormData();
    fd.append('file', file);
    const res = await memberFetch('/api/member/me/avatar', { method: 'POST', body: fd });
    setBusy(false);
    if (!res.ok) {
      setErr('No se pudo subir la foto');
      return;
    }
    await refresh();
  };

  const onCv = async (file: File | null) => {
    if (!file) return;
    setBusy(true);
    const fd = new FormData();
    fd.append('cv', file);
    const res = await memberFetch('/api/member/me/cv', { method: 'POST', body: fd });
    setBusy(false);
    if (!res.ok) {
      setErr('No se pudo subir el CV');
      return;
    }
    setMsg('CV actualizado');
    await refresh();
  };

  const isAuthGate = !account && mode !== 'profile';

  if (loading) {
    return (
      <div className="ma-page">
        <MaBackdrop />
        <div className="ma-loading">
          <img className="ma-brand__logo ma-brand__logo--pulse" src={brandLogo} alt="" />
          <p className="ma-muted">Cargando…</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`ma-page${isAuthGate ? ' ma-page--gate' : ''}`}>
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
        {account ? (
          <button type="button" className="ma-linkbtn ma-top__out" onClick={signOut}>
            Salir
          </button>
        ) : null}
      </header>

      <main className={`ma-main${isAuthGate ? ' ma-main--gate' : ''}`}>
        {isAuthGate ? (
          <div className="ma-gate">
            <section className="ma-card ma-card--gate">
              <h1 className="ma-h1">
                {mode === 'register' ? 'Crear cuenta' : mode === 'code' ? 'Tu código' : 'Entrar'}
              </h1>
              <p className="ma-lead">
                {mode === 'register'
                  ? 'Solo con tu email. Te mandamos un botón para confirmar.'
                  : mode === 'code'
                    ? 'Ingresá el código que te llegó al mail.'
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
        ) : null}

        {account ? (
          <section className="ma-profile">
            <div className="ma-profile__head">
              <Avatar account={account} />
              <div>
                <h1 className="ma-h1">{account.displayName || 'Tu perfil'}</h1>
                <p className="ma-muted">{account.email}</p>
                <label className="ma-file">
                  Cambiar foto
                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={(e) => void onAvatar(e.target.files?.[0] ?? null)}
                  />
                </label>
              </div>
              {onGoEmpleo ? (
                <button type="button" className="ma-btn" onClick={onGoEmpleo}>
                  Ir a la bolsa
                </button>
              ) : (
                <a className="ma-btn" href="/empleo">
                  Ir a la bolsa
                </a>
              )}
            </div>

            <form className="ma-form ma-form--grid" onSubmit={onSaveProfile}>
              <label>
                Nombre
                <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
              </label>
              <label>
                Teléfono
                <input value={phone} onChange={(e) => setPhone(e.target.value)} />
              </label>
              <label className="ma-span2">
                Skills (separadas por coma)
                <input value={skills} onChange={(e) => setSkills(e.target.value)} />
              </label>
              <label className="ma-span2">
                Estudios (una línea por ítem: carrera · institución · año)
                <textarea rows={3} value={studiesText} onChange={(e) => setStudiesText(e.target.value)} />
              </label>
              <label className="ma-span2">
                Empleos (una línea: rol · empresa · actual o hasta)
                <textarea rows={3} value={jobsText} onChange={(e) => setJobsText(e.target.value)} />
              </label>
              <label className="ma-span2">
                Idiomas (ej. Español (nativo), English (B2))
                <input value={langsText} onChange={(e) => setLangsText(e.target.value)} />
              </label>
              <div className="ma-span2 ma-cv">
                <p className="ma-muted">
                  CV:{' '}
                  {account.cvUrl ? (
                    <a href={account.cvUrl} target="_blank" rel="noopener noreferrer">
                      Ver archivo
                    </a>
                  ) : (
                    'sin cargar'
                  )}
                </p>
                <label className="ma-file">
                  Subir CV (PDF/Word)
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,application/pdf"
                    hidden
                    onChange={(e) => void onCv(e.target.files?.[0] ?? null)}
                  />
                </label>
              </div>
              <button className="ma-btn ma-span2" type="submit" disabled={busy}>
                {busy ? 'Guardando…' : 'Guardar perfil'}
              </button>
            </form>

            {err ? <p className="ma-err">{err}</p> : null}
            {msg ? <p className="ma-ok">{msg}</p> : null}

            <section className="ma-history">
              <h2 className="ma-h2">Eventos</h2>
              {events.length === 0 ? (
                <p className="ma-muted">Todavía no hay eventos vinculados a tu email.</p>
              ) : (
                <ul className="ma-history__list">
                  {events.map((ev) => (
                    <li key={ev.id}>
                      <strong>{ev.title}</strong>
                      <span>
                        {ev.dateDisplay}
                        {ev.asistio ? ' · asististe' : ''}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </section>
        ) : null}
      </main>
    </div>
  );
}
