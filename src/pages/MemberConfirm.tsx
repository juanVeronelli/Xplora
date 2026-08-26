import { useEffect, useState } from 'react';
import { useMemberAuth } from '../context/MemberAuthContext';
import { useSiteMedia } from '../context/SiteMediaContext';
import { DEFAULT_LOGO_URL } from '../lib/defaultsMedia';
import { memberConfirm } from '../lib/memberAuth';
import '../styles/memberAccount.css';

export default function MemberConfirm() {
  const { logoUrl } = useSiteMedia();
  const brandLogo = logoUrl || DEFAULT_LOGO_URL;
  const { signInWithToken } = useMemberAuth();
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token')?.trim() || '';
    if (!token) {
      setStatus('error');
      setError('Falta el token de confirmación.');
      return;
    }
    void (async () => {
      const r = await memberConfirm(token);
      if ('error' in r) {
        setStatus('error');
        setError(r.error);
        return;
      }
      signInWithToken(r.accessToken, r.account);
      setStatus('ok');
      window.setTimeout(() => {
        window.history.replaceState({}, '', '/cuenta');
        window.dispatchEvent(new PopStateEvent('popstate'));
      }, 900);
    })();
  }, [signInWithToken]);

  return (
    <div className="ma-page ma-page--gate">
      <div className="ma-fx" aria-hidden>
        <div className="ma-fx__aurora ma-fx__aurora--a" />
        <div className="ma-fx__aurora ma-fx__aurora--b" />
        <div className="ma-fx__grain" />
      </div>

      <header className="ma-top">
        <a className="ma-brand" href="/" aria-label="Xplora">
          <img className="ma-brand__logo" src={brandLogo} alt="Xplora" />
        </a>
      </header>

      <main className="ma-main ma-main--gate">
        <div className="ma-gate">
          <section className="ma-card ma-card--gate">
            <h1 className="ma-h1">Confirmación</h1>
            {status === 'loading' ? <p className="ma-muted">Confirmando tu email…</p> : null}
            {status === 'ok' ? (
              <p className="ma-ok">Listo. Tu cuenta quedó activa. Te llevamos a tu perfil…</p>
            ) : null}
            {status === 'error' ? (
              <>
                <p className="ma-err">{error}</p>
                <a className="ma-btn" href="/cuenta" style={{ marginTop: 12 }}>
                  Ir a cuenta
                </a>
              </>
            ) : null}
          </section>
          <a className="ma-home-link" href="/">
            ← Inicio
          </a>
        </div>
      </main>
    </div>
  );
}
