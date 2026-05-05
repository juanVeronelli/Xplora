/**
 * Contrato para almacenamiento de imágenes (DIP).
 * Podés agregar un `S3ImageStorageService` u otro sin tocar los controladores.
 */
export interface IImageStorageService {
  uploadDataUri(dataUri: string, options?: { folder?: string }): Promise<string>;
}
