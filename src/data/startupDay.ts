/** Contenido y datos del funnel Startup Day (startupday.xploraucema.com). */

export type StartupDayCompany = {
  id: string;
  name: string;
  logoUrl: string;
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
  website?: string;
  linkedin?: string;
  instagram?: string;
};

const LOGO = (file: string) => `/logos/startup-day/${file}?v=10`;

export const SD_EVENT = {
  title: 'Startup Day',
  dateLabel: '9 de septiembre de 2026',
  timeLabel: '15 a 19 hs',
  address: 'Av. Alem 882',
  addressFull: 'Av. Alem 882, Ciudad de Buenos Aires · UCEMA',
  priceLabel: '100% gratuito',
} as const;

/**
 * Pantalla “en construcción”. Pasar a `false` para publicar la landing.
 * Bypass temporal: `?preview=1` en la URL.
 */
export const SD_COMING_SOON = true;

/** Experiencia Startup Day — tipografía + pilares (brand ink/purple). */
export const SD_DAY_STORY = {
  kicker: 'Qué pasa ese día',
  title: 'La experiencia',
  meta: '15 — 19 hs · UCEMA · 100% gratuito',
  lead:
    'Stands abiertos durante todo el evento, workshops con empresas líderes, charlas y espacio para conversar con quienes están construyendo startups.',
  pillars: [
    {
      tag: 'Stands',
      text: 'El espacio permanece activo de 15 a 19 hs. Recorré los stands, conversá con los equipos y volvé cuando quieras.',
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
  to: '19',
  label: 'Stands',
  note: 'Abiertos todo el horario',
} as const;

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
] as const;

/** Nodos del piso 3D (pp2.glb) — nombres exactos exportados desde el modelo, no inventar. */
export type SdClassroomId =
  | 'C-aula01'
  | 'C-aula02'
  | 'C-aula03'
  | 'C-aula04'
  | 'C-aula05'
  | 'C-aula06';

export type SdClassroomCopy = {
  title: string;
  copy: string;
};

/** Placeholders — el copy final se completa después. */
export const SD_CLASSROOMS: Record<SdClassroomId, SdClassroomCopy> = {
  'C-aula01': { title: '{{TITULO_AULA_01}}', copy: '{{COPY_AULA_01}}' },
  'C-aula02': { title: '{{TITULO_AULA_02}}', copy: '{{COPY_AULA_02}}' },
  'C-aula03': { title: '{{TITULO_AULA_03}}', copy: '{{COPY_AULA_03}}' },
  'C-aula04': { title: '{{TITULO_AULA_04}}', copy: '{{COPY_AULA_04}}' },
  'C-aula05': { title: '{{TITULO_AULA_05}}', copy: '{{COPY_AULA_05}}' },
  'C-aula06': { title: '{{TITULO_AULA_06}}', copy: '{{COPY_AULA_06}}' },
};

/** Nodos sin interacción por ahora — preparados para sumarse fácilmente después. */
export const SD_FLOOR_INERT_NODES = ['C-pasillo', 'C-toilets'] as const;

/** Escala aproximada del modelo pp2.glb, en unidades del archivo (ancho x alto x profundidad). */
export const SD_FLOOR_BOUNDS = { width: 159, height: 13.4, depth: 108 } as const;

/** Startups confirmadas — logos normalizados en `/logos/startup-day/*.webp`. */
export const SD_STARTUPS: StartupDayCompany[] = [
  {
    id: 'pasito',
    name: 'Pasito',
    logoUrl: LOGO('pasito.webp'),
    featured: true,
    blurb:
      'Producto en mercado. Van a contar cómo armaron equipo, distribución y ritmo de crecimiento desde Argentina.',
    website: 'https://www.pasito.com.ar',
  },
  {
    id: 'tqe',
    name: 'TQe',
    logoUrl: LOGO('tqe.webp'),
    featured: true,
    blurb:
      'Stand + workshop a las 17 hs. Van a bajar método de producto, go-to-market y cómo escalan operación.',
  },
  {
    id: 'sof',
    name: 'Satellites on Fire',
    logoUrl: LOGO('satellites-on-fire.webp'),
    featured: true,
    blurb:
      'Stand + workshop a las 16 hs. Tech de alto crecimiento: fundraising, equipo y cómo construyen producto.',
  },
  {
    id: 'marz',
    name: 'Marz',
    logoUrl: LOGO('marz.webp'),
    featured: true,
    blurb: 'Equipo en pleno funcionamiento. Preguntales cómo priorizan roadmap y ventas.',
  },
  {
    id: 'datricas',
    name: 'Datricas',
    logoUrl: LOGO('datricas.webp'),
    blurb: 'Datos y producto. Stand abierto para hablar de stack y tracción.',
  },
  {
    id: 'elcerokm',
    name: 'El cero KM',
    logoUrl: LOGO('elcerokm.webp'),
    blurb: 'Startup argentina operativa. Cómo se funda y se sostiene día a día.',
  },
  {
    id: 'nomenclator',
    name: 'Nomenclator',
    logoUrl: LOGO('nomenclator.webp'),
    blurb: 'Equipo construyendo en serio. Vení a preguntar por proceso y métricas.',
  },
  {
    id: 'talentum',
    name: 'Talentum',
    logoUrl: LOGO('talentum.webp'),
    blurb: 'Confirmados. Stand para hablar de hiring, cultura y escala.',
  },
];

export const SD_EDITION_SPONSORS: StartupDayPartner[] = [
  {
    id: 'endeavor',
    name: 'Endeavor',
    logoUrl: LOGO('endeavor.png'),
    role: 'Charla principal',
    blurb:
      'Red global de founders de alto impacto. Abre la charla principal de Startup Day.',
    website: 'https://www.endeavor.org.ar/',
    linkedin: 'https://www.linkedin.com/company/endeavor-argentina/',
    instagram: 'https://www.instagram.com/endeavorarg/',
  },
  {
    id: 'mercadolibre',
    name: 'Mercado Libre',
    logoUrl: LOGO('mercado-libre.png'),
    role: 'Charla final',
    blurb: 'Cierra el programa con la charla final del día.',
    website: 'https://www.mercadolibre.com.ar/',
    linkedin: 'https://www.linkedin.com/company/mercadolibre/',
  },
  {
    id: 'globant',
    name: 'Globant',
    logoUrl: LOGO('globant.png'),
    role: 'Sponsor principal',
    blurb: 'Partner tecnológico de la primera edición.',
    website: 'https://www.globant.com/',
    linkedin: 'https://www.linkedin.com/company/globant/',
  },
];

/** @deprecated usar SD_EDITION_SPONSORS */
export const SD_ENDEAVOR: StartupDayPartner = SD_EDITION_SPONSORS[0]!;

export const SD_XPLORA_PARTNERS: StartupDayPartner[] = [
  {
    id: 'tuni',
    name: 'TUNI',
    logoUrl: LOGO('tuni.png'),
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
