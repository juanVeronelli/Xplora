import { useState } from 'react';
import { publicFetch, readApiError } from '../../lib/serverApi';
import { useToast } from '../../context/FeedbackContext';

type Status = 'idle' | 'loading' | 'success' | 'duplicate' | 'error';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function StartupDayWaitlistForm() {
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [nombreCompleto, setNombreCompleto] = useState('');
  const [universidad, setUniversidad] = useState('');
  const [queEstanCreando, setQueEstanCreando] = useState('');
  const [carrera, setCarrera] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const em = email.trim().toLowerCase();
    if (!em || !EMAIL_RE.test(em)) {
      setErrorMsg('Ingresá un email válido.');
      setStatus('error');
      return;
    }

    setStatus('loading');
    setErrorMsg('');
    try {
      const res = await publicFetch('/api/public/startup-day/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: em,
          nombreCompleto: nombreCompleto.trim() || undefined,
          universidad: universidad.trim() || undefined,
          queEstanCreando: queEstanCreando.trim() || undefined,
          carrera: carrera.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const msg = await readApiError(res);
        setErrorMsg(msg);
        toast.error(msg);
        setStatus('error');
        return;
      }
      const data = (await res.json()) as { alreadyRegistered?: boolean };
      if (data.alreadyRegistered) {
        setErrorMsg('Este email ya está en la lista.');
        setStatus('duplicate');
        toast.error('Este email ya está en la lista.');
        return;
      }
      toast.success('Listo. Te avisamos cuando abra la inscripción.');
      setStatus('success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'No se pudo guardar. Probá de nuevo.';
      setErrorMsg(msg);
      toast.error(msg);
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <div className="sd-form__ok">
        <h3>Estás en la lista</h3>
        <p>
          Hay cupos limitados. Dejarte acá aumenta tus chances de entrar cuando abra la inscripción.
          Te mandamos confirmación por mail.
        </p>
      </div>
    );
  }

  return (
    <form className="sd-form" onSubmit={handleSubmit} noValidate>
      <p className="sd-form__hint">
        Cupos limitados. Dejá tu email para aumentar la posibilidad de asistir cuando abra la
        inscripción. El resto es opcional.
      </p>

      <label>
        Email
        <input
          type="email"
          name="email"
          autoComplete="email"
          required
          placeholder="tu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </label>

      <label>
        Nombre completo
        <input
          type="text"
          name="nombreCompleto"
          autoComplete="name"
          placeholder="Opcional"
          value={nombreCompleto}
          onChange={(e) => setNombreCompleto(e.target.value)}
        />
      </label>

      <label>
        Universidad
        <input
          type="text"
          name="universidad"
          placeholder="Opcional"
          value={universidad}
          onChange={(e) => setUniversidad(e.target.value)}
        />
      </label>

      <label>
        Qué están creando
        <textarea
          name="queEstanCreando"
          placeholder="Opcional — proyecto, startup o idea"
          value={queEstanCreando}
          onChange={(e) => setQueEstanCreando(e.target.value)}
        />
      </label>

      <label>
        Carrera
        <input
          type="text"
          name="carrera"
          placeholder="Opcional"
          value={carrera}
          onChange={(e) => setCarrera(e.target.value)}
        />
      </label>

      {(status === 'error' || status === 'duplicate') && errorMsg ? (
        <p className="sd-form__error" role="alert">
          {errorMsg}
        </p>
      ) : null}

      <button className="sd-btn sd-btn--primary sd-btn--block" type="submit" disabled={status === 'loading'}>
        {status === 'loading' ? 'Enviando…' : 'Aumentar mis chances'}
      </button>
    </form>
  );
}
