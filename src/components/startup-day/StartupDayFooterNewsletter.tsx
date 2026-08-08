import { useState } from 'react';
import { publicFetch, readApiError } from '../../lib/serverApi';
import { useToast } from '../../context/FeedbackContext';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Suscripción newsletter en footer (email; el API pide campos extra → defaults). */
export function StartupDayFooterNewsletter() {
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const em = email.trim().toLowerCase();
    if (!em || !EMAIL_RE.test(em)) {
      toast.error('Ingresá un email válido.');
      return;
    }
    setLoading(true);
    try {
      const res = await publicFetch('/api/public/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: 'Suscriptor',
          email: em,
          esCema: 'No',
          carrera: 'Newsletter',
        }),
      });
      if (!res.ok) {
        toast.error(await readApiError(res));
        return;
      }
      const data = (await res.json()) as { alreadyRegistered?: boolean };
      if (data.alreadyRegistered) {
        toast.error('Este email ya está suscripto.');
        return;
      }
      toast.success('Suscripto al newsletter.');
      setDone(true);
      setEmail('');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'No se pudo suscribir.');
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return <p className="sd-footer__nl-ok">Listo. Vas a recibir novedades de Xplora.</p>;
  }

  return (
    <form className="sd-footer__nl" onSubmit={onSubmit} noValidate>
      <label className="sd-footer__nl-label" htmlFor="sd-footer-email">
        Newsletter
      </label>
      <p className="sd-footer__nl-hint">Novedades del club y del Startup Day.</p>
      <div className="sd-footer__nl-row">
        <input
          id="sd-footer-email"
          type="email"
          name="email"
          autoComplete="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? '…' : 'Suscribirme'}
        </button>
      </div>
    </form>
  );
}
