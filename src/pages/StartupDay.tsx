/**
 * Landing exclusiva startupday.xploraucema.com — funnel Startup Day.
 */
import { useEffect, useState } from 'react';
import { useSiteMedia } from '../context/SiteMediaContext';
import { DEFAULT_LOGO_URL } from '../lib/defaultsMedia';
import { MAIN_SITE_URL, STARTUP_DAY_CANONICAL } from '../lib/startupDayHost';
import {
  SD_COMING_SOON,
  SD_DAY_STORY,
  SD_EDITION_SPONSORS,
  SD_EVENT,
  SD_STARTUPMATE,
  SD_STARTUPS,
  sdLumaUrl,
} from '../data/startupDay';
import { SdReveal } from '../components/startup-day/SdReveal';
import { SdShell } from '../components/startup-day/SdShell';
import { StartupDayAgenda } from '../components/startup-day/StartupDayAgenda';
import { StartupDayComingSoon } from '../components/startup-day/StartupDayComingSoon';
import { StartupDaySponsorCta } from '../components/startup-day/StartupDaySponsorForm';
import { StartupDayCursor } from '../components/startup-day/StartupDayCursor';
import { SdAsciiDisc } from '../components/startup-day/SdAsciiDisc';
import { splitChars } from '../components/startup-day/splitChars';
import { StartupDayFloor } from '../components/startup-day/floor/StartupDayFloor';
import '../styles/startupDay.css';

function useComingSoonGate() {
  const [gated, setGated] = useState(SD_COMING_SOON);
  useEffect(() => {
    if (!SD_COMING_SOON) {
      setGated(false);
      return;
    }
    const params = new URLSearchParams(window.location.search);
    setGated(params.get('preview') !== '1');
  }, []);
  return gated;
}

export default function StartupDay() {
  const { logoUrl } = useSiteMedia();
  const brandLogo = logoUrl || DEFAULT_LOGO_URL;
  const comingSoon = useComingSoonGate();
  const [loaderDone, setLoaderDone] = useState(false);

  useEffect(() => {
    const prevTitle = document.title;
    document.title = comingSoon
      ? 'Startup Day — Pronto · Xplora UCEMA'
      : 'Startup Day — Xplora UCEMA';
    if (comingSoon) {
      document.documentElement.classList.add('sd-mode', 'sd-coming-soon');
    }

    let canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    const prevHref = canonical?.href ?? '';
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = STARTUP_DAY_CANONICAL;

    const metaDesc = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    const prevDesc = metaDesc?.content ?? '';
    if (metaDesc) {
      metaDesc.content = comingSoon
        ? 'Startup Day by Xplora UCEMA. Lo estamos construyendo — pronto disponible. 9 de septiembre 2026. Entrada 100% gratuita.'
        : 'Startup Day by Xplora UCEMA. 9 de septiembre 2026, Av. Alem 882. Entrada 100% gratuita. Startups, workshops, pitch e inversores.';
    }

    const t = comingSoon ? undefined : window.setTimeout(() => setLoaderDone(true), 900);
    if (comingSoon) setLoaderDone(true);

    return () => {
      if (t) window.clearTimeout(t);
      document.documentElement.classList.remove('sd-coming-soon');
      if (comingSoon) document.documentElement.classList.remove('sd-mode');
      document.title = prevTitle;
      if (canonical) canonical.href = prevHref || MAIN_SITE_URL;
      if (metaDesc) metaDesc.content = prevDesc;
    };
  }, [comingSoon]);

  if (comingSoon) {
    return (
      <div className="sd-root is-loaded">
        <StartupDayCursor />
        <StartupDayComingSoon logoUrl={brandLogo} />
      </div>
    );
  }

  return (
    <SdShell
      active="startupday"
      showLoader
      loaderDone={loaderDone}
      cta={{ label: 'Inscribirme', href: sdLumaUrl('nav') }}
    >
      <StartupDayContent />
    </SdShell>
  );
}

function StartupDayContent() {
  const marquee = [...SD_STARTUPS, ...SD_STARTUPS];

  return (
    <>
      <section className="sd-hero">
        <div className="sd-hero__grid">
          <div className="sd-hero__content">
            <p className="sd-hero__eyebrow">Xplora · UCEMA · 1ª edición</p>

            {/* aria-label en el h1 + aria-hidden en los spans: si no, un lector de pantalla deletrea
                los caracteres sueltos de `splitChars` uno por uno. */}
            <h1 className="sd-hero__title" aria-label="Startup Day">
              <span className="sd-hero__line" aria-hidden>
                {splitChars('Startup', 0)}
              </span>
              <span className="sd-hero__line sd-hero__line--day" aria-hidden>
                {splitChars('Day', 0.34)}
              </span>
            </h1>

            <p className="sd-hero__lede">
              Un día con startups argentinas en UCEMA: stands, workshops, pitch e inversores. Primera
              edición de Xplora. Entrada 100% gratuita.
            </p>

            <div className="sd-hero__facts">
              <div>
                <span className="sd-hero__fact-k">Fecha</span>
                <strong>09.09.26</strong>
              </div>
              <div>
                <span className="sd-hero__fact-k">Horario</span>
                <strong>{SD_EVENT.timeLabel.replace(' a ', ' — ')}</strong>
              </div>
              <div>
                <span className="sd-hero__fact-k">Lugar</span>
                <strong>Av. Alem 882</strong>
              </div>
              <div>
                <span className="sd-hero__fact-k">Entrada</span>
                <strong>{SD_EVENT.priceLabel}</strong>
              </div>
            </div>

            <div className="sd-hero__actions">
              <a
                className="sd-btn sd-btn--primary"
                href={sdLumaUrl('hero')}
                target="_blank"
                rel="noopener noreferrer"
              >
                Inscribirme gratis
              </a>
              <a className="sd-btn sd-btn--ghost" href="#que-pasa">
                Qué pasa ese día
              </a>
            </div>
          </div>

          <SdAsciiDisc className="sd-hero__disc" />
        </div>

        <a className="sd-hero__scroll" href="#para-quien">
          Seguí bajando
          <span aria-hidden />
        </a>
      </section>

      {/* Afiche, no banda de contenido: el disco va de fondo y el peso lo lleva la tipografía.
          Los cuatro títulos son las cuatro líneas — los párrafos se eliminaron enteros. */}
      <section id="para-quien" className="sd-poster">
        <SdAsciiDisc className="sd-poster__disc" opacity={0.5} />

        <SdReveal className="sd-poster__inner">
          <p className="sd-poster__kicker">Para quién es</p>

          <h2 className="sd-poster__deny">
            No hace falta tener una startup
            <span className="sd-poster__yes">Hace falta tener ganas.</span>
          </h2>

          <ul className="sd-poster__list">
            <li>Tenés una idea dando vueltas</li>
            <li>Querés hablar con alguien que ya levantó capital</li>
            <li>Ya estás construyendo algo</li>
            <li>Todavía no tenés nada</li>
          </ul>

          <p className="sd-poster__foot">
            Del otro lado pasa lo mismo: los equipos que exponen se llevan gente nueva que entiende
            lo que están construyendo.
          </p>
        </SdReveal>
      </section>

      <StartupDayAgenda />

      <section id="confirmadas" className="sd-band sd-band--ink">
        <SdReveal>
          <p className="sd-kicker">Confirmadas</p>
          <h2 className="sd-h2">Startups en el piso</h2>
        </SdReveal>

        <div className="sd-marquee" aria-label="Startups confirmadas">
          <div
            className="sd-marquee__track"
            /* La duración escala con la cantidad de logos para que la velocidad no cambie. */
            style={{ ['--sd-marquee-dur' as string]: `${SD_STARTUPS.length * 4.75}s` }}
          >
            <div className="sd-marquee__group">
              {marquee.map((co, i) => {
                const href = co.website || co.linkedin || co.instagram;
                return (
                  <a
                    key={`${co.id}-${i}`}
                    className={`sd-logo-tile${co.tileLight ? ' sd-logo-tile--light' : ''}`}
                    href={href || '#'}
                    target={href ? '_blank' : undefined}
                    rel="noopener noreferrer"
                    onClick={(e) => {
                      if (!href) e.preventDefault();
                    }}
                    title={co.name}
                  >
                    {co.logoUrl ? (
                      <img src={co.logoUrl} alt={co.name} loading="lazy" />
                    ) : (
                      co.name
                    )}
                  </a>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section id="que-pasa" className="sd-band sd-band--purple-wash sd-pulse">
        <div className="sd-pulse__glow" aria-hidden />

        <SdReveal className="sd-pulse__head">
          <p className="sd-kicker">{SD_DAY_STORY.kicker}</p>
          <h2 className="sd-pulse__title">{SD_DAY_STORY.title}</h2>
          <p className="sd-pulse__meta">{SD_DAY_STORY.meta}</p>
          <p className="sd-pulse__lead">{SD_DAY_STORY.lead}</p>
        </SdReveal>

        <div className="sd-pulse__pillars">
          {SD_DAY_STORY.pillars.map((p, i) => (
            <SdReveal key={p.tag} delay={(i % 3) as 0 | 1 | 2} className="sd-pulse__pillar" as="article">
              <p className="sd-pulse__tag">{p.tag}</p>
              <p className="sd-pulse__copy">{p.text}</p>
            </SdReveal>
          ))}
        </div>
      </section>

      <section id="piso" className="sd-band sd-band--ink sd-piso">
        <SdReveal className="sd-piso__head">
          <p className="sd-kicker">El lugar</p>
          <h2 className="sd-h2">El 2º piso de Alem 882</h2>
          <p className="sd-lead">
            Dos salas de workshops, cuatro con stands y el hall alrededor del núcleo de
            ascensores. Giralo para ver cómo se recorre el día.
          </p>
        </SdReveal>

        <StartupDayFloor />
      </section>

      <section id="startupmate" className="sd-band sd-band--purple-wash sd-smate">
        <SdReveal className="sd-smate__inner">
          <p className="sd-kicker">{SD_STARTUPMATE.kicker}</p>
          <h2 className="sd-smate__name">{SD_STARTUPMATE.name}</h2>
          <p className="sd-smate__tagline">{SD_STARTUPMATE.tagline}</p>
          <p className="sd-lead">{SD_STARTUPMATE.lead}</p>
          <p className="sd-smate__note">
            <span className="sd-smate__pulse" aria-hidden />
            {SD_STARTUPMATE.note}
          </p>
        </SdReveal>
      </section>

      <section id="sponsors" className="sd-band sd-band--cream sd-spn">
        <SdReveal className="sd-spn__inner">
          <p className="sd-spn__label">Sponsors · Primera edición</p>

          {SD_EDITION_SPONSORS.length ? (
            <div className="sd-spn__logos" aria-label="Sponsors Startup Day">
              {SD_EDITION_SPONSORS.map((sp) => {
                const href = sp.website || sp.linkedin || sp.instagram;
                const img = sp.logoUrl ? (
                  <img src={sp.logoUrl} alt={sp.name} loading="lazy" />
                ) : (
                  <span className="sd-spn__brand">{sp.name}</span>
                );
                const className = `sd-spn__logo${sp.logoVariant === 'icon' ? ' sd-spn__logo--icon' : ''}`;
                return href ? (
                  <a
                    key={sp.id}
                    className={className}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {img}
                  </a>
                ) : (
                  <div key={sp.id} className={className}>
                    {img}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="sd-spn__soon">
              Estamos cerrando los sponsors de la primera edición. Si tu marca quiere estar, es
              el momento.
            </p>
          )}

          <div className="sd-spn__foot">
            <StartupDaySponsorCta className="sd-spn__cta" />
          </div>
        </SdReveal>
      </section>

      <section id="reservar" className="sd-band sd-band--ink">
        <SdReveal className="sd-signup">
          <p className="sd-kicker">Inscripción</p>
          <h2 className="sd-h2">Asegurá tu lugar</h2>
          <p className="sd-lead">
            Entrada {SD_EVENT.priceLabel} y cupos limitados. La inscripción se hace en Luma:
            reservás en un minuto y te llega la confirmación por mail.
          </p>

          <a
            className="sd-btn sd-btn--primary sd-signup__cta"
            href={sdLumaUrl('inscripcion')}
            target="_blank"
            rel="noopener noreferrer"
          >
            Inscribirme en Luma
          </a>

          <p className="sd-signup__meta">
            {SD_EVENT.dateLabel} · {SD_EVENT.timeLabel} · {SD_EVENT.addressFull}
          </p>
        </SdReveal>
      </section>
    </>
  );
}
