/**
 * Landing pública /sponsors — dirigida a marcas y empresas que quieren
 * auspiciar el club Xplora. Lead → API → mail a xplora.ucema@gmail.com.
 */
import { useEffect, useState } from 'react';
import { SdReveal } from '../components/startup-day/SdReveal';
import { SdShell } from '../components/startup-day/SdShell';
import { splitChars } from '../components/startup-day/splitChars';
import { SD_XPLORA_PARTNERS } from '../data/startupDay';
import { MAIN_SITE_URL } from '../lib/startupDayHost';
import { publicFetch, readApiError } from '../lib/serverApi';
import { useToast } from '../context/FeedbackContext';
import '../styles/startupDay.css';
import '../styles/xploraSite.css';
import '../styles/sponsorsPage.css';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const INTERESES = [
  { id: 'sponsor_club', label: 'Ser sponsor del club' },
  { id: 'sponsor_eventos', label: 'Auspiciar eventos' },
  { id: 'ambos', label: 'Club + eventos / Startup Day' },
  { id: 'charla', label: 'Dar una charla o workshop' },
  { id: 'empleo', label: 'Conectar con talento' },
] as const;

const BENEFITS = [
  {
    n: '01',
    tag: 'Audiencia',
    text: 'Estudiantes y jóvenes con foco emprendedor, tech y negocios — en UCEMA y de toda la Argentina.',
  },
  {
    n: '02',
    tag: 'Presencia',
    text: 'Logo, menciones y activaciones en eventos del año. Tu marca frente a la comunidad, no en un banner olvidado.',
  },
  {
    n: '03',
    tag: 'Talento',
    text: 'Puente directo con perfiles que quieren construir: networking, empleo y primeros proyectos reales.',
  },
  {
    n: '04',
    tag: 'Startup Day',
    text: 'La edición grande del año: un día completo de stands, workshops y pitch en UCEMA.',
  },
] as const;

const HERO_IMG = '/images/20251007_165830.webp';

export default function Sponsors() {
  const toast = useToast();
  const [loaderDone, setLoaderDone] = useState(false);
  const [empresa, setEmpresa] = useState('');
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [interes, setInteres] = useState('sponsor_club');
  const [mensaje, setMensaje] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    const prevTitle = document.title;
    document.title = 'Sponsors — Xplora';

    let canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    const prevHref = canonical?.href ?? '';
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = `${MAIN_SITE_URL.replace(/\/$/, '')}/sponsors`;

    const metaDesc = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    const prevDesc = metaDesc?.content ?? '';
    if (metaDesc) {
      metaDesc.content =
        'Sé sponsor de Xplora: conectá tu marca con talento emprendedor, eventos y Startup Day en UCEMA.';
    }

    const t = window.setTimeout(() => setLoaderDone(true), 900);
    return () => {
      window.clearTimeout(t);
      document.title = prevTitle;
      if (canonical) canonical.href = prevHref || MAIN_SITE_URL;
      if (metaDesc) metaDesc.content = prevDesc;
    };
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    const emp = empresa.trim();
    const nom = nombre.trim();
    const ape = apellido.trim();
    const em = email.trim().toLowerCase();
    const interesMeta = INTERESES.find((i) => i.id === interes);
    if (!interesMeta) {
      setFormError('Elegí qué les interesa.');
      return;
    }
    const interesLabel = interesMeta.label;

    if (emp.length < 2) {
      setFormError('Completá el nombre de la empresa o marca.');
      return;
    }
    if (nom.length < 2 || ape.length < 2) {
      setFormError('Completá nombre y apellido del contacto.');
      return;
    }
    if (!em || !EMAIL_RE.test(em)) {
      setFormError('Ingresá un email corporativo válido.');
      return;
    }

    setLoading(true);
    try {
      const res = await publicFetch('/api/public/sponsors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          empresa: emp,
          nombre_contacto: `${nom} ${ape}`.trim(),
          email: em,
          telefono: telefono.trim() || undefined,
          interes: interesLabel,
          mensaje: [
            'Origen: landing /sponsors (sponsor del club)',
            `Interés: ${interesLabel}`,
            mensaje.trim() ? `\n${mensaje.trim()}` : '',
          ]
            .join('\n')
            .trim(),
        }),
      });
      if (!res.ok) {
        const msg = await readApiError(res);
        setFormError(msg);
        toast.error(msg);
        return;
      }
      toast.success('Listo. Te escribimos a la brevedad.');
      setSent(true);
      setEmpresa('');
      setNombre('');
      setApellido('');
      setEmail('');
      setTelefono('');
      setInteres('sponsor_club');
      setMensaje('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'No se pudo enviar. Probá de nuevo.';
      setFormError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SdShell
      active="sponsors"
      showLoader
      loaderDone={loaderDone}
      cta={{ label: 'Ser sponsor', href: '#contacto' }}
      brandBlurb="Organización estudiantil de la Universidad del CEMA. Por y para emprendedores."
    >
      <div className="xp-page xp-sponsors">
        {/* Hero full-bleed — marca + foto de comunidad */}
        <section className="xp-sp-hero">
          <img className="xp-sp-hero__img" src={HERO_IMG} alt="" aria-hidden decoding="async" />
          <div className="xp-sp-hero__veil" aria-hidden />
          <div className="xp-sp-hero__content">
            <p className="sd-hero__eyebrow xp-sp-hero__eyebrow">Para marcas y empresas</p>
            <h1 className="xp-sp-hero__title">
              <span className="xp-sp-hero__brand">{splitChars('XPLORA')}</span>
              <span className="xp-sp-hero__line">{splitChars('Sé sponsor', 0.42)}</span>
              <span className="xp-sp-hero__line xp-sp-hero__line--accent">
                {splitChars('del club', 0.72)}
              </span>
            </h1>
            <p className="xp-sp-hero__lead">
              Conectá tu marca con la comunidad emprendedora que arma Xplora: eventos, talento y
              Startup Day.
            </p>
            <div className="xp-sp-hero__actions">
              <a className="sd-btn sd-btn--primary" href="#contacto">
                Quiero ser sponsor
              </a>
              <a className="xp-sp-hero__link" href="#club">
                Ver sponsors actuales
              </a>
            </div>
          </div>
        </section>

        {/* Por qué */}
        <section className="xp-section xp-section--cream xp-sp-why">
          <SdReveal className="xp-sp-why__intro">
            <p className="sd-kicker">Por qué Xplora</p>
            <h2 className="sd-h2 xp-sp-why__title">
              Tu marca frente a quien <em>está construyendo</em>
            </h2>
          </SdReveal>

          <div className="xp-sp-why__grid">
            <div className="xp-sp-benefits">
              {BENEFITS.map((b, i) => (
                <SdReveal key={b.tag} delay={(i % 3) as 0 | 1 | 2} className="xp-sp-benefit">
                  <span className="xp-sp-benefit__n" aria-hidden>
                    {b.n}
                  </span>
                  <div>
                    <p className="xp-sp-benefit__tag">{b.tag}</p>
                    <p className="xp-sp-benefit__text">{b.text}</p>
                  </div>
                </SdReveal>
              ))}
            </div>

            <SdReveal delay={1} className="xp-sp-why__photo" as="figure">
              <img
                src="/images/IMG-20250827-WA0014.webp"
                alt="Sala llena en un evento Xplora"
                loading="lazy"
                decoding="async"
              />
            </SdReveal>
          </div>
        </section>

        {/* Sponsors del club — mismo formato que Startup Day */}
        <section id="club" className="sd-band sd-band--cream sd-spn xp-sp-club">
          <SdReveal className="sd-spn__inner">
            <p className="sd-spn__label">Sponsors del club</p>
            <div className="sd-spn__logos" aria-label="Sponsors del club">
              {SD_XPLORA_PARTNERS.map((sp) => {
                const href = sp.website;
                const img = (
                  <img src={sp.logoUrl} alt={sp.name} loading="lazy" decoding="async" />
                );
                return href ? (
                  <a
                    key={sp.id}
                    className="sd-spn__logo"
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {img}
                  </a>
                ) : (
                  <div key={sp.id} className="sd-spn__logo">
                    {img}
                  </div>
                );
              })}
            </div>
          </SdReveal>
        </section>

        {/* CTA + form */}
        <section id="contacto" className="xp-section xp-section--cream xp-sp-contact">
          <div className="xp-sp-contact__layout">
            <SdReveal className="xp-sp-contact__copy">
              <p className="sd-kicker">Sumate</p>
              <h2 className="sd-h2 xp-sp-contact__title">
                Contanos de tu <span className="xp-sp-contact__shine">marca</span>
              </h2>
              <p className="sd-lead">
                Si querés ser sponsor del club, auspiciar un evento o aparecer en Startup Day,
                dejanos tus datos. El equipo de Xplora te escribe a la brevedad.
              </p>
              <ul className="xp-sp-contact__points">
                <li>Respuesta del equipo Xplora</li>
                <li>Formatos a medida según presupuesto</li>
                <li>Foco en marcas y empresas</li>
              </ul>
            </SdReveal>

            <SdReveal delay={1} className="xp-sp-contact__panel">
              {sent ? (
                <div className="xp-sp-form__ok">
                  <h3>Recibimos tu mensaje</h3>
                  <p>Te vamos a escribir desde el equipo de Xplora para charlar el mejor formato.</p>
                  <button type="button" className="sd-btn sd-btn--ink" onClick={() => setSent(false)}>
                    Enviar otro
                  </button>
                </div>
              ) : (
                <form className="xp-sp-form" onSubmit={onSubmit} noValidate>
                  <label>
                    Empresa / marca
                    <input
                      type="text"
                      name="empresa"
                      value={empresa}
                      onChange={(e) => setEmpresa(e.target.value)}
                      required
                      maxLength={240}
                      autoComplete="organization"
                      placeholder="Nombre de la empresa"
                    />
                  </label>
                  <div className="xp-sp-form__row">
                    <label>
                      Nombre
                      <input
                        type="text"
                        name="nombre"
                        autoComplete="given-name"
                        value={nombre}
                        onChange={(e) => setNombre(e.target.value)}
                        required
                        maxLength={120}
                      />
                    </label>
                    <label>
                      Apellido
                      <input
                        type="text"
                        name="apellido"
                        autoComplete="family-name"
                        value={apellido}
                        onChange={(e) => setApellido(e.target.value)}
                        required
                        maxLength={120}
                      />
                    </label>
                  </div>
                  <div className="xp-sp-form__row">
                    <label>
                      Email
                      <input
                        type="email"
                        name="email"
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        maxLength={240}
                        placeholder="vos@empresa.com"
                      />
                    </label>
                    <label>
                      Teléfono
                      <input
                        type="tel"
                        name="telefono"
                        autoComplete="tel"
                        value={telefono}
                        onChange={(e) => setTelefono(e.target.value)}
                        maxLength={40}
                        placeholder="Opcional"
                      />
                    </label>
                  </div>
                  <label>
                    Qué les interesa
                    <select
                      name="interes"
                      value={interes}
                      onChange={(e) => setInteres(e.target.value)}
                      required
                    >
                      {INTERESES.map((i) => (
                        <option key={i.id} value={i.id}>
                          {i.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Mensaje
                    <textarea
                      name="mensaje"
                      rows={4}
                      value={mensaje}
                      onChange={(e) => setMensaje(e.target.value)}
                      maxLength={4000}
                      placeholder="Contanos presupuesto, fechas o qué buscan (opcional)"
                    />
                  </label>
                  {formError ? <p className="xp-sp-form__error">{formError}</p> : null}
                  <button type="submit" className="sd-btn sd-btn--ink" disabled={loading}>
                    {loading ? 'Enviando…' : 'Quiero ser sponsor'}
                  </button>
                </form>
              )}
            </SdReveal>
          </div>
        </section>
      </div>
    </SdShell>
  );
}
