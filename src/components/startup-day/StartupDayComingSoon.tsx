import { DEFAULT_LOGO_URL } from '../../lib/defaultsMedia';
import { SD_EVENT } from '../../data/startupDay';
import { mainSiteUrl } from '../../lib/startupDayHost';
import { StartupDayHeroFx } from './StartupDayHeroFx';

/** Gate full-screen mientras la landing está en construcción. */
export function StartupDayComingSoon({ logoUrl }: { logoUrl?: string }) {
  const logo = logoUrl || DEFAULT_LOGO_URL;
  const xploraHref = mainSiteUrl();

  return (
    <div className="sd-soon" role="status" aria-live="polite">
      <StartupDayHeroFx />

      <div className="sd-soon__content">
        <div className="sd-soon__mark">
          <span className="sd-soon__orbit" aria-hidden />
          <img
            className="sd-soon__logo"
            src={logo}
            alt="Xplora"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = DEFAULT_LOGO_URL;
            }}
          />
        </div>

        <p className="sd-soon__eyebrow">Xplora · UCEMA</p>

        <h1 className="sd-soon__title">
          <span className="sd-soon__title-line">Startup</span>
          <span className="sd-soon__title-line sd-soon__title-line--day">Day</span>
        </h1>

        <p className="sd-soon__lede">
          El evento de startups de Xplora. Lo estamos construyendo — pronto disponible.
        </p>

        <p className="sd-soon__meta">
          <span>{SD_EVENT.dateLabel}</span>
          <span className="sd-soon__dot" aria-hidden />
          <span>{SD_EVENT.priceLabel}</span>
        </p>

        <div className="sd-soon__status">
          <span className="sd-soon__pulse" aria-hidden />
          En construcción
        </div>

        <a className="sd-soon__link" href={xploraHref}>
          Ir a Xplora
        </a>
      </div>
    </div>
  );
}
