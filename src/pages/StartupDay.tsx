/**
 * Landing exclusiva startupday.xploraucema.com — funnel Startup Day.
 */
import { lazy, Suspense, useEffect, useState } from 'react';
import { useSiteMedia } from '../context/SiteMediaContext';
import { DEFAULT_LOGO_URL } from '../lib/defaultsMedia';
import { MAIN_SITE_URL, STARTUP_DAY_CANONICAL } from '../lib/startupDayHost';
import {
  SD_COMING_SOON,
  SD_DAY_STORY,
  SD_EDITION_SPONSORS,
  SD_EVENT,
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
import '../styles/startupDay.css';

const StartupDayFloor3D = lazy(() =>
  import('../components/startup-day/StartupDayFloor3D').then((m) => ({ default: m.StartupDayFloor3D })),
);

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

  const scrollToReserve = () => {
    window.requestAnimationFrame(() => {
      document.getElementById('reservar')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

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
      cta={{ label: 'Sumarme a la lista', onClick: scrollToReserve }}
    >
      <StartupDayContent onReserve={scrollToReserve} />
    </SdShell>
  );
}

function StartupDayContent({ onReserve }: { onReserve: () => void }) {
  const marquee = [...SD_STARTUPS, ...SD_STARTUPS];

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
            <button type="button" className="sd-btn sd-btn--primary is-disabled" disabled>
              Inscripción próxima a abrir
            </button>
            <button type="button" className="sd-btn sd-btn--ghost" onClick={onReserve}>
              Aumentar mis chances
            </button>
          </div>
        </div>

        <a className="sd-hero__scroll" href="#para-quien">
          Seguí bajando
          <span aria-hidden />
        </a>
      </section>

      <section id="para-quien" className="sd-band sd-band--cream">
        <SdReveal className="sd-who__head">
          <p className="sd-kicker">Para quién es</p>
          <h2 className="sd-h2 sd-h2--wide">Si estás construyendo — o querés empezar</h2>
          <p className="sd-lead">
            Para estudiantes, founders y startups. Un espacio para mostrar producto, hacer preguntas
            y conectar con inversores y pares del ecosistema.
          </p>
        </SdReveal>

        <div className="sd-who">
          {[
            {
              n: '01',
              title: 'Estudiantes',
              text: 'Con una idea, un equipo en formación o interés real en el ecosistema emprendedor.',
            },
            {
              n: '02',
              title: 'Founders',
              text: 'Ya estás en marcha. Venís a contrastar aprendizajes y sumar contactos relevantes.',
            },
            {
              n: '03',
              title: 'Startups',
              text: 'Producto en escena. Stands, pitch e inversores en un mismo día.',
            },
          ].map((item, i) => (
            <SdReveal key={item.n} delay={(i % 3) as 0 | 1 | 2} className="sd-who__item">
              <span className="sd-who__n" aria-hidden>
                {item.n}
              </span>
              <div className="sd-who__body">
                <h3 className="sd-who__title">{item.title}</h3>
                <p className="sd-who__text">{item.text}</p>
              </div>
            </SdReveal>
          ))}
        </div>

        <SdReveal delay={1} className="sd-who__formats">
          <span>Stands</span>
          <span>Workshops</span>
          <span>Pitch</span>
          <span>Inversores</span>
          <span>Aceleradoras</span>
          <span>UCEMA</span>
        </SdReveal>
      </section>

      <StartupDayAgenda />

      <Suspense fallback={null}>
        <StartupDayFloor3D />
      </Suspense>

      <section id="confirmadas" className="sd-band sd-band--ink">
        <SdReveal>
          <p className="sd-kicker">Confirmadas</p>
          <h2 className="sd-h2">Startups en el piso</h2>
        </SdReveal>

        <div className="sd-marquee" aria-label="Startups confirmadas">
          <div className="sd-marquee__track">
            <div className="sd-marquee__group">
              {marquee.map((co, i) => (
                <a
                  key={`${co.id}-${i}`}
                  className="sd-logo-tile"
                  href={co.website || co.linkedin || co.instagram || '#'}
                  target={co.website || co.linkedin || co.instagram ? '_blank' : undefined}
                  rel="noopener noreferrer"
                  onClick={(e) => {
                    if (!co.website && !co.linkedin && !co.instagram) e.preventDefault();
                  }}
                  title={co.name}
                >
                  <img src={co.logoUrl} alt={co.name} loading="lazy" />
                </a>
              ))}
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
              const className = `sd-spn__logo${sp.id === 'mercadolibre' ? ' sd-spn__logo--icon' : ''}`;
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
            <p className="sd-kicker">Cupos limitados</p>
            <h2 className="sd-h2">Aumentá tus chances de entrar</h2>
            <p className="sd-lead">
              El evento es 100% gratuito. La inscripción aún no está abierta: dejar tu email no
              garantiza el lugar, pero prioriza tu lugar en la lista cuando abramos. Solo
              necesitamos el correo; vas a recibir confirmación por mail.
            </p>
            <div style={{ marginTop: 20 }}>
              <button type="button" className="sd-btn sd-btn--primary is-disabled" disabled>
                Inscripción próxima a abrir
              </button>
              <p className="sd-cta-disabled-note">Abrimos inscripción formal en los próximos días.</p>
            </div>
          </SdReveal>
          <SdReveal delay={1}>
            <StartupDayWaitlistForm />
          </SdReveal>
        </div>
      </section>
    </>
  );
}
