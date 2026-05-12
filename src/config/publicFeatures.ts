/**
 * Visibilidad en el sitio público (SPA). Los módulos siguen en el repo; solo se ocultan entradas y rutas.
 * Para reactivar la bolsa: poné `true` y redeploy.
 */
export const PUBLIC_BOLSA_ENABLED = false;

/** Base path para deep-links `#apply=<empleoId>` (magic link / volver a postular). */
export function publicApplyReturnBasePath(): string {
  return PUBLIC_BOLSA_ENABLED ? '/bolsa' : '/talento';
}
