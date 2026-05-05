/**
 * Parsea el documento completo del mail y devuelve solo `body.innerHTML`
 * para inyectarlo en la vista previa (evita recargar un iframe en cada tecla).
 */
export function extractBodyInnerFromEmailHtml(fullHtml: string): string {
  if (typeof document === 'undefined' || typeof DOMParser === 'undefined') {
    return '';
  }
  const doc = new DOMParser().parseFromString(fullHtml, 'text/html');
  return doc.body.innerHTML;
}
