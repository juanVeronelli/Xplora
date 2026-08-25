/** Contenido y datos del funnel Startup Day (startupday.xploraucema.com). */

export type StartupDayCompany = {
  id: string;
  name: string;
  logoUrl: string;
  /** Texto corto para destacadas; opcional en el carrusel. */
  blurb?: string;
  featured?: boolean;
  /** Fondo claro del tile: para logos oscuros o de color que no se leen sobre la banda ink. */
  tileLight?: boolean;
  website?: string;
  linkedin?: string;
  instagram?: string;
};

export type StartupDayPartner = {
  id: string;
  name: string;
  role: string;
  blurb: string;
  logoUrl?: string;
  /** `icon` achica el logo cuando es un isotipo cuadrado en vez de un wordmark. */
  logoVariant?: 'icon';
  website?: string;
  linkedin?: string;
  instagram?: string;
};

const LOGO = (file: string) => `/logos/startup-day/${file}?v=12`;

export const SD_EVENT = {
  title: 'Startup Day',
  dateLabel: '11 de septiembre de 2026',
  timeLabel: '15 a 20 hs',
  address: 'Av. Alem 882',
  addressFull: 'Av. Alem 882, Ciudad de Buenos Aires · UCEMA',
  priceLabel: '100% gratuito',
} as const;

/** Evento en Luma — única vía de inscripción. */
export const SD_LUMA_URL = 'https://luma.com/1ubys1uc';

/**
 * Link a Luma con UTMs. `placement` identifica desde qué botón salió la visita
 * (`hero`, `nav`, `agenda`, `inscripcion`…) y llega a Luma como `utm_content`.
 */
export function sdLumaUrl(placement: string): string {
  const url = new URL(SD_LUMA_URL);
  url.searchParams.set('utm_source', 'startupday-landing');
  url.searchParams.set('utm_medium', 'web');
  url.searchParams.set('utm_campaign', 'startup-day-2026');
  url.searchParams.set('utm_content', placement);
  return url.toString();
}

/** Teaser de StartupMate — todavía sin CTA, se presenta en el evento. */
export const SD_STARTUPMATE = {
  kicker: 'Próximamente',
  name: 'StartupMate',
  tagline: 'El Tinder de cofounders',
  lead:
    'Un lugar para encontrar con quién fundar: perfiles, intereses y match entre gente que está buscando equipo para arrancar.',
  note: 'Lo presentamos en el Startup Day',
} as const;

/**
 * Pantalla “en construcción”. Pasar a `false` para publicar la landing.
 * Bypass temporal: `?preview=1` en la URL.
 */
export const SD_COMING_SOON = true;

/**
 * Agenda bloqueada. Mientras esté en `true` la sección muestra “Agenda próximamente”
 * en vez de la línea de tiempo: los horarios de `SD_SCHEDULE` son tentativos y las
 * charlas todavía no están confirmadas. Pasar a `false` para publicarla.
 */
export const SD_AGENDA_LOCKED = true;

/** Experiencia Startup Day — tipografía + pilares (brand ink/purple). */
export const SD_DAY_STORY = {
  kicker: 'Qué pasa ese día',
  title: 'La experiencia',
  meta: '15 — 20 hs · UCEMA · 100% gratuito',
  lead:
    'Stands abiertos durante todo el evento, workshops con empresas líderes, charlas y espacio para conversar con quienes están construyendo startups.',
  pillars: [
    {
      tag: 'Stands',
      text: 'El espacio permanece activo de 15 a 20 hs. Recorré los stands, conversá con los equipos y volvé cuando quieras.',
    },
    {
      tag: 'Startups',
      text: 'Equipos en etapa temprana buscando capital y compañías más consolidadas. Preguntá cómo construyeron producto, equipo y tracción.',
    },
    {
      tag: 'Workshops',
      text: 'Sesiones con empresas tecnológicas de referencia: producto, comercialización y operación. Contenido aplicable, no solo expositivo.',
    },
    {
      tag: 'Networking',
      text: 'Conectá con founders, inversores y aceleradoras. Conversaciones directas, en un mismo lugar y horario.',
    },
  ],
} as const;

/** Agenda del día — stands todo el rato + beats puntuales. */
export type SdScheduleBeat = {
  time: string;
  kind: 'main' | 'workshop' | 'final' | 'stands';
  label: string;
  detail?: string;
};

export const SD_STANDS = {
  from: '15',
  to: '20',
  label: 'Stands',
  note: 'Abiertos todo el horario',
} as const;

/**
 * Horarios TENTATIVOS — no se renderizan mientras `SD_AGENDA_LOCKED` sea `true`.
 * Los nombres de cada `detail`/`label` son borradores: confirmarlos antes de destrabar.
 */
export const SD_SCHEDULE: readonly SdScheduleBeat[] = [
  {
    time: '15:00',
    kind: 'main',
    label: 'Charla principal',
    detail: 'Endeavor',
  },
  {
    time: '15:30',
    kind: 'stands',
    label: 'Stands abiertos',
  },
  {
    time: '16:00',
    kind: 'workshop',
    label: 'Satellites on Fire',
  },
  {
    time: '16:30',
    kind: 'stands',
    label: 'Stands abiertos',
  },
  {
    time: '17:00',
    kind: 'workshop',
    label: 'TQe',
  },
  {
    time: '17:30',
    kind: 'stands',
    label: 'Stands abiertos',
  },
  {
    time: '18:00',
    kind: 'final',
    label: 'Charla final',
    detail: 'Mercado Libre',
  },
  {
    time: '18:30',
    kind: 'stands',
    label: 'Stands abiertos',
  },
  {
    time: '19:00',
    kind: 'stands',
    label: 'Stands abiertos',
  },
  {
    time: '19:30',
    kind: 'stands',
    label: 'Stands abiertos',
  },
] as const;

/** Startups confirmadas — logos normalizados en `/logos/startup-day/*.webp`. */
export const SD_STARTUPS: StartupDayCompany[] = [
  {
    id: 'pasito',
    name: 'Pasito',
    logoUrl: LOGO('pasito.webp'),
    featured: true,
    blurb:
      'Producto en mercado. Van a contar cómo armaron equipo, distribución y ritmo de crecimiento desde Argentina.',
    website: 'https://www.pasito.app/',
  },
  {
    id: 'tqe',
    name: 'TQe',
    logoUrl: LOGO('tqe.webp'),
    featured: true,
    blurb:
      'Stand + workshop a las 17 hs. Van a bajar método de producto, go-to-market y cómo escalan operación.',
    website: 'https://www.tqe.com.ar/',
  },
  {
    id: 'sof',
    name: 'Satellites on Fire',
    logoUrl: LOGO('satellites-on-fire.webp'),
    featured: true,
    blurb:
      'Stand + workshop a las 16 hs. Tech de alto crecimiento: fundraising, equipo y cómo construyen producto.',
    website: 'https://www.satellitesonfire.com/',
  },
  {
    id: 'marz',
    name: 'Marz',
    logoUrl: LOGO('marz.webp'),
    featured: true,
    blurb: 'Equipo en pleno funcionamiento. Preguntales cómo priorizan roadmap y ventas.',
    website: 'https://www.go-marz.com/',
  },
  {
    id: 'datricas',
    name: 'Datricas',
    logoUrl: LOGO('datricas.webp'),
    blurb: 'Datos y producto. Stand abierto para hablar de stack y tracción.',
    website: 'https://www.datricas.com/',
  },
  {
    id: 'elcerokm',
    name: 'El cero KM',
    logoUrl: LOGO('elcerokm.webp'),
    blurb: 'Startup argentina operativa. Cómo se funda y se sostiene día a día.',
    website: 'https://elcerokm.com/',
  },
  {
    id: 'nomenclator',
    name: 'Nomenclator',
    logoUrl: LOGO('nomenclator.webp'),
    blurb: 'Equipo construyendo en serio. Vení a preguntar por proceso y métricas.',
    website: 'https://www.nomenclator.com.ar/',
  },
  {
    id: 'talentum',
    name: 'Talentum',
    logoUrl: LOGO('talentum.webp'),
    blurb: 'Confirmados. Stand para hablar de hiring, cultura y escala.',
    website: 'https://talentumjobs.com/',
  },
  { id: 'fardo', name: 'Fardo', logoUrl: LOGO('fardo.png'), website: 'https://www.heyfardo.com/' },
  {
    id: 'cobrando',
    name: 'Cobrando',
    logoUrl: LOGO('cobrando.webp'),
    website: 'https://cobrando.app/',
    tileLight: true,
  },
  { id: 'plaude', name: 'Plaude', logoUrl: LOGO('plaude.png'), website: 'https://plaude.com/' },
  { id: 'kaizer', name: 'Kaizer', logoUrl: LOGO('kaizer.png'), website: 'https://kaizer.app/' },
  {
    id: 'piggywallet',
    name: 'Piggy Wallet',
    logoUrl: LOGO('piggywallet.webp'),
    website: 'https://www.piggywallet.app/home-spanish',
  },
  { id: 'bata', name: 'Bata', logoUrl: LOGO('bata.png'), website: 'https://bataedu.com/' },
  {
    id: 'compassguard',
    name: 'Compass Guard',
    logoUrl: LOGO('compassguard.webp'),
    website: 'https://compassguard.xyz/',
    tileLight: true,
  },
  { id: 'paisanos', name: 'Paisanos', logoUrl: LOGO('paisanos.png'), website: 'https://www.paisanos.io/es' },
  { id: 'gasti', name: 'Gasti', logoUrl: LOGO('gasti.png'), website: 'https://gasti.pro/' },
  { id: 'yafu', name: 'Yafu', logoUrl: LOGO('yafu.png'), website: 'https://yafu.app/' },
  { id: 'berry', name: 'Berry', logoUrl: LOGO('berry.png'), website: 'https://berry.app/' },
  {
    id: 'certenza',
    name: 'Certenza',
    logoUrl: LOGO('certenza.png'),
    website: 'https://certenza.com/',
    tileLight: true,
  },
  { id: 'tuni', name: 'Tuni', logoUrl: LOGO('tuni.webp'), website: 'https://www.tuni.com.ar/' },
  {
    id: 'coworkeando',
    name: 'Coworkeando',
    logoUrl: LOGO('coworkeando.png'),
    website: 'https://www.coworkeando.com/',
  },
  { id: 'zettios', name: 'Zettios', logoUrl: LOGO('zettios.png'), website: 'https://www.zettios.com/' },
  {
    id: 'cooper',
    name: 'Cooper',
    logoUrl: LOGO('cooper.svg'),
    website: 'https://www.cooperpetcare.app/',
  },
  { id: 'resender', name: 'Resender', logoUrl: LOGO('resender.png'), website: 'https://resender.dev/' },
  {
    id: 'wipclub',
    name: 'WIP Club',
    /** Isotipo azul sobre blanco: va en tile claro para que el fondo no corte la banda ink. */
    logoUrl: LOGO('wipclub.webp'),
    tileLight: true,
    instagram: 'https://www.instagram.com/wipclub.bsas/',
  },
  {
    id: 'startups-argentina',
    name: 'Startups Argentina',
    /** Wordmark sobre fondo cream propio: va en tile claro para que no se recorte. */
    logoUrl: LOGO('startups-argentina.webp'),
    website: 'https://www.startupsargentina.com/',
    tileLight: true,
  },
  {
    id: 'galo',
    name: 'Galo',
    logoUrl: LOGO('galo.svg'),
    website: 'https://www.soygalo.com/',
    tileLight: true,
  },
  { id: 'fluxis', name: 'Fluxis', logoUrl: LOGO('fluxis.png'), website: 'https://fluxis.us/' },
  { id: 'divenuo', name: 'diVenuo', logoUrl: LOGO('divenuo.png'), website: 'https://divenuo.com/' },
  {
    id: 'prestagro',
    name: 'Prestagro',
    logoUrl: LOGO('prestagro.png'),
    website: 'https://prestagro.com.ar/',
  },
];

/**
 * Sponsors de la primera edición.
 *
 * OJO con la variante del logo: esta sección se renderiza sobre banda **cream**
 * (`sd-band--cream`) y sin tile de fondo, así que acá van los logos **oscuros**.
 * Los mismos cuatro aparecen además en el carrusel de confirmadas, que es banda
 * ink y usa las versiones claras. Por eso hay dos archivos por marca.
 */
export const SD_EDITION_SPONSORS: StartupDayPartner[] = [
  {
    id: 'yafu',
    name: 'Yafu',
    logoUrl: LOGO('yafu-dark.png'),
    role: 'Sponsor de la primera edición',
    blurb: 'Sponsor de Startup Day y startup confirmada en el piso.',
    website: 'https://yafu.app/',
  },
  {
    id: 'coworkeando',
    name: 'Coworkeando',
    logoUrl: LOGO('coworkeando-dark.svg'),
    role: 'Sponsor de la primera edición',
    blurb: 'Sponsor de Startup Day y startup confirmada en el piso.',
    website: 'https://www.coworkeando.com/',
  },
  {
    id: 'zettios',
    name: 'Zettios',
    logoUrl: LOGO('zettios-dark.svg'),
    role: 'Sponsor de la primera edición',
    blurb: 'Sponsor de Startup Day y startup confirmada en el piso.',
    website: 'https://www.zettios.com/',
  },
  {
    id: 'cobrando',
    name: 'Cobrando',
    logoUrl: LOGO('cobrando.webp'),
    role: 'Sponsor de la primera edición',
    blurb: 'Sponsor de Startup Day y startup confirmada en el piso.',
    website: 'https://cobrando.app/',
  },
];

export const SD_XPLORA_PARTNERS: StartupDayPartner[] = [
  {
    id: 'tuni',
    name: 'TUNI',
    logoUrl: LOGO('tuni.webp'),
    role: '',
    blurb: '',
  },
  {
    id: 'ucemax',
    name: 'UCEMA X',
    logoUrl: LOGO('ucemax.png'),
    role: '',
    blurb: '',
    website: 'https://ucema.edu.ar/educacion-ejecutiva/programas-ejecutivos',
  },
  {
    id: 'humming',
    name: 'HUMMING AIRWAYS',
    logoUrl: LOGO('humming.png'),
    role: '',
    blurb: '',
    website: 'https://www.hummingairways.com/',
  },
];

export const SD_XPLORA_SOCIALS = {
  instagram: (import.meta.env.VITE_INSTAGRAM_URL as string | undefined)?.trim() ||
    'https://www.instagram.com/xplora_ucema/',
  linkedin: (import.meta.env.VITE_LINKEDIN_URL as string | undefined)?.trim() ||
    'https://www.linkedin.com/company/emprendedores-ucema/',
  whatsapp: (import.meta.env.VITE_WHATSAPP_URL as string | undefined)?.trim() ||
    'https://tr.ee/9sGklsuv4n',
  site: 'https://xploraucema.com/',
} as const;

export const SD_XPLORA_ABOUT = {
  what: 'Organización estudiantil de la Universidad del CEMA, por y para emprendedores. Abrimos el ecosistema a estudiantes de UCEMA y de toda la Argentina.',
  mission:
    'Que más gente pueda entrar al ecosistema emprendedor: networking, primer empleo, emprender y aprender haciendo.',
  objective:
    'Conectar talento argentino con founders, referentes y oportunidades reales — dentro y fuera de UCEMA.',
  whyEvent:
    'Startup Day es la primera edición del evento más importante de startups del año en Xplora. Stands, workshops, pitch e inversores en un mismo día.',
  stats: [
    { value: '2.000+', label: 'miembros en la comunidad' },
    { value: 'UCEMA', label: 'casa del club' },
    { value: '1ª', label: 'edición Startup Day' },
    { value: 'AR', label: 'estudiantes de todo el país' },
  ],
} as const;

/** FAQs landing principal xploraucema.com */
export const XP_FAQS = [
  {
    q: '¿Quién puede sumarse?',
    a: 'Estudiantes y jóvenes interesados en el ecosistema emprendedor. No hace falta tener un proyecto armado: podés venir a aprender, conectar o buscar tu primer empleo en startups.',
  },
  {
    q: '¿Hay que ser alumno de UCEMA?',
    a: 'No. Xplora nace en UCEMA, pero la comunidad y los eventos están abiertos a estudiantes de toda la Argentina.',
  },
  {
    q: '¿Cómo me uno a la comunidad?',
    a: 'Entrá al grupo de WhatsApp desde el botón “Entrar a la comunidad”. Ahí avisamos eventos, oportunidades y novedades del club.',
  },
  {
    q: '¿Qué es Startup Day?',
    a: 'El evento más importante del año de Xplora: stands, workshops, charlas y networking con startups y empresas, en un mismo día en UCEMA. Es 100% gratuito.',
  },
  {
    q: '¿Los eventos son pagos?',
    a: 'La mayoría son gratuitos, incluido Startup Day. Si alguno tiene costo, lo aclaramos en la convocatoria.',
  },
  {
    q: '¿Cómo participa una empresa?',
    a: 'Pueden sumarse con charla, workshop, stand o sponsorship. Entrá a /sponsors o usá “Quiero participar” en Empresas.',
  },
] as const;
