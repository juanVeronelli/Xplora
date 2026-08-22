/**
 * Sección del render 3D del piso.
 *
 * El chunk de `three` pesa más que el resto de la landing junta, así que la escena:
 *   1. se importa con `React.lazy` (chunk aparte),
 *   2. no se monta hasta que la sección está por entrar en pantalla,
 *   3. cae al croquis si no hay WebGL o si el chunk no carga.
 *
 * La identificación de cada sala vive acá, en HTML al costado del canvas, y no dentro del
 * render: pintar los muros de colores para distinguirlas hacía que la maqueta pareciera de
 * plástico. La lista y el 3D se resaltan mutuamente.
 */
import { Component, Suspense, lazy, useEffect, useRef, useState, type ReactNode } from 'react';
import { SALAS, detalleDe, type Sala } from '../../../data/startupDayFloor';

const FloorScene = lazy(() => import('./FloorScene'));

/** WebGL puede faltar por hardware, por driver bloqueado o por navegador viejo. */
function hayWebGL(): boolean {
  try {
    const c = document.createElement('canvas');
    return Boolean(
      window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')),
    );
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

function CroquisFallback({ motivo }: { motivo: string }) {
  return (
    <div className="sd-piso__fallback">
      <img
        src="/piso/plano-2do-piso.png"
        alt="Plano del 2º piso de Av. Alem 882: K y M para workshops, L, N, O y Q con stands, baños y ascensores en el núcleo central."
        loading="lazy"
      />
      <p className="sd-piso__fallback-n">{motivo}</p>
    </div>
  );
}

/** Si el chunk de three falla (red, bloqueo, browser viejo), la sección igual comunica el piso. */
class LimiteDeError extends Component<{ children: ReactNode }, { falló: boolean }> {
  state = { falló: false };
  static getDerivedStateFromError() {
    return { falló: true };
  }
  render() {
    if (this.state.falló) {
      return <CroquisFallback motivo="No pudimos cargar la vista 3D. Este es el plano del piso." />;
    }
    return this.props.children;
  }
}

export function StartupDayFloor() {
  const ref = useRef<HTMLDivElement>(null);
  const [cerca, setCerca] = useState(false);
  const [webgl, setWebgl] = useState<boolean | null>(null);
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

  return (
    <div className="sd-piso__layout" ref={ref}>
      <div className="sd-piso__viewport">
        {webgl === false ? (
          <CroquisFallback motivo="Tu navegador no tiene WebGL. Este es el plano del piso." />
        ) : cerca && webgl ? (
          <LimiteDeError>
            <Suspense fallback={<p className="sd-piso__cargando">Cargando el piso…</p>}>
              <FloorScene activa={activa} onActivar={setActiva} />
            </Suspense>
          </LimiteDeError>
        ) : (
          <p className="sd-piso__cargando">Cargando el piso…</p>
        )}
      </div>

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
