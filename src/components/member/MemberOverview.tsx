import { useMemberAuth } from '../../context/MemberAuthContext';
import { useSiteMedia } from '../../context/SiteMediaContext';

export function MemberOverview() {
  const { account, events } = useMemberAuth();
  const { memberLumaEmbedSrc } = useSiteMedia();
  const name = account?.displayName?.trim() || account?.email?.split('@')[0] || 'Miembro';

  return (
    <div className="ma-overview">
      <header className="ma-overview__head">
        <p className="ma-kicker">Cuenta Xplora</p>
        <h1 className="ma-title">Hola, {name}</h1>
        <p className="ma-sub">
          Perfil, bolsa, eventos y propuestas para la comunidad.
        </p>
      </header>

      <div className="ma-overview__grid ma-overview__grid--4">
        <a className="ma-tile" href="/cuenta/perfil">
          <span className="ma-tile__label">01</span>
          <h2 className="ma-tile__title">Mi perfil</h2>
          <p className="ma-tile__copy">
            Nombre, estudios, experiencia, skills, idiomas y CV.
          </p>
          <span className="ma-tile__go">Abrir perfil →</span>
        </a>

        <a className="ma-tile" href="/empleo">
          <span className="ma-tile__label">02</span>
          <h2 className="ma-tile__title">Bolsa de empleo</h2>
          <p className="ma-tile__copy">Ofertas de la comunidad Xplora.</p>
          <span className="ma-tile__go">Ver ofertas →</span>
        </a>

        <a className="ma-tile" href="/cuenta/eventos">
          <span className="ma-tile__label">03</span>
          <h2 className="ma-tile__title">Eventos</h2>
          <p className="ma-tile__copy">
            {events.length
              ? `${events.length} evento${events.length === 1 ? '' : 's'} en tu historial.`
              : 'Tu historial de inscripciones y asistencias.'}
          </p>
          <span className="ma-tile__go">Ver eventos →</span>
        </a>

        <a className="ma-tile" href="/cuenta/propuestas">
          <span className="ma-tile__label">04</span>
          <h2 className="ma-tile__title">Propuestas</h2>
          <p className="ma-tile__copy">
            Ideas de eventos, temas y feedback para Xplora.
          </p>
          <span className="ma-tile__go">Proponer →</span>
        </a>
      </div>

      {memberLumaEmbedSrc ? (
        <section className="ma-next-event" aria-labelledby="ma-next-event-title">
          <header className="ma-next-event__head">
            <p className="ma-kicker">Inscripción</p>
            <h2 id="ma-next-event-title" className="ma-title ma-title--sm">
              Anotate al próximo evento
            </h2>
            <p className="ma-sub">Reservá tu lugar desde acá.</p>
          </header>
          <div className="ma-luma-embed">
            <iframe
              title="Inscripción al próximo evento"
              src={memberLumaEmbedSrc}
              loading="lazy"
              allow="fullscreen; payment"
              referrerPolicy="strict-origin-when-cross-origin"
            />
          </div>
        </section>
      ) : null}
    </div>
  );
}
