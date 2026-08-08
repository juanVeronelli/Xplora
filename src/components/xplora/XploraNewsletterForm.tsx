import { useState } from 'react';
import {
  CARRERAS_OPCIONES,
  UNIVERSIDADES_OPCIONES,
} from '../../data/academicCatalog';
import { publicFetch, readApiError } from '../../lib/serverApi';
import { useToast } from '../../context/FeedbackContext';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Newsletter landing — mismo lenguaje visual que el form de Startup Day. */
export function XploraNewsletterForm() {
  const toast = useToast();
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [email, setEmail] = useState('');
  const [universidad, setUniversidad] = useState('');
  const [carrera, setCarrera] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nom = nombre.trim();
    const ape = apellido.trim();
    const em = email.trim().toLowerCase();

    if (!nom || !ape) {
      toast.error('Completá nombre y apellido.');
      return;
    }
    if (!em || !EMAIL_RE.test(em)) {
      toast.error('Ingresá un email válido.');
      return;
    }
    if (!universidad) {
      toast.error('Elegí tu universidad.');
      return;
    }
    if (!carrera) {
      toast.error('Elegí tu carrera.');
      return;
    }

    setLoading(true);
    try {
      const res = await publicFetch('/api/public/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: nom,
          apellido: ape,
          email: em,
          universidad,
          carrera,
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
      setNombre('');
      setApellido('');
      setEmail('');
      setUniversidad('');
      setCarrera('');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'No se pudo suscribir.');
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="sd-form__ok">
        <h3>Listo</h3>
        <p>Vas a recibir novedades de Xplora: eventos, empleo y Startup Day.</p>
      </div>
    );
  }

  return (
    <form className="sd-form" onSubmit={onSubmit} noValidate>
      <div className="sd-form__row">
        <label>
          Nombre
          <input
            type="text"
            name="nombre"
            autoComplete="given-name"
            placeholder="Juan"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
          />
        </label>
        <label>
          Apellido
          <input
            type="text"
            name="apellido"
            autoComplete="family-name"
            placeholder="García"
            value={apellido}
            onChange={(e) => setApellido(e.target.value)}
            required
          />
        </label>
      </div>

      <label>
        Email
        <input
          type="email"
          name="email"
          autoComplete="email"
          placeholder="tu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </label>

      <div className="sd-form__row">
        <label>
          Universidad
          <select
            name="universidad"
            value={universidad}
            onChange={(e) => setUniversidad(e.target.value)}
            required
          >
            <option value="" disabled>
              Elegí una opción
            </option>
            {UNIVERSIDADES_OPCIONES.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
        </label>
        <label>
          Carrera
          <select
            name="carrera"
            value={carrera}
            onChange={(e) => setCarrera(e.target.value)}
            required
          >
            <option value="" disabled>
              Elegí una opción
            </option>
            {CARRERAS_OPCIONES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
      </div>

      <button type="submit" className="sd-btn sd-btn--primary" disabled={loading}>
        {loading ? 'Enviando…' : 'Suscribirme'}
      </button>
    </form>
  );
}
