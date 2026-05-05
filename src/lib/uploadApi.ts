import { authFetch } from './serverApi';

/** Subida vía API Node (Cloudinary lee credenciales del servidor: .env / Railway). */
export async function uploadImageViaServer(file: File): Promise<string> {
  const fd = new FormData();
  fd.append('file', file);

  const res = await authFetch('/api/cloudinary-upload', {
    method: 'POST',
    body: fd,
  });

  const json = (await res.json()) as { secure_url?: string; error?: string };
  if (!res.ok) {
    throw new Error(json.error || `Error al subir (${res.status})`);
  }
  if (!json.secure_url) {
    throw new Error(json.error || 'Respuesta inválida del servidor.');
  }
  return json.secure_url;
}
