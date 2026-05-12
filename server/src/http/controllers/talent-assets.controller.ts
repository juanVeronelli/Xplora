import type { RequestHandler } from 'express';
import type { AppConfig } from '../../config/env.js';
import { createServiceSupabase, createUserSupabase } from '../../infra/supabase-clients.js';
import { uploadCvBufferToCloudinary } from '../../services/cv-storage.service.js';
import type { IImageStorageService } from '../../services/contracts/image-storage.interface.js';
import { BadRequestError, InternalError } from '../errors/http-error.js';
import { asyncHandler } from '../middleware/async-handler.js';

function inferExtensionFromMime(mime: string): string {
  if (mime === 'application/pdf') return 'pdf';
  if (mime === 'image/png') return 'png';
  if (mime === 'image/jpeg' || mime === 'image/jpg') return 'jpg';
  if (mime === 'image/webp') return 'webp';
  return 'bin';
}

function bufferToDataUri(file: { buffer: Buffer; mimetype: string }): string {
  const base64 = file.buffer.toString('base64');
  return `data:${file.mimetype};base64,${base64}`;
}

export function createTalentProfilePhotoUploadHandler(deps: {
  config: AppConfig;
  imageStorage: IImageStorageService | null;
}): RequestHandler {
  return asyncHandler(async (req, res) => {
    const userId = req.authUser?.id;
    if (!userId) throw new BadRequestError('Falta usuario.');
    if (!deps.config.cloudinary || !deps.imageStorage) {
      throw new InternalError('Cloudinary no está configurado en el servidor (CLOUDINARY_*).');
    }

    const file = (req as any).file as { buffer: Buffer; mimetype: string; originalname: string } | undefined;
    if (!file) throw new BadRequestError('Falta archivo (campo multipart `file`).');
    if (!file.mimetype.startsWith('image/')) throw new BadRequestError('Subí una imagen (JPG/PNG/WebP).');

    const secureUrl = await deps.imageStorage.uploadDataUri(bufferToDataUri(file), { folder: 'xplora-landing/talent/photos' });

    // Preferimos respetar RLS (user client) si existe columna. Si no, devolvemos error claro.
    const sb = createUserSupabase(deps.config, req.headers.authorization);
    const { data, error } = await sb
      .from('talent_profiles')
      .upsert({ user_id: userId, photo_url: secureUrl, updated_at: new Date().toISOString() } as any)
      .select('*')
      .single();

    if (error) {
      const msg = error.message || 'No se pudo guardar la foto.';
      if (msg.toLowerCase().includes('photo_url')) {
        throw new BadRequestError('Tu tabla talent_profiles no tiene la columna photo_url. Agregala en Supabase y reintentá.');
      }
      throw new BadRequestError(msg);
    }

    res.json({ photo_url: (data as any)?.photo_url ?? secureUrl, profile: data });
  });
}

export function createTalentProfileCvUploadHandler(config: AppConfig): RequestHandler {
  return asyncHandler(async (req, res) => {
    const userId = req.authUser?.id;
    if (!userId) throw new BadRequestError('Falta usuario.');

    const file = (req as any).file as { buffer: Buffer; mimetype: string; originalname: string } | undefined;
    if (!file) throw new BadRequestError('Falta archivo (campo multipart `cv`).');
    if (file.mimetype !== 'application/pdf') {
      throw new BadRequestError('Formato inválido. Subí tu CV en PDF.');
    }

    const safeExt = inferExtensionFromMime(file.mimetype);
    const filename = `cv-${userId}.${safeExt}`;
    const url = await uploadCvBufferToCloudinary(config, { buffer: file.buffer, filename });

    const sb = createUserSupabase(config, req.headers.authorization);
    const { data, error } = await sb
      .from('talent_profiles')
      .upsert({ user_id: userId, cv_url: url, updated_at: new Date().toISOString() } as any)
      .select('*')
      .single();
    if (error) throw new BadRequestError(error.message);
    res.json({ cv_url: (data as any)?.cv_url ?? url, profile: data });
  });
}

export function createTalentApplicationsListHandler(config: AppConfig): RequestHandler {
  return asyncHandler(async (req, res) => {
    const userId = req.authUser?.id;
    if (!userId) throw new BadRequestError('Falta usuario.');

    // Usamos service role para poder hacer join sin depender de políticas RLS (y filtramos por usuario).
    const sb = createServiceSupabase(config);
    if (!sb) throw new InternalError('Falta SUPABASE_SERVICE_ROLE_KEY para listar postulaciones.');

    const { data, error } = await sb
      .from('job_applications')
      .select('id,status,created_at,job_id, snapshot, empleos:job_id (id,title,company,emoji,location,type,area)')
      .eq('talent_user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw new BadRequestError(error.message);
    res.json((data ?? []) as any[]);
  });
}

