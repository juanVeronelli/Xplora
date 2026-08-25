import type { ReactNode } from 'react';

/**
 * Animación letra por letra. Agrupa por palabra (`.sd-word`, `white-space: nowrap`) para que el
 * salto de línea del navegador — inline-block junto a inline-block puede cortar sin que haya
 * espacio real de por medio — nunca parta una palabra a la mitad en frases largas.
 *
 * El espacio entre palabras va COMO HERMANO de los `.sd-word`, no adentro: un espacio al final
 * del contenido de un inline-block es "trailing whitespace" para ese mini line-box propio y el
 * navegador lo recorta, así que puesto adentro desaparecía y las palabras quedaban pegadas.
 */
export function splitChars(text: string, baseDelay = 0.12) {
  const words = text.split(' ');
  const nodes: ReactNode[] = [];
  let i = 0;

  words.forEach((word, wi) => {
    const chars = word.split('').map((ch) => {
      const el = (
        <span
          key={`${ch}-${i}`}
          className="sd-char"
          style={{ animationDelay: `${0.048 * i + baseDelay}s` }}
        >
          {ch}
        </span>
      );
      i += 1;
      return el;
    });

    nodes.push(
      <span key={`w-${wi}`} className="sd-word">
        {chars}
      </span>,
    );
    if (wi < words.length - 1) nodes.push(' ');
  });

  return nodes;
}
