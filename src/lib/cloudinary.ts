import { uploadImageViaServer } from './uploadApi';

const MAX_BYTES = 12 * 1024 * 1024;
const ACCEPT = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];

export function validateImageFile(file: File): string | null {
  if (!ACCEPT.includes(file.type) && !/\.(jpe?g|png|webp|gif|svg)$/i.test(file.name)) {
    return 'Usá una imagen JPG, PNG, WEBP, GIF o SVG.';
  }
  if (file.size > MAX_BYTES) {
    return 'El archivo es muy pesado. Probá con uno de menos de 12 MB.';
  }
  return null;
}

async function uploadUnsignedFromBrowser(file: File): Promise<string> {
  const cloud = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string;
  const preset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET as string;

  const fd = new FormData();
  fd.append('file', file);
  fd.append('upload_preset', preset);
  fd.append('folder', 'xplora-landing');

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/image/upload`, {
    method: 'POST',
    body: fd,
  });

  const json = (await res.json()) as { secure_url?: string; error?: { message?: string } };
  if (!res.ok) {
    const msg = json.error?.message || 'No se pudo subir la imagen.';
    throw new Error(msg);
  }
  if (!json.secure_url) throw new Error('Respuesta inválida del servidor.');
  return json.secure_url;
}

/**
 * 1) Opcional: VITE_CLOUDINARY_CLOUD_NAME + VITE_CLOUDINARY_UPLOAD_PRESET → subida directa (preset unsigned, sin backend).
 * 2) Por defecto: POST /api/cloudinary-upload (server/index.mjs) con CLOUDINARY_* en .env o Railway.
 */
export async function uploadImageToCloudinary(file: File): Promise<string> {
  const cloud = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string | undefined;
  const preset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET as string | undefined;
  if (cloud?.trim() && preset?.trim()) {
    return uploadUnsignedFromBrowser(file);
  }
  return uploadImageViaServer(file);
}
