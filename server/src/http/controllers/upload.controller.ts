import type { RequestHandler } from 'express';
import type { IImageStorageService } from '../../services/contracts/image-storage.interface.js';
import type { AppConfig } from '../../config/env.js';
import { BadRequestError, InternalError } from '../errors/http-error.js';
import { asyncHandler } from '../middleware/async-handler.js';

export interface UploadControllerDeps {
  config: AppConfig;
  imageStorage: IImageStorageService | null;
}

export function createUploadHandler(deps: UploadControllerDeps): RequestHandler {
  return asyncHandler(async (req, res) => {
    if (!deps.config.cloudinary || !deps.imageStorage) {
      throw new InternalError(
        'Faltan CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY y CLOUDINARY_API_SECRET en el entorno del servidor.',
      );
    }

    if (!req.file?.buffer) {
      throw new BadRequestError('No recibimos ningún archivo.');
    }

    const mime = req.file.mimetype || 'image/jpeg';
    const base64 = req.file.buffer.toString('base64');
    const dataUri = `data:${mime};base64,${base64}`;

    const secureUrl = await deps.imageStorage.uploadDataUri(dataUri, {
      folder: 'xplora-landing',
    });

    res.json({ secure_url: secureUrl });
  });
}
