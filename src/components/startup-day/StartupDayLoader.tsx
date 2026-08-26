import { forwardRef } from 'react';
import { DEFAULT_LOGO_URL } from '../../lib/defaultsMedia';

/**
 * Pantalla de carga. Sólo pinta: la salida la maneja `SdPixelWave`, que barre este mismo elemento
 * con un `clip-path` por pasos. Antes hacía un iris circular propio de 3 s en rAF y la página
 * tardaba ~4,3 s en quedar limpia.
 *
 * Va con `forwardRef` porque la onda necesita el nodo para animarlo.
 */
export const StartupDayLoader = forwardRef<
  HTMLDivElement,
  { done: boolean; logoUrl?: string }
>(function StartupDayLoader({ done, logoUrl }, ref) {
  return (
    <div
      ref={ref}
      className={`sd-loader${done ? ' is-done' : ''}`}
      aria-hidden={done}
      aria-busy={!done}
    >
      <div className="sd-loader__bg" aria-hidden>
        <span className="sd-loader__glow sd-loader__glow--a" />
        <span className="sd-loader__glow sd-loader__glow--b" />
        <span className="sd-loader__grain" />
      </div>
      <div className="sd-loader__inner">
        <div className="sd-loader__mark">
          <span className="sd-loader__orbit" aria-hidden />
          <img
            className="sd-loader__logo"
            src={logoUrl || DEFAULT_LOGO_URL}
            alt=""
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = DEFAULT_LOGO_URL;
            }}
          />
        </div>
        <p className="sd-loader__label">Cargando</p>
      </div>
    </div>
  );
});
