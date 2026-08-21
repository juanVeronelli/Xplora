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
  SD_LUMA_URL,
  SD_STARTUPS,
} from '../data/startupDay';
import { SdReveal } from '../components/startup-day/SdReveal';
import { SdShell } from '../components/startup-day/SdShell';
import { StartupDayAgenda } from '../components/startup-day/StartupDayAgenda';
import { StartupDayComingSoon } from '../components/startup-day/StartupDayComingSoon';
import { StartupDayWaitlistForm } from '../components/startup-day/StartupDayWaitlistForm';
import { StartupDaySponsorCta } from '../components/startup-day/StartupDaySponsorForm';
import { StartupDayCursor } from '../components/startup-day/StartupDayCursor';
import { StartupDayHeroFx } from '../components/startup-day/StartupDayHeroFx';
import { StartupDayWho } from '../components/startup-day/StartupDayWho';
import { StartupDayQuest } from '../components/startup-day/StartupDayQuest';
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
        ? 'Startup Day by Xplora UCEMA. Lo estamos construyendo — pronto disponible. 11 de septiembre 2026. Entrada 100% gratuita.'
        : 'Startup Day by Xplora UCEMA. 11 de septiembre 2026, 15 a 20 hs, Av. Alem 882. Entrada 100% gratuita. Inscripción abierta.';
    }

    const t = comingSoon ? undefined : window.setTimeout(() => setLoaderDone(true), 1300);
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
      cta={{ label: 'Inscribirme', href: SD_LUMA_URL }}
    >
      <StartupDayContent />
    </SdShell>
  );
}

function StartupDayContent() {
  const rows = [
    SD_STARTUPS.filter((_, i) => i % 3 === 0),
    SD_STARTUPS.filter((_, i) => i % 3 === 1),
    SD_STARTUPS.filter((_, i) => i % 3 === 2),
  ].map((row) => (row.length ? row : SD_STARTUPS.slice(0, 8)));

  return (
    <>
      <section className="sd-hero">
        <StartupDayHeroFx />

        <div className="sd-hero__content">
          <p className="sd-hero__eyebrow">Xplora · UCEMA · 1ª edición</p>

          <h1 className="sd-hero__title">
            <span className="sd-hero__line">Startup</span>
            <span className="sd-hero__line sd-hero__line--day">Day</span>
          </h1>

          <p className="sd-hero__lede">
            Un día con startups argentinas en UCEMA: stands, workshops, pitch e inversores. Primera
            edición de Xplora. Entrada 100% gratuita.
          </p>

          <div className="sd-hero__facts">
            <div>
              <span className="sd-hero__fact-k">Fecha</span>
              <strong>11.09.26</strong>
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
              href={SD_LUMA_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              Inscribirme
            </a>
            <a className="sd-btn sd-btn--ghost" href="#agenda">
              Ver agenda
            </a>
          </div>
        </div>

        <a className="sd-hero__scroll" href="#para-quien">
          Seguí bajando
          <span aria-hidden />
        </a>
      </section>

      <StartupDayAgenda />

      <StartupDayWho />

      <section id="confirmadas" className="sd-band sd-band--ink">
        <SdReveal>
          <p className="sd-kicker">Confirmadas</p>
          <h2 className="sd-h2">Startups en el piso</h2>
        </SdReveal>

        <div className="sd-marquee-stack" aria-label="Startups confirmadas">
          {rows.map((row, rowIndex) => {
            const dir = rowIndex % 2 === 0 ? 'left' : 'right';
            const duration = `${42 + rowIndex * 10}s`;
            return (
              <div
                key={rowIndex}
                className={`sd-marquee-row sd-marquee-row--${dir}`}
                style={{ ['--sd-marquee-duration' as string]: duration }}
              >
                <div className="sd-marquee-row__track">
                  {[0, 1].map((dup) => (
                    <div
                      key={dup}
                      className="sd-marquee-row__group"
                      aria-hidden={dup === 1 || undefined}
                    >
                      {row.map((co) => {
                        const href = co.website || co.linkedin || co.instagram;
                        const inner = co.logoUrl ? (
                          <img src={co.logoUrl} alt={dup === 0 ? co.name : ''} loading="lazy" />
                        ) : (
                          <span className="sd-logo-tile__name">{co.name}</span>
                        );
                        if (href) {
                          return (
                            <a
                              key={`${dup}-${co.id}`}
                              className="sd-logo-tile"
                              href={href}
                              target="_blank"
                              rel="noopener noreferrer"
                              title={co.name}
                              tabIndex={dup === 1 ? -1 : undefined}
                            >
                              {inner}
                            </a>
                          );
                        }
                        return (
                          <div
                            key={`${dup}-${co.id}`}
                            className="sd-logo-tile"
                            title={co.name}
                          >
                            {inner}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <StartupDayQuest />
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

      <section id="sponsors" className="sd-band sd-band--cream sd-spn">
        <SdReveal className="sd-spn__inner">
          <p className="sd-spn__label">Sponsors · Primera edición</p>

          <div className="sd-spn__logos" aria-label="Sponsors Startup Day">
            {SD_EDITION_SPONSORS.map((sp) => {
              const href = sp.website || sp.linkedin || sp.instagram;
              const img = sp.logoUrl ? (
                <img src={sp.logoUrl} alt={sp.name} loading="lazy" />
              ) : (
                <span className="sd-spn__brand">{sp.name}</span>
              );
              const className = 'sd-spn__logo';
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

          <div className="sd-spn__foot">
            <StartupDaySponsorCta className="sd-spn__cta" />
          </div>
        </SdReveal>
      </section>

      <section id="reservar" className="sd-band sd-band--ink">
        <div className="sd-reserve">
          <SdReveal>
            <p className="sd-kicker">Inscripción abierta</p>
            <h2 className="sd-h2">Reservá tu lugar</h2>
            <p className="sd-lead">
              El evento es 100% gratuito. Inscribite en Luma y asegurate tu entrada al Startup Day.
            </p>
            <div style={{ marginTop: 20 }}>
              <a
                className="sd-btn sd-btn--primary"
                href={SD_LUMA_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                Inscribirme en Luma
              </a>
            </div>
          </SdReveal>
          <SdReveal delay={1}>
            <p className="sd-lead" style={{ marginBottom: 16 }}>
              ¿Querés que te avisemos novedades? Dejá tu email.
            </p>
            <StartupDayWaitlistForm />
          </SdReveal>
        </div>
      </section>
    </>
  );
}
