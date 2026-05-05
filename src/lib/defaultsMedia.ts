import type { CarouselSlide, LogoBrand } from '../types';

/** Imagen del hero (escritorio) — se usa si aún no hay nada guardado en la base */
export const DEFAULT_HERO_URL = '/images/IMG-20250910-WA0086.webp';

/** Video destacado Home (`highlight_video_url` null en BD = este valor por defecto). */
export const DEFAULT_HIGHLIGHT_VIDEO_URL =
  'https://res.cloudinary.com/dd477n60s/video/upload/v1777932852/WhatsApp_Video_2026-05-04_at_18.58.24_ybmped.mp4';

/** Reels verticales en Somos Xplora (si `VITE_MEDIA_VIDEO_*` no está definido). */
export const DEFAULT_MEDIA_VIDEO_URLS = [
  'https://res.cloudinary.com/dd477n60s/video/upload/v1778016559/Cu%C3%A1l_es_la_clave_del_liderazgoEsta_pregunta_y_muchas_m%C3%A1s_las_responderemos_en_este_Panel_de_M_j9imk6.mp4',
  'https://res.cloudinary.com/dd477n60s/video/upload/v1778016558/WhatsApp_Video_2026-05-05_at_15.25.47_hi4oxe.mp4',
  'https://res.cloudinary.com/dd477n60s/video/upload/v1778016557/WhatsApp_Video_2026-05-05_at_15.25.46_n6babr.mp4',
] as const;

export const DEFAULT_LOGO_URL = '/images/logo%20sin%20fondo.webp';

/** Carrusel inicial (mismas rutas que antes en el código) */
export const DEFAULT_CAROUSEL: CarouselSlide[] = [
  { id: 'def-1', url: '/images/20251007_165830.webp', label: 'Beltrán Briones · Auditorio UCEMA' },
  { id: 'def-2', url: '/images/IMG-20250827-WA0014.webp', label: 'C-Level Talks' },
  { id: 'def-3', url: '/images/1722630248547.webp', label: 'Charla de emprendimiento' },
  { id: 'def-4', url: '/images/IMG-20251119-WA0044.webp', label: 'Evento Xplora' },
  { id: 'def-5', url: '/images/IMG-20250910-WA0086.webp', label: 'Panel de fundadores' },
  { id: 'def-6', url: '/images/1725458411558.webp', label: 'Workshop Xplora' },
  { id: 'def-7', url: '/images/20251007_173758.webp', label: 'Equipo Xplora' },
  { id: 'def-8', url: '/images/Captura%20de%20pantalla%202024-12-31%20151753.webp', label: 'Networking' },
];

/** Valores iniciales si la BD aún no tiene filas (mismas rutas que public/logos/...) */
export const DEFAULT_COMPANY_BRANDS: LogoBrand[] = [
  { id: 'co-1', name: 'Banco Galicia', logoUrl: '/logos/partners/galicia.svg' },
  { id: 'co-2', name: 'Mercado Libre', logoUrl: '/logos/partners/mercadolibre.svg' },
  { id: 'co-3', name: 'McKinsey & Co.', logoUrl: '/logos/partners/mckinsey.svg' },
  { id: 'co-4', name: 'Ualá', logoUrl: '/logos/partners/uala.svg' },
  { id: 'co-5', name: 'YPF', logoUrl: '/logos/partners/ypf.svg' },
  { id: 'co-6', name: 'Naranja X', logoUrl: '/logos/partners/naranjax.svg' },
  { id: 'co-7', name: 'Lemoncash', logoUrl: '/logos/partners/lemoncash.svg' },
  { id: 'co-8', name: 'OCA', logoUrl: '/logos/partners/oca.svg' },
  { id: 'co-9', name: 'Accenture', logoUrl: '/logos/partners/accenture.svg' },
  { id: 'co-10', name: 'Globant', logoUrl: '/logos/partners/globant.svg' },
  { id: 'co-11', name: 'Satellogic', logoUrl: '/logos/partners/satellogic.svg' },
  { id: 'co-12', name: 'Mercado Pago', logoUrl: '/logos/partners/mercadopago.svg' },
];

export const DEFAULT_SPONSOR_BRANDS: LogoBrand[] = [
  { id: 'sp-1', name: 'UCEMA', logoUrl: '/logos/sponsors/ucema.svg' },
  { id: 'sp-2', name: 'Partner estratégico', logoUrl: '/logos/sponsors/partner-1.svg' },
  { id: 'sp-3', name: 'Partner estratégico', logoUrl: '/logos/sponsors/partner-2.svg' },
  { id: 'sp-4', name: 'Partner estratégico', logoUrl: '/logos/sponsors/partner-3.svg' },
];
