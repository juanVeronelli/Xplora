/**
 * Fila de mini-cuadrados llenos/vacíos — el glifo del sistema modular de "Para quién es"
 * (ver `SdManifesto.tsx`), repetido acá como eco estático puramente decorativo para que
 * "Confirmadas" no se sienta como una sección desconectada. Sin motion.
 */
const BITS = [1, 0, 1, 1, 0, 1, 0] as const;

export function SdModuleStrip({ className }: { className?: string }) {
  return (
    <span className={`sd-module-strip${className ? ` ${className}` : ''}`} aria-hidden>
      {BITS.map((on, i) => (
        <i key={i} className={`sd-module-strip__bit${on ? ' is-on' : ''}`} />
      ))}
    </span>
  );
}
