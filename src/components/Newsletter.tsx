import { useState } from 'react';
import { useInView } from '../hooks/useInView';
import { useIsMobile } from '../hooks/useIsMobile';
import { useToast } from '../context/FeedbackContext';
import { publicFetch, readApiError } from '../lib/serverApi';
import { CARRERAS_UCEMA_OPCIONES } from '../data/carrerasUcema';

type Status = 'idle' | 'loading' | 'success' | 'duplicate' | 'error';

const MSG_EMAIL_DUPLICADO = 'Este email ya está registrado en Xplora.';

export default function Newsletter() {
  const { ref, inView } = useInView();
  const isMobile = useIsMobile();
  const toast = useToast();

  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [esCema, setEsCema] = useState<'Sí' | 'No' | ''>('');
  const [carrera, setCarrera] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const canSubmit = nombre.trim() && email.trim() && esCema && carrera.trim();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setStatus('loading');
    setErrorMsg('');
    try {
      const res = await publicFetch('/api/public/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: nombre.trim(),
          email: email.trim(),
          esCema,
          carrera: carrera.trim(),
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
        setErrorMsg(MSG_EMAIL_DUPLICADO);
        setStatus('duplicate');
        toast.error(MSG_EMAIL_DUPLICADO);
        return;
      }
      toast.success('¡Listo! Ya estás suscripto a Xplora.');
      setStatus('success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Algo salió mal, intentá de nuevo.';
      setErrorMsg(msg);
      toast.error(msg);
      setStatus('error');
    }
  };

  return (
    <section
      ref={ref as React.Ref<HTMLElement>}
      style={{
        ...s.section,
        padding: isMobile ? '56px 24px' : 80,
        opacity: inView ? 1 : 0,
        transform: inView ? 'none' : 'translateY(28px)',
        transition: 'opacity 0.7s ease, transform 0.7s ease',
      }}
    >
      <div style={s.label}>Comunidad</div>
      <h2 style={{ ...s.h2, fontSize: isMobile ? 28 : 38 }}>Suscribite a Xplora</h2>
      <p style={s.p}>
        Novedades de la comunidad, convocatorias y reminders útiles. Sin relleno:
        lo que organizamos para más de 2.000 miembros también puede llegarte a vos.
      </p>

      {status === 'success' ? (
        <div style={s.successBox}>
          <span style={s.successIcon}>🎉</span>
          <p style={s.successTitle}>¡Ya estás dentro!</p>
          <p style={s.successSub}>Te vamos a escribir con lo mejor del ecosistema UCEMA.</p>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          style={{ ...s.form, maxWidth: isMobile ? '100%' : 520 }}
          noValidate
        >
          {/* Nombre + Email */}
          <div style={{ ...s.row2, flexDirection: isMobile ? 'column' : 'row' }}>
            <div style={s.fieldWrap}>
              <label style={s.fieldLabel}>Nombre completo</label>
              <input
                type="text"
                placeholder="Juan García"
                value={nombre}
                onChange={e => setNombre(e.target.value)}
                style={s.input}
                onFocus={e => ((e.target as HTMLInputElement).style.borderColor = 'rgba(200,184,255,0.6)')}
                onBlur={e => ((e.target as HTMLInputElement).style.borderColor = 'rgba(255,255,255,0.12)')}
                required
              />
            </div>
            <div style={s.fieldWrap}>
              <label style={s.fieldLabel}>Email</label>
              <input
                type="email"
                placeholder="juan@email.com"
                value={email}
                onChange={e => {
                  setEmail(e.target.value);
                  if (status === 'duplicate') {
                    setStatus('idle');
                    setErrorMsg('');
                  }
                }}
                style={s.input}
                onFocus={e => ((e.target as HTMLInputElement).style.borderColor = 'rgba(200,184,255,0.6)')}
                onBlur={e => ((e.target as HTMLInputElement).style.borderColor = 'rgba(255,255,255,0.12)')}
                required
              />
            </div>
          </div>

          {/* ¿Estudiante CEMA? */}
          <div style={s.fieldWrap}>
            <label style={s.fieldLabel}>¿Sos estudiante del CEMA?</label>
            <div style={s.toggleRow}>
              {(['Sí', 'No'] as const).map(opt => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setEsCema(opt)}
                  style={{
                    ...s.toggle,
                    background: esCema === opt ? 'var(--purple)' : 'rgba(255,255,255,0.07)',
                    borderColor: esCema === opt ? 'var(--purple)' : 'rgba(255,255,255,0.15)',
                    color: esCema === opt ? 'white' : 'rgba(255,255,255,0.55)',
                    fontWeight: esCema === opt ? 700 : 500,
                  }}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {/* Carrera */}
          <div style={s.fieldWrap}>
            <label style={s.fieldLabel} htmlFor="newsletter-carrera">
              Carrera
            </label>
            <select
              id="newsletter-carrera"
              className="newsletter-field-select"
              value={carrera}
              onChange={e => setCarrera(e.target.value)}
              style={s.select}
              onFocus={e => ((e.target as HTMLSelectElement).style.borderColor = 'rgba(200,184,255,0.6)')}
              onBlur={e => ((e.target as HTMLSelectElement).style.borderColor = 'rgba(255,255,255,0.12)')}
              required
            >
              <option value="" disabled>
                Elegí una opción
              </option>
              {CARRERAS_UCEMA_OPCIONES.map(opt => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          {(status === 'error' || status === 'duplicate') && (
            <p style={s.errorMsg}>⚠️ {errorMsg}</p>
          )}

          <button
            type="submit"
            disabled={!canSubmit || status === 'loading' || status === 'duplicate'}
            style={{
              ...s.btn,
              width: '100%',
              opacity: !canSubmit ? 0.45 : 1,
              cursor: !canSubmit ? 'not-allowed' : 'pointer',
            }}
            onMouseEnter={e => {
              if (canSubmit && status !== 'loading') {
                (e.currentTarget).style.background = '#4A2DD4';
                (e.currentTarget).style.transform = 'translateY(-1px)';
              }
            }}
            onMouseLeave={e => {
              (e.currentTarget).style.background = 'var(--purple)';
              (e.currentTarget).style.transform = 'none';
            }}
          >
            {status === 'loading' ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <span style={s.spinner} /> Guardando...
              </span>
            ) : 'Suscribirme →'}
          </button>
        </form>
      )}
    </section>
  );
}

const s: Record<string, React.CSSProperties> = {
  section: {
    background: 'var(--ink)', color: 'white',
    padding: 80, textAlign: 'center',
  },
  label: {
    fontSize: 11, fontWeight: 700, letterSpacing: '2.5px',
    textTransform: 'uppercase', color: 'rgba(200,184,255,0.8)', marginBottom: 12,
  },
  h2: {
    fontSize: 38, fontWeight: 700, letterSpacing: '-1.5px',
    marginBottom: 10, color: 'white',
    fontFamily: "'Fraunces', serif",
  },
  p: { color: 'rgba(255,255,255,0.5)', marginBottom: 32, fontSize: 15 },
  form: {
    margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16,
    textAlign: 'left',
  },
  row2: { display: 'flex', gap: 12 },
  fieldWrap: { display: 'flex', flexDirection: 'column', gap: 6, flex: 1 },
  fieldLabel: {
    fontSize: 11, fontWeight: 700, letterSpacing: '1px',
    textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)',
  },
  input: {
    padding: '11px 16px', borderRadius: 10,
    background: 'rgba(255,255,255,0.07)',
    border: '1.5px solid rgba(255,255,255,0.12)',
    color: 'white', fontFamily: "'Instrument Sans', sans-serif",
    fontSize: 14, outline: 'none', transition: 'border-color .2s',
    width: '100%', boxSizing: 'border-box',
  },
  select: {
    padding: '11px 16px', borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.07)',
    border: '1.5px solid rgba(255,255,255,0.12)',
    color: 'white', fontFamily: "'Instrument Sans', sans-serif",
    fontSize: 14, outline: 'none', transition: 'border-color .2s',
    width: '100%', boxSizing: 'border-box',
    cursor: 'pointer',
    appearance: 'none' as const,
    WebkitAppearance: 'none' as const,
    backgroundImage:
      'linear-gradient(45deg, transparent 50%, rgba(255,255,255,0.65) 50%), linear-gradient(135deg, rgba(255,255,255,0.65) 50%, transparent 50%)',
    backgroundPosition:
      'calc(100% - 18px) calc(50% + 3px), calc(100% - 13px) calc(50% + 3px)',
    backgroundSize: '5px 5px, 5px 5px',
    backgroundRepeat: 'no-repeat',
    paddingRight: 40,
  },
  toggleRow: { display: 'flex', gap: 8 },
  toggle: {
    flex: 1, padding: '10px 0', borderRadius: 10,
    border: '1.5px solid', cursor: 'pointer',
    fontFamily: "'Instrument Sans', sans-serif",
    fontSize: 14, transition: 'all .18s',
  },
  btn: {
    padding: '13px 24px', borderRadius: 12,
    background: 'var(--purple)', color: 'white', border: 'none',
    fontFamily: "'Instrument Sans', sans-serif",
    fontSize: 14, fontWeight: 700, transition: 'all .2s',
    marginTop: 4,
  },
  errorMsg: {
    fontSize: 13, color: '#FF8A8A', textAlign: 'center',
    background: 'rgba(255,100,100,0.1)', padding: '10px 16px',
    borderRadius: 8, border: '1px solid rgba(255,100,100,0.2)',
  },
  successBox: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
    padding: '32px 24px',
  },
  successIcon: { fontSize: 40 },
  successTitle: {
    fontFamily: "'Fraunces', serif",
    fontSize: 22, fontWeight: 700, color: 'white', marginTop: 4,
  },
  successSub: { color: 'rgba(255,255,255,0.5)', fontSize: 14 },
  spinner: {
    display: 'inline-block', width: 14, height: 14, borderRadius: '50%',
    border: '2px solid rgba(255,255,255,0.3)',
    borderTopColor: 'white', animation: 'spin 0.7s linear infinite',
  },
};
