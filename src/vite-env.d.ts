/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_KEY: string;
  readonly VITE_JOIN_URL: string;
  readonly VITE_SHEETS_WEBHOOK: string;
  readonly VITE_INSTAGRAM_URL: string;
  readonly VITE_LINKEDIN_URL: string;
  readonly VITE_WHATSAPP_URL: string;
  /** Opcional: origen del API (ej. http://127.0.0.1:8787). Vacío = mismo origen + proxy Vite en dev. */
  readonly VITE_API_ORIGIN?: string;
  /** Cloudinary: solo si usás subida directa (preset unsigned) */
  readonly VITE_CLOUDINARY_CLOUD_NAME?: string;
  readonly VITE_CLOUDINARY_UPLOAD_PRESET?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
