/**
 * Sección del render 3D del piso.
 *
 * El chunk de `three` pesa más que el resto de la landing junta, así que la escena:
 *   1. se importa con `React.lazy` (chunk aparte),
 *   2. no se monta hasta que la sección está por entrar en pantalla,
 *   3. reintenta el import si falla y, si ni así carga, la sección se apoya sólo en la lista
 *      de salas: el viewport no se monta y no queda ni caja vacía ni aviso de error.
 *
 * La identificación de cada sala vive acá, en HTML al costado del canvas, y no dentro del
 * render: pintar los muros de colores para distinguirlas hacía que la maqueta pareciera de
 * plástico. La lista y el 3D se resaltan mutuamente.
 */
import { Component, Suspense, lazy, useEffect, useRef, useState, type ReactNode } from 'react';
import { SALAS, detalleDe, type Sala } from '../../../data/startupDayFloor';

/**
 * Un import dinámico que falla casi siempre falla por algo pasajero: un corte de red o —el
 * caso frecuente— un deploy nuevo que dejó el HTML viejo apuntando a un hash de chunk que ya
 * no existe. Por eso se reintenta antes de darlo por perdido; recién si los tres intentos
 * fallan el error sube al `LimiteDeError`.
 */
const ESPERAS_MS = [400, 1200];

function importarEscena(intento = 0): Promise<typeof import('./FloorScene')> {
  return import('./FloorScene').catch((e) => {
    if (intento >= ESPERAS_MS.length) throw e;
    return new Promise<void>((listo) => setTimeout(listo, ESPERAS_MS[intento])).then(() =>
      importarEscena(intento + 1),
    );
  });
}

const FloorScene = lazy(() => importarEscena());

/** WebGL puede faltar por hardware, por driver bloqueado o por navegador viejo. */
function hayWebGL(): boolean {
  try {
    const c = document.createElement('canvas');
    const ctx = c.getContext('webgl2') ?? c.getContext('webgl');
    if (!window.WebGLRenderingContext || !ctx) return false;
    /* El navegador tiene un cupo de contextos WebGL vivos: si la prueba se queda con el suyo,
       le compite el lugar al canvas de la escena, que es el que importa. */
    ctx.getExtension('WEBGL_lose_context')?.loseContext();
    return true;
  } catch {
    return false;
  }
}

/**
 * La lista nombra los nueve espacios a los que se entra el día del evento. Sala de estar,
 * Recepción y los depósitos ya no existen en el modelo: se sacaron del piso.
 */
const ORDEN: Record<Sala['tipo'], number> = {
  stands: 0,
  workshops: 1,
  nucleo: 2,
};
const SALAS_LISTADAS = [...SALAS].sort((a, b) => ORDEN[a.tipo] - ORDEN[b.tipo]);

/**
 * Si el chunk de three termina de fallar, la sección se queda sin render y punto: avisa hacia
 * arriba con `onFallo` para que se desmonte el viewport entero. No hay imagen de reemplazo —
 * la lista de salas al costado ya comunica el piso.
 */
class LimiteDeError extends Component<
  { onFallo: () => void; children: ReactNode },
  { falló: boolean }
> {
  state = { falló: false };
  static getDerivedStateFromError() {
    return { falló: true };
  }
  componentDidCatch() {
    this.props.onFallo();
  }
  render() {
    return this.state.falló ? null : this.props.children;
  }
}

export function StartupDayFloor() {
  const ref = useRef<HTMLDivElement>(null);
  const [cerca, setCerca] = useState(false);
  const [webgl, setWebgl] = useState<boolean | null>(null);
  const [falló, setFalló] = useState(false);
  const [activa, setActiva] = useState<string | null>(null);

  useEffect(() => {
    setWebgl(hayWebGL());
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setCerca(true);
          obs.disconnect();
        }
      },
      /* Se adelanta media pantalla para que el chunk llegue antes de que se vea. */
      { rootMargin: '50% 0px' },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  /* Sin WebGL o con el chunk caído no hay nada que mostrar en la caja, así que no va la caja. */
  const sinRender = webgl === false || falló;

  return (
    <div
      className={`sd-piso__layout${sinRender ? ' sd-piso__layout--sin-render' : ''}`}
      ref={ref}
    >
      {sinRender ? null : (
        <div className="sd-piso__viewport">
          {cerca && webgl ? (
            <LimiteDeError onFallo={() => setFalló(true)}>
              <Suspense fallback={<p className="sd-piso__cargando">Cargando el piso…</p>}>
                <FloorScene activa={activa} onActivar={setActiva} />
              </Suspense>
            </LimiteDeError>
          ) : (
            <p className="sd-piso__cargando">Cargando el piso…</p>
          )}
        </div>
      )}

      <ul className="sd-piso__ref">
        {SALAS_LISTADAS.map((s) => (
          <li key={s.id}>
            <button
              type="button"
              className={`sd-piso__ref-item${activa === s.id ? ' is-activa' : ''}${
                s.acceso === 'bloqueada' ? ' is-sin-uso' : ''
              }`}
              onMouseEnter={() => setActiva(s.id)}
              onMouseLeave={() => setActiva(null)}
              onFocus={() => setActiva(s.id)}
              onBlur={() => setActiva(null)}
            >
              <span className="sd-piso__ref-label">{s.label}</span>
              <span className="sd-piso__ref-detalle">{detalleDe(s)}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
