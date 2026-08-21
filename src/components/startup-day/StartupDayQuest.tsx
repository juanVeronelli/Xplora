import { SD_QUEST } from '../../data/startupDay';
import { mainSiteUrl } from '../../lib/startupDayHost';
import { SdReveal } from './SdReveal';

/** Coda dentro de Confirmadas — no es una sección aparte. */
export function StartupDayQuest() {
  const cuentaHref = `${mainSiteUrl().replace(/\/$/, '')}/cuenta`;

  return (
    <SdReveal className="sd-quest">
      <div className="sd-quest__row">
        <div className="sd-quest__copy-block">
          <p className="sd-quest__label">{SD_QUEST.kicker}</p>
          <p className="sd-quest__line">
            Escaneá el QR de cada stand con sesión iniciada. Cada check-in suma una chance al
            sorteo.
          </p>
          <p className="sd-quest__note">{SD_QUEST.note}</p>
        </div>
        <a className="sd-btn sd-btn--primary sd-quest__cta" href={cuentaHref}>
          {SD_QUEST.ctaLabel}
        </a>
      </div>
      <p className="sd-quest__steps" aria-label="Cómo funciona">
        {SD_QUEST.steps.map((step, i) => (
          <span key={step.n} className="sd-quest__step">
            {i > 0 ? <span className="sd-quest__sep" aria-hidden /> : null}
            <span className="sd-quest__step-n">{step.n}</span>
            <span className="sd-quest__step-tag">{step.tag}</span>
          </span>
        ))}
      </p>
    </SdReveal>
  );
}
