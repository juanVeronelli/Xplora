/**
 * Landing exclusiva startupday.xploraucema.com — funnel Startup Day.
 */
import { useEffect, useState } from 'react';
import { useSiteMedia } from '../context/SiteMediaContext';
import { DEFAULT_LOGO_URL } from '../lib/defaultsMedia';
import { MAIN_SITE_URL, STARTUP_DAY_CANONICAL } from '../lib/startupDayHost';
import {
  SD_COMING_SOON,
  SD_EVENT,
  SD_STARTUPMATE,
  sdLumaUrl,
} from '../data/startupDay';
import { SdReveal } from '../components/startup-day/SdReveal';
import { SdShell } from '../components/startup-day/SdShell';
import { SdExperiencia } from '../components/startup-day/SdExperiencia';
import { SdManifesto } from '../components/startup-day/SdManifesto';
import { StartupDayAgenda } from '../components/startup-day/StartupDayAgenda';
import { StartupDayComingSoon } from '../components/startup-day/StartupDayComingSoon';
import { StartupDayCursor } from '../components/startup-day/StartupDayCursor';
import { SdAsciiDisc } from '../components/startup-day/SdAsciiDisc';
import { SdSponsorStrip } from '../components/startup-day/SdSponsorStrip';
import { StartupDayFloor } from '../components/startup-day/floor/StartupDayFloor';
import '../styles/startupDay.css';

/** Tags decorativos de la sección StartupMate — ilustran ejes de matching, no una UI real. */
const SD_STARTUPMATE_TAGS: readonly { label: string; x: number; y: number; d: number }[] = [
  { label: 'Founder', x: 6, y: 18, d: 0 },
  { label: 'Technical', x: 78, y: 12, d: 0.6 },
  { label: 'Idea temprana', x: 14, y: 68, d: 1.2 },
  { label: 'Busca equipo', x: 70, y: 74, d: 0.3 },
  { label: 'Producto en marcha', x: 42, y: 8, d: 0.9 },
];

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
        ? 'Startup Day by Xplora UCEMA. Lo estamos construyendo — pronto disponible. 11 de septiembre 2026. Entrada 100% gratuita.'
        : 'Startup Day by Xplora UCEMA. 11 de septiembre 2026, Av. Alem 882. Entrada 100% gratuita. Startups, workshops, pitch e inversores.';
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
  return (
    <>
      <section className="sd-hero">
        <div className="sd-hero__grid">
          <div className="sd-hero__content">
            {/* Logo de key art en vez de texto seteado en CSS: después de varias vueltas afinando
                itálica/tracking/glow a mano para igualar el banner, se usa directamente el
                wordmark que ya viene diseñado así. */}
            <h1 className="sd-hero__title">
              <img
                className="sd-hero__title-img"
                src="/logos/startup-day/startup-day-wordmark.png?v=1"
                alt="Startup Day"
              />
            </h1>

            <p className="sd-hero__lede">
              El mayor evento para startups y builders del año.
            </p>

            <div className="sd-hero__facts">
              <div>
                <span className="sd-hero__fact-k">Fecha</span>
                <strong>11.09</strong>
              </div>
              <div>
                <span className="sd-hero__fact-k">Lugar</span>
                <strong>Buenos Aires</strong>
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
                La experiencia
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

      <div id="sponsors" className="sd-sponsor-band">
        <SdSponsorStrip />
      </div>

      <SdManifesto />

      <SdExperiencia />

      {/* "El lugar" + Agenda fusionados: la agenda ya no es una sección aparte con su propio
          fondo — es la continuación directa del piso ("así va a suceder"), ver
          `.sd-piso__agenda` y el comentario en `StartupDayAgenda.tsx`. */}
      <section id="piso" className="sd-band sd-band--ink sd-piso">
        <SdReveal className="sd-piso__head">
          {/* Masthead: título a la izquierda y la regla corriendo hasta el margen derecho. */}
          <div className="sd-piso__masthead">
            <h2 className="sd-piso__title">El lugar</h2>
            <span className="sd-piso__rule" aria-hidden />
          </div>
          <p className="sd-piso__lead">
            Dos salas de workshops, cuatro con stands y el hall alrededor del núcleo de
            ascensores. Giralo para ver cómo se recorre el día.
          </p>
        </SdReveal>

        <StartupDayFloor />

        <StartupDayAgenda />
      </section>

      <section id="startupmate" className="sd-band sd-band--purple-wash sd-smate">
        <div className="sd-smate__tags" aria-hidden>
          {SD_STARTUPMATE_TAGS.map((t) => (
            <span
              key={t.label}
              className="sd-smate__tag"
              style={{ ['--x' as string]: t.x, ['--y' as string]: t.y, ['--d' as string]: t.d }}
            >
              {t.label}
            </span>
          ))}
        </div>

        <SdReveal className="sd-smate__inner">
          <p className="sd-kicker">{SD_STARTUPMATE.kicker}</p>
          <h2 className="sd-smate__headline">
            <span>Encontrá</span>
            <span className="sd-smate__headline-accent">a tu cofounder</span>
          </h2>
          <p className="sd-smate__name">{SD_STARTUPMATE.name}</p>
          <p className="sd-smate__tagline">{SD_STARTUPMATE.tagline}</p>
          <p className="sd-lead">{SD_STARTUPMATE.lead}</p>
          <p className="sd-smate__note">
            <span className="sd-smate__pulse" aria-hidden />
            {SD_STARTUPMATE.note}
          </p>
        </SdReveal>
      </section>

      <section id="reservar" className="sd-band sd-band--ink">
        <SdReveal className="sd-signup">
          <p className="sd-kicker">Inscripción</p>
          <h2 className="sd-h2">¿Venís?</h2>
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
