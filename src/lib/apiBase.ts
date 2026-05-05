/**
 * Origen del backend en desarrollo: vacío → usa el proxy de Vite (`/api` → API en 8787).
 * Si definís `VITE_API_ORIGIN=http://127.0.0.1:8787` el front llama directo al API (útil para depurar).
 */
export function apiUrl(path: string): string {
  const origin = (import.meta.env.VITE_API_ORIGIN as string | undefined)?.trim().replace(/\/$/, '') ?? '';
  const p = path.startsWith('/') ? path : `/${path}`;
  return origin ? `${origin}${p}` : p;
}
