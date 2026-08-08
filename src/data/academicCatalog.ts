/**
 * Catálogos normalizados para formularios públicos.
 * Mantener en sync con `server/src/data/academic-catalog.ts`.
 */

export const UNIVERSIDADES_OPCIONES = [
  'Universidad del CEMA (UCEMA)',
  'Universidad de Buenos Aires (UBA)',
  'Universidad Torcuato Di Tella (UTDT)',
  'Universidad de San Andrés (UdeSA)',
  'UADE',
  'ITBA',
  'Universidad Austral',
  'Universidad Católica Argentina (UCA)',
  'Universidad de Palermo (UP)',
  'Universidad Nacional de La Plata (UNLP)',
  'Universidad Nacional de Córdoba (UNC)',
  'Universidad Nacional de Rosario (UNR)',
  'Universidad Nacional del Litoral (UNL)',
  'Universidad Nacional de Cuyo (UNCuyo)',
  'Universidad Nacional del Sur (UNS)',
  'Universidad Nacional de Quilmes (UNQ)',
  'Universidad Nacional de General Sarmiento (UNGS)',
  'Universidad Nacional de Tres de Febrero (UNTREF)',
  'Universidad Nacional de San Martín (UNSAM)',
  'UTN',
  'Universidad de Belgrano (UB)',
  'Universidad del Salvador (USAL)',
  'Universidad Favaloro',
  'Universidad Maimónides',
  'Universidad Argentina de la Empresa',
  'Escuela de Negocios / otra institución',
  'Otra universidad',
  'No estudio actualmente',
] as const;

export const CARRERAS_OPCIONES = [
  'Abogacía',
  'Actuario',
  'Administración de Empresas',
  'Administración y Sistemas',
  'Analítica de Negocios / Data Analytics',
  'Arquitectura',
  'Artes Liberales y Ciencias',
  'Ciencia de Datos',
  'Ciencias de la Comunicación',
  'Ciencias Políticas',
  'Comercio Internacional',
  'Contador Público',
  'Diseño',
  'Economía',
  'Economía Empresarial',
  'Finanzas',
  'Ingeniería Civil',
  'Ingeniería en Informática / Sistemas',
  'Ingeniería en Inteligencia Artificial',
  'Ingeniería Industrial',
  'Marketing',
  'Medicina',
  'Negocios Digitales',
  'Psicología',
  'Publicidad',
  'Recursos Humanos',
  'Relaciones Internacionales',
  'MBA / Posgrado',
  'Otra carrera',
] as const;

export type UniversidadOpcion = (typeof UNIVERSIDADES_OPCIONES)[number];
export type CarreraOpcion = (typeof CARRERAS_OPCIONES)[number];

export const UCEMA_UNIVERSIDAD: UniversidadOpcion = 'Universidad del CEMA (UCEMA)';

export function isUniversidadOpcion(v: string): v is UniversidadOpcion {
  return (UNIVERSIDADES_OPCIONES as readonly string[]).includes(v);
}

export function isCarreraOpcion(v: string): v is CarreraOpcion {
  return (CARRERAS_OPCIONES as readonly string[]).includes(v);
}
