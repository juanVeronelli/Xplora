/**
 * Landing principal xploraucema.com — top of funnel.
 * Identidad compartida con Startup Day; composición propia (foto + producto).
 */
import { useEffect, useMemo, useState } from 'react';
import { useSiteMedia } from '../context/SiteMediaContext';
import { DEFAULT_COMPANY_BRANDS, DEFAULT_LOGO_URL } from '../lib/defaultsMedia';
import { MAIN_SITE_URL, startupDayUrl } from '../lib/startupDayHost';
import { fetchEventos } from '../lib/db';
import { pickEarliestUpcoming } from '../lib/eventDate';
import type { Evento } from '../types';
import { SD_EVENT, SD_XPLORA_ABOUT, SD_XPLORA_SOCIALS, XP_FAQS } from '../data/startupDay';
import { SdReveal } from '../components/startup-day/SdReveal';
import { SdShell } from '../components/startup-day/SdShell';
import { StartupDaySponsorCta } from '../components/startup-day/StartupDaySponsorForm';
import { XploraNewsletterForm } from '../components/xplora/XploraNewsletterForm';
import {
  XploraHeroPhoto,
  XploraMarquee,
  XploraModes,
  XploraRail,
} from '../components/xplora/XploraInteract';
import '../styles/startupDay.css';
import '../styles/xploraSite.css';

export default function XploraSite() {
  const { carousel, heroUrl, logoUrl } = useSiteMedia();
  /** Solo PNG locales curados — sin Cloudinary ni fondos blancos. */
  const brands = DEFAULT_COMPANY_BRANDS;
  const brandLogo = logoUrl || DEFAULT_LOGO_URL;
  const sdHref = startupDayUrl();
  const [loaderDone, setLoaderDone] = useState(false);
  const [proximo, setProximo] = useState<Evento | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Preferir assets livianos locales si el CMS no trae foto
  const heroPhoto =
    heroUrl || carousel?.[0]?.url || '/images/IMG-20250827-WA0014.webp';
  const nextPhoto =
    proximo?.homePosterUrl ||
    proximo?.thumbnailUrl ||
    '';

  const railItems = useMemo(() => {
    return [
      { id: 'que-es', label: 'Club' },
      ...(proximo ? [{ id: 'proximo', label: 'Evento' }] : []),
      { id: 'startup-day', label: 'Startup Day' },
      { id: 'empresas', label: 'Empresas' },
      { id: 'faq', label: 'FAQ' },
      { id: 'newsletter', label: 'News' },
    ];
  }, [proximo]);

  useEffect(() => {
    const prevTitle = document.title;
    document.title = 'Xplora — Club de emprendedores UCEMA';

    let canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    const prevHref = canonical?.href ?? '';
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = MAIN_SITE_URL;

    const metaDesc = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    const prevDesc = metaDesc?.content ?? '';
    if (metaDesc) {
      metaDesc.content =
        'Xplora — organización estudiantil de UCEMA. Comunidad, eventos, empleo y Startup Day.';
    }

    const t = window.setTimeout(() => setLoaderDone(true), 900);
    return () => {
      window.clearTimeout(t);
      document.title = prevTitle;
      if (canonical) canonical.href = prevHref || MAIN_SITE_URL;
      if (metaDesc) metaDesc.content = prevDesc;
    };
  }, []);

  useEffect(() => {
    let alive = true;
    fetchEventos()
      .then((list) => {
        if (alive) setProximo(pickEarliestUpcoming(list));
      })
      .catch(() => {
        if (alive) setProximo(null);
      });
    return () => {
      alive = false;
    };
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <SdShell
      active="xplora"
      showLoader
      loaderDone={loaderDone}
      cta={{ label: 'Sumarme', href: SD_XPLORA_SOCIALS.whatsapp }}
      brandBlurb="Organización estudiantil de la Universidad del CEMA. Por y para emprendedores."
    >
      <div className="xp-page">
        <XploraRail items={railItems} />

        {/* Hero: una composición — marca + foto + un CTA */}
        <XploraHeroPhoto src={heroPhoto} alt="Comunidad Xplora">
          <p className="sd-hero__eyebrow">Universidad del CEMA</p>
          <h1 className="sd-hero__title xp-hero__title">
            <span className="sd-hero__line">Xplora</span>
          </h1>
          <p className="sd-hero__lede">
            Organización estudiantil por y para emprendedores. Abierta a toda la Argentina.
          </p>
          <div className="xp-hero__actions">
            <a
              className="sd-btn sd-btn--primary"
              href={SD_XPLORA_SOCIALS.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
            >
              Entrar a la comunidad
            </a>
            <button
              type="button"
              className="xp-hero__link"
              onClick={() => scrollTo(proximo ? 'proximo' : 'que-es')}
            >
              {proximo ? 'Próximo evento' : 'Qué hacemos'}
            </button>
          </div>
        </XploraHeroPhoto>

        {/* Qué es — modos interactivos */}
        <section id="que-es" className="xp-section xp-section--ink">
          <SdReveal className="xp-section__intro">
            <p className="sd-kicker">El club</p>
            <h2 className="sd-h2">Cuatro puertas al ecosistema</h2>
            <p className="sd-lead">Elegí por dónde entrar.</p>
          </SdReveal>
          <SdReveal delay={1}>
            <XploraModes />
          </SdReveal>
        </section>

        {/* Próximo evento — solo si hay uno cargado en CMS */}
        {proximo ? (
          <section id="proximo" className="xp-next">
            <div className="xp-next__bar">
              <p className="sd-kicker">Próximo evento</p>
              {proximo.registrationLink ? (
                <a
                  className="sd-btn sd-btn--ink"
                  href={proximo.registrationLink}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Quiero ir
                </a>
              ) : (
                <button
                  type="button"
                  className="sd-btn sd-btn--ink"
                  onClick={() => scrollTo('newsletter')}
                >
                  Avisame
                </button>
              )}
            </div>

            <div className="xp-next__main">
              <div className="xp-next__editorial">
                <div className="xp-next__date" aria-hidden={!proximo.day}>
                  <span className="xp-next__day">{proximo.day || '—'}</span>
                  <span className="xp-next__month">{proximo.month || ''}</span>
                  {proximo.date ? (
                    <span className="xp-next__date-full">{proximo.date}</span>
                  ) : null}
                </div>

                <SdReveal className="xp-next__copy">
                  <h2 className="sd-h2 xp-next__title">{proximo.title}</h2>
                  {proximo.desc ? (
                    <p className="xp-next__desc">
                      {proximo.desc.length > 180
                        ? `${proximo.desc.slice(0, 177).trim()}…`
                        : proximo.desc}
                    </p>
                  ) : null}

                  <dl className="xp-next__facts">
                    {proximo.location ? (
                      <div>
                        <dt>Lugar</dt>
                        <dd>{proximo.location}</dd>
                      </div>
                    ) : null}
                    {proximo.modality ? (
                      <div>
                        <dt>Modalidad</dt>
                        <dd>{proximo.modality}</dd>
                      </div>
                    ) : null}
                    {proximo.cost ? (
                      <div>
                        <dt>Costo</dt>
                        <dd>{proximo.cost}</dd>
                      </div>
                    ) : null}
                    {proximo.speakerName ? (
                      <div>
                        <dt>Con</dt>
                        <dd>
                          {proximo.speakerName}
                          {proximo.speakerRole ? ` · ${proximo.speakerRole}` : ''}
                        </dd>
                      </div>
                    ) : null}
                  </dl>
                </SdReveal>
              </div>

              {nextPhoto ? (
                <figure className="xp-next__media">
                  <img
                    src={nextPhoto}
                    alt={proximo.title}
                    loading="lazy"
                    decoding="async"
                  />
                </figure>
              ) : null}
            </div>
          </section>
        ) : null}

        {/* Startup Day — siempre visible */}
        <section id="startup-day" className="xp-sd-strip">
          <SdReveal className="xp-sd">
            <p className="sd-kicker">Evento del año</p>
            <h2 className="sd-h2 xp-sd__title">Startup Day</h2>
            <p className="xp-sd__meta">
              <span>{SD_EVENT.dateLabel}</span>
              <span aria-hidden className="xp-sd__dot" />
              <span>{SD_EVENT.timeLabel}</span>
              <span aria-hidden className="xp-sd__dot" />
              <span>{SD_EVENT.address}</span>
              <span aria-hidden className="xp-sd__dot" />
              <span>{SD_EVENT.priceLabel}</span>
            </p>
            <p className="sd-lead xp-sd__lead">{SD_XPLORA_ABOUT.whyEvent}</p>
            <div className="xp-actions">
              <a className="sd-btn sd-btn--primary" href={sdHref}>
                Ver Startup Day
              </a>
              <button
                type="button"
                className="xp-hero__link"
                onClick={() => scrollTo('newsletter')}
              >
                Quiero que me avisen
              </button>
            </div>
          </SdReveal>
        </section>

        {/* Empresas */}
        <section id="empresas" className="xp-section xp-section--cream">
          <SdReveal className="xp-section__intro">
            <p className="sd-kicker">Empresas</p>
            <h2 className="sd-h2">Ya pasaron por acá</h2>
            <p className="sd-lead">
              Marcas que eligieron Xplora para conectar con talento.
            </p>
          </SdReveal>

          <XploraMarquee label="Empresas en Xplora">
            <div className="xp-marquee__track">
              {[0, 1].map((dup) => (
                <div key={dup} className="xp-marquee__group" aria-hidden={dup === 1}>
                  {brands.map((co) => (
                    <div key={`${dup}-${co.id}`} className="xp-logo" aria-label={co.name}>
                      <img
                        src={co.logoUrl}
                        alt={co.name}
                        loading="lazy"
                        decoding="async"
                        draggable={false}
                      />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </XploraMarquee>

          <SdReveal className="xp-actions">
            <StartupDaySponsorCta
              label="Quiero participar"
              kicker="Empresas · Xplora"
              title="Participar en Xplora"
              successText="Te escribimos para ver cómo suma tu empresa."
              interes="ambos"
              mensajePrefix="Interés en participar con empresa en Xplora"
              placeholder="Qué te interesa"
              className="sd-btn--primary"
            />
          </SdReveal>
        </section>

        {/* FAQ — encabezado en barra + lista full-width (distinto al newsletter) */}
        <section id="faq" className="xp-section xp-section--cream xp-faq-sec">
          <img
            className="xp-faq__mark"
            src={brandLogo}
            alt=""
            aria-hidden
            decoding="async"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = DEFAULT_LOGO_URL;
            }}
          />
          <div className="xp-faq__content">
            <SdReveal className="xp-faq-bar">
              <div>
                <p className="sd-kicker">FAQ</p>
                <h2 className="sd-h2">Preguntas frecuentes</h2>
              </div>
              <p className="xp-faq-bar__aside">Lo básico para sumarte sin fricción.</p>
            </SdReveal>
            <SdReveal delay={1} className="xp-faq">
              {XP_FAQS.map((item, i) => {
                const open = openFaq === i;
                return (
                  <div key={item.q} className={`xp-faq__item${open ? ' is-open' : ''}`}>
                    <button
                      type="button"
                      className="xp-faq__q"
                      aria-expanded={open}
                      onClick={() => setOpenFaq(open ? null : i)}
                    >
                      <span>{item.q}</span>
                      <span className="xp-faq__icon" aria-hidden>
                        {open ? '−' : '+'}
                      </span>
                    </button>
                    {open ? <p className="xp-faq__a">{item.a}</p> : null}
                  </div>
                );
              })}
            </SdReveal>
          </div>
        </section>

        {/* Newsletter */}
        <section id="newsletter" className="xp-section xp-section--ink xp-nl-sec">
          <div className="sd-reserve">
            <SdReveal>
              <p className="sd-kicker">Newsletter</p>
              <h2 className="sd-h2">Enterate antes</h2>
              <p className="sd-lead">
                Eventos, empleo y Startup Day. Dejá tus datos y te escribimos con lo que importa.
              </p>
            </SdReveal>
            <SdReveal delay={1}>
              <XploraNewsletterForm />
            </SdReveal>
          </div>
        </section>
      </div>
    </SdShell>
  );
}
