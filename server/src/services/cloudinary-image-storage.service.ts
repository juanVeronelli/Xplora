import { v2 as cloudinary } from 'cloudinary';
import type { IImageStorageService } from './contracts/image-storage.interface.js';
import { InternalError } from '../http/errors/http-error.js';
import type { AppConfig } from '../config/env.js';

export class CloudinaryImageStorageService implements IImageStorageService {
  constructor(config: AppConfig) {
    const c = config.cloudinary;
    if (!c) {
      throw new Error('CloudinaryImageStorageService: cloudinary no está configurado en env');
    }
    cloudinary.config({
      cloud_name: c.cloudName,
      api_key: c.apiKey,
      api_secret: c.apiSecret,
    });
  }

  async uploadDataUri(dataUri: string, options?: { folder?: string }): Promise<string> {
    try {
      const result = await cloudinary.uploader.upload(dataUri, {
        folder: options?.folder ?? 'xplora-landing',
        resource_type: 'image',
      });
      if (!result?.secure_url) {
        throw new InternalError('Cloudinary no devolvió URL.');
      }
      return result.secure_url;
    } catch (e) {
      if (e instanceof InternalError) throw e;
      const msg = e instanceof Error ? e.message : 'Error de Cloudinary';
      throw new InternalError(msg);
    }
  }
}
