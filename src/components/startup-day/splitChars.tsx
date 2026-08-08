/** Animación letra por letra del título hero. */
export function splitChars(text: string, baseDelay = 0.12) {
  return text.split('').map((ch, i) => (
    <span
      key={`${ch}-${i}`}
      className="sd-char"
      style={{ animationDelay: `${0.048 * i + baseDelay}s` }}
    >
      {ch === ' ' ? '\u00A0' : ch}
    </span>
  ));
}
