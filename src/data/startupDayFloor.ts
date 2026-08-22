/**
 * 2º piso de Av. Alem 882 — geometría para el render 3D.
 *
 * Todo sale de `docs/piso/plano-2do-piso.png` (980×607 px), el croquis de Excalidraw que
 * el equipo confirmó como fiel a la distribución real.
 *
 * Solo se modelan los espacios a los que se entra el día del evento. Sala de estar,
 * Recepción y los dos depósitos se sacaron, y con ellos el edificio se recorta: el
 * perímetro deja de ser un rectángulo y pasa a tener cuatro escotaduras donde estaban.
 *
 * Se guarda todo en píxeles del croquis y se convierte a metros con `M_POR_PX`. Si aparece
 * una medida real, se corrige esa constante y el modelo entero se reescala solo.
 *
 * La escala es estimada (placas de cielorraso de 60×60 cm en las fotos de `docs/piso/`),
 * así que el render no muestra ninguna medida en pantalla.
 */

/** Dimensiones del croquis de referencia, en píxeles. */
export const PLANO_PX = { w: 980, h: 607 } as const;

/** Metros por píxel del croquis. Ajustar acá cuando haya medidas reales. */
export const M_POR_PX = 0.037;

/** Altura libre hasta el cielorraso desmontable. */
export const ALTURA_M = 2.7;

/** Espesor de los muros. */
export const MURO_M = 0.14;

/** Stands por sala en L, N, O y Q. */
export const STANDS_POR_SALA = 7;

export type SalaTipo = 'stands' | 'workshops' | 'nucleo';

/**
 * `abierta` se modela con muros y se ve adentro; `bloqueada` va como volumen macizo con
 * el nombre arriba. Los baños van bloqueados: nadie necesita ver adentro.
 */
export type Acceso = 'abierta' | 'bloqueada';

/** Caras de una sala, para ubicar puertas y ventanales. */
export type Lado = 'norte' | 'sur' | 'este' | 'oeste';

export type Sala = {
  id: string;
  /** Letra o nombre como figura en el croquis. */
  label: string;
  tipo: SalaTipo;
  acceso: Acceso;
  /** Rect en píxeles del croquis. */
  px: { x: number; y: number; w: number; h: number };
  /** Qué pasa en esa sala; se muestra en la referencia al costado del render. */
  nota?: string;
  /**
   * Caras vidriadas. K lleva el ventanal sobre la fachada oeste —suposición tomada de
   * `docs/piso/foto-sala-larga.png`— y el núcleo de ascensores va vidriado sobre sus dos
   * lados cortos, que es donde antes estaban por error las puertas de ascensor.
   */
  vidriado?: readonly Lado[];
};

/** Las 9 salas que se usan. El uso de cada una lo dice el propio croquis. */
export const SALAS: readonly Sala[] = [
  {
    id: 'l',
    label: 'L',
    tipo: 'stands',
    acceso: 'abierta',
    px: { x: 260, y: 8, w: 149, h: 158 },
    nota: '7 stands de startups.',
  },
  {
    id: 'm',
    label: 'M',
    tipo: 'workshops',
    acceso: 'abierta',
    px: { x: 410, y: 8, w: 182, h: 158 },
    nota: 'Acá se hacen los workshops.',
  },
  {
    id: 'n',
    label: 'N',
    tipo: 'stands',
    acceso: 'abierta',
    px: { x: 593, y: 8, w: 191, h: 158 },
    nota: '7 stands de startups.',
  },
  {
    id: 'o',
    label: 'O',
    tipo: 'stands',
    acceso: 'abierta',
    px: { x: 785, y: 8, w: 160, h: 181 },
    nota: '7 stands de startups.',
  },
  {
    id: 'k',
    label: 'K',
    tipo: 'workshops',
    acceso: 'abierta',
    px: { x: 42, y: 167, w: 179, h: 296 },
    nota: 'La sala más grande. Workshops y las charlas del día.',
    vidriado: ['oeste'],
  },
  {
    id: 'banos-norte',
    label: 'Baños',
    tipo: 'nucleo',
    acceso: 'bloqueada',
    px: { x: 318, y: 232, w: 245, h: 91 },
  },
  {
    id: 'ascensores',
    label: 'Ascensores',
    tipo: 'nucleo',
    acceso: 'abierta',
    px: { x: 318, y: 324, w: 245, h: 140 },
    vidriado: ['este', 'oeste'],
  },
  {
    id: 'q',
    label: 'Q',
    tipo: 'stands',
    acceso: 'abierta',
    px: { x: 739, y: 370, w: 206, h: 229 },
    nota: '7 stands de startups.',
  },
  {
    id: 'banos-sur',
    label: 'Baños',
    tipo: 'nucleo',
    acceso: 'bloqueada',
    px: { x: 392, y: 464, w: 268, h: 133 },
  },
];

export type RectM = { cx: number; cz: number; w: number; d: number };

export function aMetros(px: { x: number; y: number; w: number; h: number }): RectM {
  return {
    cx: (px.x + px.w / 2 - PLANO_PX.w / 2) * M_POR_PX,
    cz: (px.y + px.h / 2 - PLANO_PX.h / 2) * M_POR_PX,
    w: px.w * M_POR_PX,
    d: px.h * M_POR_PX,
  };
}

const mx = (px: number) => (px - PLANO_PX.w / 2) * M_POR_PX;
const mz = (py: number) => (py - PLANO_PX.h / 2) * M_POR_PX;

export function rectDeSala(sala: Sala): RectM {
  return aMetros(sala.px);
}

/**
 * Contorno del edificio recortado, en píxeles del croquis y en sentido horario.
 *
 * No puede ser un rectángulo: el bounding box de lo que queda es el mismo que antes de
 * borrar las cuatro salas —K sostiene el borde izquierdo, la fila L–M–N–O el superior, y
 * O y Q el derecho y el inferior—, así que el recorte son cuatro escotaduras sobre los
 * bordes, donde estaban Sala de estar, P · Depósito, Depósito chico y Recepción.
 */
const CONTORNO_PX: readonly (readonly [number, number])[] = [
  [258, 8],
  [945, 8],
  [945, 190],
  [810, 190],
  [810, 370],
  [945, 370],
  [945, 599],
  [743, 599],
  [743, 412],
  [659, 412],
  [659, 599],
  [391, 599],
  [391, 465],
  [42, 465],
  [42, 166],
  [258, 166],
];

/**
 * El piso, en franjas verticales que no se solapan. Se prefirió esta descomposición a mano
 * antes que rasterizar el croquis: rasterizar devolvía 249 rectángulos, muchos de una fila
 * de alto, por lo dentado del borde.
 */
const PISO_PX: readonly { x: number; y: number; w: number; h: number }[] = [
  { x: 42, y: 166, w: 216, h: 299 },
  { x: 258, y: 8, w: 133, h: 457 },
  { x: 391, y: 8, w: 268, h: 591 },
  { x: 659, y: 8, w: 84, h: 404 },
  { x: 743, y: 8, w: 67, h: 591 },
  { x: 810, y: 8, w: 135, h: 182 },
  { x: 810, y: 370, w: 135, h: 229 },
];

/** Bounding box del contorno: encuadre de cámara y mapeo UV de la textura del piso. */
export const HUELLA_PX = (() => {
  const xs = CONTORNO_PX.map((p) => p[0]);
  const ys = CONTORNO_PX.map((p) => p[1]);
  const x = Math.min(...xs);
  const y = Math.min(...ys);
  return { x, y, w: Math.max(...xs) - x, h: Math.max(...ys) - y };
})();

export const HUELLA_M = aMetros(HUELLA_PX);

/** Losas del piso en metros. */
export function losasDePiso(): RectM[] {
  return PISO_PX.map(aMetros);
}

/** Un tramo de muro: caja con centro, tamaño, altura y elevación. */
export type Tramo = { cx: number; cz: number; w: number; d: number; alto: number; y: number };

export const PUERTA_ANCHO_M = 1.05;
export const PUERTA_ALTO_M = 2.05;

/**
 * Puertas, definidas a mano: sala, cara y posición sobre esa cara en píxeles del croquis.
 *
 * Antes se asignaban al muro geométricamente más cercano y eso las ponía en la pared
 * equivocada. El caso peor era N y O: sus rombos caen sobre un escalón del croquis que el
 * rectángulo de la sala no reproduce, así que terminaban abriendo la medianera *entre* las
 * dos aulas y ninguna quedaba con entrada desde el pasillo. Con la tabla explícita esa
 * clase de error desaparece.
 *
 * Las aulas de la fila superior repiten el patrón del croquis: puerta sobre el muro sur,
 * contra la medianera con la sala de al lado.
 */
type PuertaDef = { sala: string; lado: Lado; en: number };

const PUERTAS: readonly PuertaDef[] = [
  { sala: 'l', lado: 'sur', en: 268 },
  { sala: 'm', lado: 'sur', en: 418 },
  { sala: 'n', lado: 'sur', en: 601 },
  /**
   * O abre en 798 y no más a la derecha: su muro sur va de 785 a 945, pero desde 810 en
   * adelante linda con la escotadura donde estaba P · Depósito, así que una abertura ahí
   * daría al exterior del edificio recortado. El tramo 785..810 es el único que mira al
   * pasillo.
   */
  { sala: 'o', lado: 'sur', en: 798 },
  { sala: 'k', lado: 'este', en: 193 },
  { sala: 'k', lado: 'este', en: 448 },
  { sala: 'q', lado: 'norte', en: 799 },
  { sala: 'banos-norte', lado: 'norte', en: 401 },
  { sala: 'banos-norte', lado: 'norte', en: 476 },
  { sala: 'banos-sur', lado: 'norte', en: 644 },
];

export const CANTIDAD_DE_PUERTAS = PUERTAS.length;

function huecosDe(salaId: string, lado: Lado): number[] {
  return PUERTAS.filter((p) => p.sala === salaId && p.lado === lado)
    .map((p) => (lado === 'norte' || lado === 'sur' ? mx(p.en) : mz(p.en)))
    .sort((a, b) => a - b);
}

/** Parte un muro recto en tramos, dejando el hueco de cada puerta y su dintel arriba. */
function tramos(
  fijo: number,
  desde: number,
  hasta: number,
  horiz: boolean,
  huecos: number[],
  alto: number,
): Tramo[] {
  const caja = (a: number, b: number, y: number, h: number): Tramo | null => {
    if (b - a < 0.02 || h <= 0.01) return null;
    const centro = (a + b) / 2;
    return horiz
      ? { cx: centro, cz: fijo, w: b - a, d: MURO_M, alto: h, y }
      : { cx: fijo, cz: centro, w: MURO_M, d: b - a, alto: h, y };
  };

  const out: Tramo[] = [];
  let cursor = desde;
  for (const h of huecos) {
    const a = Math.max(desde, h - PUERTA_ANCHO_M / 2);
    const b = Math.min(hasta, h + PUERTA_ANCHO_M / 2);
    if (b <= cursor) continue;
    const macizo = caja(cursor, Math.max(cursor, a), 0, alto);
    if (macizo) out.push(macizo);
    const dintel = caja(a, b, PUERTA_ALTO_M, alto - PUERTA_ALTO_M);
    if (dintel) out.push(dintel);
    cursor = b;
  }
  const final = caja(cursor, hasta, 0, alto);
  if (final) out.push(final);
  return out;
}

/** Los cuatro muros de una sala abierta, ya con sus aberturas. */
export function murosDeSala(sala: Sala): Tramo[] {
  const { cx, cz, w, d } = rectDeSala(sala);
  const x0 = cx - w / 2;
  const x1 = cx + w / 2;
  const z0 = cz - d / 2;
  const z1 = cz + d / 2;
  return [
    ...tramos(z0, x0, x1, true, huecosDe(sala.id, 'norte'), ALTURA_M),
    ...tramos(z1, x0, x1, true, huecosDe(sala.id, 'sur'), ALTURA_M),
    ...tramos(x0, z0, z1, false, huecosDe(sala.id, 'oeste'), ALTURA_M),
    ...tramos(x1, z0, z1, false, huecosDe(sala.id, 'este'), ALTURA_M),
  ];
}

export const SALAS_ABIERTAS = SALAS.filter((s) => s.acceso === 'abierta');
export const SALAS_BLOQUEADAS = SALAS.filter((s) => s.acceso === 'bloqueada');

/** Muro perimetral: un tramo por lado del contorno recortado. */
export function murosPerimetrales(): Tramo[] {
  const out: Tramo[] = [];
  for (let i = 0; i < CONTORNO_PX.length; i++) {
    const [ax, ay] = CONTORNO_PX[i]!;
    const [bx, by] = CONTORNO_PX[(i + 1) % CONTORNO_PX.length]!;
    if (ay === by) {
      const a = mx(Math.min(ax, bx));
      const b = mx(Math.max(ax, bx));
      out.push({ cx: (a + b) / 2, cz: mz(ay), w: b - a + MURO_M, d: MURO_M, alto: ALTURA_M, y: 0 });
    } else {
      const a = mz(Math.min(ay, by));
      const b = mz(Math.max(ay, by));
      out.push({ cx: mx(ax), cz: (a + b) / 2, w: MURO_M, d: b - a + MURO_M, alto: ALTURA_M, y: 0 });
    }
  }
  return out;
}

/** Todos los tramos del modelo: perímetro más las salas abiertas. */
export function todosLosMuros(): Tramo[] {
  return [...murosPerimetrales(), ...SALAS_ABIERTAS.flatMap(murosDeSala)];
}

/**
 * Volumen macizo de una sala bloqueada. Va a la misma altura que los muros: más bajo se
 * leía como una plataforma en medio del piso en vez de como un local cerrado.
 */
export const BLOQUE_ALTO_M = ALTURA_M;

export function bloqueDeSala(sala: Sala): Tramo {
  const { cx, cz, w, d } = rectDeSala(sala);
  return { cx, cz, w, d, alto: BLOQUE_ALTO_M, y: 0 };
}

/**
 * Puertas dibujadas sobre la cara de una sala bloqueada. El volumen es macizo y no puede
 * tener una abertura real, pero sin marcarlas se perdía por dónde se entra a los baños.
 */
export function puertasDeBloque(sala: Sala): Tramo[] {
  if (sala.acceso !== 'bloqueada') return [];
  const { cx, cz, w, d } = rectDeSala(sala);
  const alto = Math.min(PUERTA_ALTO_M, BLOQUE_ALTO_M - 0.1);
  const out: Tramo[] = [];
  for (const lado of ['norte', 'sur'] as const) {
    const z = lado === 'norte' ? cz - d / 2 : cz + d / 2;
    for (const p of huecosDe(sala.id, lado)) {
      out.push({ cx: p, cz: z, w: PUERTA_ANCHO_M, d: 0.06, alto, y: 0 });
    }
  }
  for (const lado of ['oeste', 'este'] as const) {
    const x = lado === 'oeste' ? cx - w / 2 : cx + w / 2;
    for (const p of huecosDe(sala.id, lado)) {
      out.push({ cx: x, cz: p, w: 0.06, d: PUERTA_ANCHO_M, alto, y: 0 });
    }
  }
  return out;
}

/**
 * Puertas de ascensor: dos de cada lado, sobre las caras **norte y sur** del núcleo, que
 * son sus lados largos. Antes estaban en las caras este y oeste; ahí van los paños de
 * vidrio.
 */
export function puertasDeAscensor(): Tramo[] {
  const nucleo = SALAS.find((s) => s.id === 'ascensores');
  if (!nucleo) return [];
  const { cx, cz, w, d } = rectDeSala(nucleo);
  const sep = w / 4;
  const out: Tramo[] = [];
  for (const lado of [-1, 1]) {
    for (const k of [-1, 1]) {
      out.push({
        cx: cx + k * sep,
        cz: cz + (lado * d) / 2,
        w: 1.1,
        d: MURO_M * 1.15,
        alto: 2.15,
        y: 0,
      });
    }
  }
  return out;
}

/** Los paños vidriados de una sala, uno por cara marcada en `vidriado`. */
export function ventanalesDe(sala: Sala): Tramo[] {
  if (!sala.vidriado) return [];
  const { cx, cz, w, d } = rectDeSala(sala);
  const margen = 0.6;
  const alto = ALTURA_M - 0.5;
  return sala.vidriado.map((lado) => {
    if (lado === 'oeste' || lado === 'este') {
      const x = lado === 'oeste' ? cx - w / 2 : cx + w / 2;
      return { cx: x, cz, w: MURO_M * 0.5, d: d - margen, alto, y: 0.25 };
    }
    const z = lado === 'norte' ? cz - d / 2 : cz + d / 2;
    return { cx, cz: z, w: w - margen, d: MURO_M * 0.5, alto, y: 0.25 };
  });
}

/** Columnas: los círculos blancos del croquis. */
const COLUMNAS_PX: readonly { x: number; y: number; d: number }[] = [
  { x: 632, y: 275, d: 54 },
];

export function columnas(): { x: number; z: number; r: number }[] {
  return COLUMNAS_PX.map((c) => ({
    x: mx(c.x + c.d / 2),
    z: mz(c.y + c.d / 2),
    r: (c.d / 2) * M_POR_PX,
  }));
}

/** Mesa de stand, tomada de las fotos: tablón rectangular. */
export const MESA_M = { largo: 1.4, ancho: 0.7, alto: 0.74 } as const;

export type Puesto = { x: number; z: number; rot: number };

/**
 * Reparte exactamente `n` stands contra las paredes de la sala, parejo sobre el perímetro
 * y dejando el centro libre para circular — como están las mesas en
 * `docs/piso/foto-sala-pwc.png`.
 */
export function puestosDeSala(sala: Sala, n: number = STANDS_POR_SALA): Puesto[] {
  const { cx, cz, w, d } = rectDeSala(sala);
  const off = MESA_M.ancho / 2 + 0.5;
  const iw = Math.max(0.1, w - off * 2);
  const id = Math.max(0.1, d - off * 2);
  const perimetro = 2 * (iw + id);

  const out: Puesto[] = [];
  for (let i = 0; i < n; i++) {
    const t = ((i + 0.5) / n) * perimetro;
    if (t < iw) {
      out.push({ x: cx - iw / 2 + t, z: cz - d / 2 + off, rot: 0 });
    } else if (t < iw + id) {
      out.push({ x: cx + w / 2 - off, z: cz - id / 2 + (t - iw), rot: Math.PI / 2 });
    } else if (t < iw * 2 + id) {
      out.push({ x: cx + iw / 2 - (t - iw - id), z: cz + d / 2 - off, rot: 0 });
    } else {
      out.push({ x: cx - w / 2 + off, z: cz + id / 2 - (t - iw * 2 - id), rot: Math.PI / 2 });
    }
  }
  return out;
}

/** Stands sueltos del hall: los rectángulos violetas que el croquis dibuja fuera de las salas. */
const STANDS_LIBRES_PX: readonly { x: number; y: number; w: number; h: number }[] = [
  { x: 438, y: 178, w: 45, h: 15 },
  { x: 498, y: 178, w: 47, h: 15 },
  { x: 640, y: 178, w: 46, h: 15 },
  { x: 695, y: 177, w: 47, h: 16 },
  { x: 793, y: 245, w: 15, h: 19 },
  { x: 631, y: 258, w: 47, h: 16 },
  { x: 793, y: 269, w: 15, h: 47 },
  { x: 721, y: 367, w: 15, h: 31 },
  { x: 657, y: 392, w: 37, h: 12 },
  { x: 578, y: 445, w: 45, h: 16 },
];

export function puestosLibres(): Puesto[] {
  return STANDS_LIBRES_PX.map((m) => ({
    x: mx(m.x + m.w / 2),
    z: mz(m.y + m.h / 2),
    rot: m.w >= m.h ? 0 : Math.PI / 2,
  }));
}

/** Todos los stands del piso: los de las salas más los del hall. */
export function todosLosPuestos(): Puesto[] {
  const enSalas = SALAS.filter((s) => s.tipo === 'stands').flatMap((s) => puestosDeSala(s));
  return [...enSalas, ...puestosLibres()];
}

/** Qué se hace en la sala — reemplaza a mostrar medidas. */
export function detalleDe(sala: Sala): string {
  if (sala.tipo === 'stands') return STANDS_POR_SALA + ' stands';
  if (sala.tipo === 'workshops') return 'Workshops';
  return 'Servicios';
}
