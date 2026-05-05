import type { CarouselSlide } from '../types';

/** Para la animación: tres carriles que rotan en direcciones distintas */
export type CarouselPhoto = { src: string; label: string };

export function slidesToPhotos(slides: CarouselSlide[]): CarouselPhoto[] {
  return slides.map(s => ({ src: s.url, label: s.label }));
}

/** Una entrada por URL (orden de primera aparición); reduce repeticiones si el CMS duplica la misma imagen. */
function uniqueBySrc(photos: CarouselPhoto[]): CarouselPhoto[] {
  const seen = new Set<string>();
  const out: CarouselPhoto[] = [];
  for (const p of photos) {
    if (seen.has(p.src)) continue;
    seen.add(p.src);
    out.push(p);
  }
  return out;
}

/**
 * Construye una fila del marquee evitando la misma foto dos veces seguidas cuando hay alternativas.
 * Corrige el "corte" del loop infinito (último ≠ primero) para que al duplicar [...row, row] no queden dos iguales pegadas en la junta.
 */
function buildSpacedTrack(
  photos: CarouselPhoto[],
  minLen: number,
  rowIndex: number,
): CarouselPhoto[] {
  if (photos.length === 0) return [];

  const out: CarouselPhoto[] = [];
  let nextStart = rowIndex % photos.length;

  while (out.length < minLen) {
    const prev = out[out.length - 1];
    let placed = false;
    for (let k = 0; k < photos.length; k++) {
      const idx = (nextStart + k) % photos.length;
      const cand = photos[idx];
      if (!prev || cand.src !== prev.src) {
        out.push(cand);
        nextStart = (idx + 1) % photos.length;
        placed = true;
        break;
      }
    }
    if (!placed) {
      const cand = photos[nextStart % photos.length];
      out.push(cand);
      nextStart = (nextStart + 1) % photos.length;
    }
  }

  if (out.length >= 2 && out[0].src === out[out.length - 1].src) {
    const beforeLast = out[out.length - 2];
    for (const p of photos) {
      if (p.src !== beforeLast.src && p.src !== out[0].src) {
        out[out.length - 1] = p;
        break;
      }
    }
  }

  return out;
}

/**
 * Reparte en 3 carriles con densidad mínima.
 * Las repeticiones se espacian (no consecutivas si hay más de una foto distinta);
 * la junta del marquee infinito evita dos iguales seguidas entre el final y el inicio del ciclo.
 */
export function splitCarouselIntoTracks(slides: CarouselSlide[]): CarouselPhoto[][] {
  const photos = uniqueBySrc(slidesToPhotos(slides));
  if (photos.length === 0) return [[], [], []];

  const minPerRow = Math.max(6, Math.ceil(photos.length / 3));
  return [
    buildSpacedTrack(photos, minPerRow, 0),
    buildSpacedTrack(photos, minPerRow, 1),
    buildSpacedTrack(photos, minPerRow, 2),
  ];
}
