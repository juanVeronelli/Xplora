/** Contenido y datos del funnel Startup Day (startupday.xploraucema.com). */

export type StartupDayCompany = {
  id: string;
  name: string;
  /** Si falta, la pasarela muestra el nombre hasta que suban el logo. */
  logoUrl?: string;
  /** `light` = blanco (se invierte en banda crema). `dark` = negro (se invierte en tinta). */
  logoTone?: 'light' | 'dark';
  /** Texto corto para destacadas; opcional en el carrusel. */
  blurb?: string;
  featured?: boolean;
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
  logoTone?: 'light' | 'dark';
  /** Isotipo cuadrado (no wordmark). */
  logoIcon?: boolean;
  website?: string;
  linkedin?: string;
  instagram?: string;
};

const LOGO = (file: string) => `/logos/startup-day/${file}?v=12`;
const PARTNER = (file: string) => `/logos/partners/${file}?v=2`;

export const SD_LUMA_URL = 'https://luma.com/1ubys1uc';

export const SD_EVENT = {
  title: 'Startup Day',
  dateLabel: '11 de septiembre de 2026',
  timeLabel: '15 a 20 hs',
  address: 'Av. Alem 882',
  addressFull: 'Av. Alem 882, Ciudad de Buenos Aires · UCEMA',
  priceLabel: '100% gratuito',
} as const;

/**
 * Pantalla “en construcción”. Poné `true` para volver al gate.
 * Bypass temporal: `?preview=1` en la URL.
 */
export const SD_COMING_SOON = false;

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

/** Agenda del día — stands todo el rato + charlas/workshops por aula. */
export type SdScheduleBeat = {
  time: string;
  timeEnd?: string;
  kind: 'main' | 'workshop' | 'final' | 'talk' | 'stands';
  label: string;
  detail?: string;
  /** Aula M o K. */
  room?: 'M' | 'K';
};

export const SD_STANDS = {
  from: '15',
  to: '20',
  label: 'Stands',
  note: 'Abiertos todo el horario',
} as const;

export const SD_SCHEDULE: readonly SdScheduleBeat[] = [
  {
    time: '15:40',
    timeEnd: '16:30',
    kind: 'workshop',
    label: 'TQe',
    room: 'M',
  },
  {
    time: '15:40',
    timeEnd: '16:30',
    kind: 'main',
    label: 'Endeavor',
    room: 'K',
  },
  {
    time: '16:35',
    timeEnd: '17:20',
    kind: 'workshop',
    label: 'Satellites on Fire',
    room: 'K',
  },
  {
    time: '17:30',
    timeEnd: '18:15',
    kind: 'talk',
    label: 'Derecruiters',
    room: 'M',
  },
  {
    time: '17:30',
    timeEnd: '18:15',
    kind: 'talk',
    label: 'Picante',
    room: 'K',
  },
  {
    time: '17:45',
    timeEnd: '18:20',
    kind: 'talk',
    label: 'Mercado Libre',
    room: 'K',
  },
  {
    time: '18:20',
    timeEnd: '19:00',
    kind: 'talk',
    label: 'Globant',
    room: 'M',
  },
  {
    time: '18:30',
    timeEnd: '19:00',
    kind: 'talk',
    label: 'NEWTOPIA',
    room: 'K',
  },
  {
    time: '19:15',
    timeEnd: '19:45',
    kind: 'workshop',
    label: 'Resender y Zettios',
    room: 'K',
  },
] as const;

/** Nodos de aula en mipiso.glb — ids = nombres de mesh/componente. */
export type SdClassroomId =
  | 'C-aula_wk_01'
  | 'C-aula_wk_02'
  | 'C-aula_stand_01'
  | 'C-aula_stand_02'
  | 'C-aula_stand_03'
  | 'C-aula_stand_05';

export type SdFloorNavId = 'floor' | SdClassroomId;

export type SdClassroomCopy = {
  tag: string;
  title: string;
  time: string;
  copy: string;
};

export const SD_FLOOR_OVERVIEW: SdClassroomCopy = {
  tag: 'Planta',
  title: 'Piso completo',
  time: '15 — 20 hs',
  copy: 'Plano 3D del piso entero. Dos aulas de workshop y cuatro de stands.',
};

/** Programa por aula — 2 workshops + 4 stands (mipiso.glb). */
export const SD_CLASSROOMS: Record<SdClassroomId, SdClassroomCopy> = {
  'C-aula_wk_01': {
    tag: 'Workshop',
    title: 'Satellites on Fire',
    time: '16:35 — 17:20',
    copy: 'Sesión práctica con una de las startups del piso. Contenido aplicable, no solo expositivo.',
  },
  'C-aula_wk_02': {
    tag: 'Workshop',
    title: 'TQe',
    time: '15:40 — 16:30',
    copy: 'Workshop con empresa del ecosistema. Producto, operación y decisiones reales.',
  },
  'C-aula_stand_01': {
    tag: 'Stands',
    title: 'Aula de stands 01',
    time: '15 — 20 hs',
    copy: 'Recorré equipos, preguntá producto y volvé cuando quieras. El espacio permanece abierto todo el evento.',
  },
  'C-aula_stand_02': {
    tag: 'Stands',
    title: 'Aula de stands 02',
    time: '15 — 20 hs',
    copy: 'Stands abiertos durante todo el día. Conversá con los equipos y volvé cuando quieras.',
  },
  'C-aula_stand_03': {
    tag: 'Stands',
    title: 'Aula de stands 03',
    time: '15 — 20 hs',
    copy: 'Más equipos en el piso. Preguntá cómo construyen producto, equipo y tracción.',
  },
  'C-aula_stand_05': {
    tag: 'Stands',
    title: 'Aula de stands 05',
    time: '15 — 20 hs',
    copy: 'Último bloque de stands. El espacio sigue activo hasta las 20 hs.',
  },
};

export const SD_CLASSROOM_IDS = Object.keys(SD_CLASSROOMS) as SdClassroomId[];

/** Lista del mapa: plano general + cada aula. */
export const SD_FLOOR_NAV: { id: SdFloorNavId; copy: SdClassroomCopy }[] = [
  { id: 'floor', copy: SD_FLOOR_OVERVIEW },
  ...SD_CLASSROOM_IDS.map((id) => ({ id, copy: SD_CLASSROOMS[id] })),
];

export const SD_FLOOR_INERT_NODES = ['C-sala_estar', '_(Loose Entity)'] as const;

/** Escala aproximada del modelo mipiso.glb, en unidades del archivo. */
export const SD_FLOOR_BOUNDS = { width: 159, height: 13.4, depth: 108 } as const;

function co(
  id: string,
  name: string,
  logo?: string,
  extra?: Pick<StartupDayCompany, 'logoTone'>,
): StartupDayCompany {
  if (!logo) return { id, name, ...extra };
  const logoUrl = logo.startsWith('/') ? logo : LOGO(logo);
  return { id, name, logoUrl, ...extra };
}

/** Startups confirmadas — sin logo se muestra el nombre hasta subir asset. */
export const SD_STARTUPS: StartupDayCompany[] = [
  co('tqe', 'TQe', 'tqe.webp'),
  co('sof', 'Satellites on Fire', 'satellites-on-fire.webp'),
  co('pasito', 'Pasito', 'pasito.webp'),
  co('marz', 'Marz', 'marz.webp'),
  co('datricas', 'Datricas', 'datricas.webp'),
  co('elcerokm', 'El Cero Km', 'elcerokm.webp'),
  co('nomenclator', 'Nomenclator', 'nomenclator.webp'),
  co('talentum', 'Talentum', 'talentum.webp'),
  co('fardo', 'Fardo', PARTNER('fardo.webp'), { logoTone: 'dark' }),
  co('cobrandoapp', 'Cobrandoapp', PARTNER('cobrandoapp.webp')),
  co('plaude', 'Plaude', PARTNER('plaude-logo.webp')),
  co('kaizer', 'Kaizer', PARTNER('kaizer.webp')),
  co('piggy-wallet', 'Piggy Wallet', PARTNER('piggywallet.webp')),
  co('bata-edu', 'Bata Edu', PARTNER('bataedu_logo.webp')),
  co('compassguard', 'CompassGuard'),
  co('squads-ventures', 'Squads Ventures', PARTNER('squadventures.webp')),
  co('paisanos', 'Paisanos', PARTNER('paisanos.webp')),
  co('gasti', 'Gasti', PARTNER('gasti-logo.webp')),
  co('yafu', 'YAFU', PARTNER('yafu-logo-white-web.webp'), { logoTone: 'light' }),
  co('berry', 'Berry'),
  co('certenza', 'Certenza', PARTNER('certenza-logo-blue.webp')),
  co('tuni', 'Tuni', 'tuni.webp'),
  co('coworkeando', 'Coworkeando', PARTNER('coworkeando.webp')),
  co('zettios', 'Zettios', PARTNER('zettios-logo.webp'), { logoTone: 'dark' }),
  co('cresium', 'Cresium', PARTNER('cresium_primary.webp')),
  co('cooper', 'Cooper', PARTNER('cooper-logo.webp'), { logoTone: 'light' }),
  co('resender', 'Resender'),
  co('wip-club', 'Wip club'),
  co('startups-argentina', 'Startups Argentina'),
  co('comet', 'Comet', PARTNER('comet-logo-dark.webp'), { logoTone: 'dark' }),
  co('fluxis', 'fluxis', PARTNER('fluxis.webp')),
  co('di-venuo', 'Di Venuo', PARTNER('divenuo-wordmark-dark-v1.webp')),
  co('uin', 'UIN'),
  co('prestagro', 'Prestagro', PARTNER('nb3u8jqh_logo-prestagro.webp'), { logoTone: 'light' }),
];

export const SD_EDITION_SPONSORS: StartupDayPartner[] = [
  {
    id: 'coworkeando',
    name: 'Coworkeando',
    logoUrl: PARTNER('coworkeando.webp'),
    logoIcon: true,
    role: 'Sponsor',
    blurb: '',
  },
  {
    id: 'yafu',
    name: 'YAFU',
    logoUrl: PARTNER('yafu-logo-white-web.webp'),
    logoTone: 'light',
    role: 'Sponsor',
    blurb: '',
  },
  {
    id: 'zettios',
    name: 'Zettios',
    logoUrl: PARTNER('zettios-logo.webp'),
    logoTone: 'dark',
    role: 'Sponsor',
    blurb: '',
  },
  {
    id: 'cobrandoapp',
    name: 'cobrando.app',
    logoUrl: PARTNER('cobrandoapp.webp'),
    logoIcon: true,
    role: 'Sponsor',
    blurb: '',
  },
  {
    id: 'endeavor',
    name: 'Endeavor',
    logoUrl: LOGO('endeavor.webp'),
    role: 'Sponsor',
    blurb: '',
    website: 'https://www.endeavor.org.ar/',
    linkedin: 'https://www.linkedin.com/company/endeavor-argentina/',
    instagram: 'https://www.instagram.com/endeavorarg/',
  },
];

/** @deprecated usar SD_EDITION_SPONSORS */
export const SD_ENDEAVOR: StartupDayPartner =
  SD_EDITION_SPONSORS.find((s) => s.id === 'endeavor') ?? SD_EDITION_SPONSORS[0]!;

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
    logoUrl: LOGO('ucemax.webp'),
    role: '',
    blurb: '',
    website: 'https://ucema.edu.ar/educacion-ejecutiva/programas-ejecutivos',
  },
  {
    id: 'humming',
    name: 'HUMMING AIRWAYS',
    logoUrl: LOGO('humming.webp'),
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
