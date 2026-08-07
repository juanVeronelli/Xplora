/**
 * Entrega optimizada de imágenes ya subidas a Cloudinary (sin dependencias, seguro en el browser).
 *
 * Los banners se guardan como PNG crudo (`/image/upload/v123/archivo.png`), así que el navegador
 * baja el original y lo reescala él mismo: pesado y blando cuando lo agranda. Insertando
 * transformaciones después de `/upload/` pedimos el tamaño exacto que vamos a pintar,
 * en formato moderno (`f_auto` → AVIF/WebP) y con el remuestreo de Cloudinary, que es
 * bastante mejor que el del browser.
 *
 * Si la URL no es de Cloudinary (assets locales, etc.) se devuelve tal cual.
 */

const CLOUDINARY_UPLOAD = /^(https?:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)(.+)$/;

/** Anchos que ofrecemos al browser para un banner a todo lo ancho. */
export const BANNER_WIDTHS = [768, 1080, 1440, 1920, 2560] as const;

export function isCloudinaryUrl(url: string): boolean {
  return CLOUDINARY_UPLOAD.test(url.trim());
}

/**
 * Misma imagen servida al ancho pedido. `c_limit` solo achica: nunca agranda por encima del
 * original, porque agrandar no suma detalle — solo lo vuelve borroso. `e_sharpen` compensa
 * la suavidad que deja el reescalado hacia abajo.
 */
export function cloudinaryWidth(url: string, width: number): string {
  const m = CLOUDINARY_UPLOAD.exec(url.trim());
  if (!m) return url;
  const [, base, rest] = m;
  return `${base}f_auto,q_auto:best,c_limit,w_${width},e_sharpen:40/${rest}`;
}

/** `srcSet` con varios anchos para que cada pantalla baje solo lo que necesita. */
export function cloudinarySrcSet(url: string, widths: readonly number[] = BANNER_WIDTHS): string | undefined {
  if (!isCloudinaryUrl(url)) return undefined;
  return widths.map(w => `${cloudinaryWidth(url, w)} ${w}w`).join(', ');
}
