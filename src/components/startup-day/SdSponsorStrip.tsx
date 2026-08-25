import { SdReveal } from './SdReveal';

/**
 * Marcas que apoyan Startup Day, debajo del hero — como en el banner de difusión.
 * Gris parejo y sin tile de fondo: no son "startups en el piso" (esas van en el carrusel de
 * `#confirmadas`), son sponsors, y acá el logo se lee como crédito, no como protagonista.
 */
const SD_SPONSOR_STRIP = [
  { id: 'coworkeando', name: 'Coworkeando', logoUrl: '/logos/startup-day/coworkeando.png?v=12', website: 'https://www.coworkeando.com/' },
  { id: 'yafu', name: 'Yafu', logoUrl: '/logos/startup-day/yafu.png?v=12', website: 'https://yafu.app/' },
  { id: 'zettios', name: 'Zettios', logoUrl: '/logos/startup-day/zettios.png?v=12', website: 'https://www.zettios.com/' },
  { id: 'cobrando', name: 'Cobrando', logoUrl: '/logos/startup-day/cobrando-wordmark.png?v=1', website: 'https://cobrando.app/' },
  { id: 'resender', name: 'Resender', logoUrl: '/logos/startup-day/resender-dev.png?v=2', website: 'https://resender.dev/' },
] as const;

export function SdSponsorStrip({ className }: { className?: string }) {
  return (
    <SdReveal className={`sd-sponsor-strip${className ? ` ${className}` : ''}`}>
      <p className="sd-sponsor-strip__label">Nos apoyan</p>
      <div className="sd-sponsor-strip__row">
        {SD_SPONSOR_STRIP.map((s, i) => (
          <a
            key={s.id}
            className="sd-sponsor-strip__logo"
            href={s.website}
            target="_blank"
            rel="noopener noreferrer"
            title={s.name}
            style={{ transitionDelay: `${i * 70}ms` }}
          >
            <img src={s.logoUrl} alt={s.name} loading="lazy" />
          </a>
        ))}
      </div>
    </SdReveal>
  );
}
