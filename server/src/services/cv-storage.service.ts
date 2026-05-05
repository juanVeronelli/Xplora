import { v2 as cloudinary } from 'cloudinary';
import type { AppConfig } from '../config/env.js';
import { InternalError } from '../http/errors/http-error.js';

function cloudinaryConfigured(config: AppConfig): void {
  const c = config.cloudinary;
  if (!c) throw new InternalError('Cloudinary no está configurado (CLOUDINARY_*).');
  cloudinary.config({ cloud_name: c.cloudName, api_key: c.apiKey, api_secret: c.apiSecret });
}

export async function uploadCvBufferToCloudinary(
  config: AppConfig,
  file: { buffer: Buffer; filename: string },
): Promise<string> {
  cloudinaryConfigured(config);
  const folder = 'xplora-landing/cv';

  return await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'raw',
        filename_override: file.filename,
        use_filename: true,
        unique_filename: true,
      },
      (err, result) => {
        if (err) return reject(new InternalError(err.message));
        const url = result?.secure_url;
        if (!url) return reject(new InternalError('Cloudinary no devolvió URL.'));
        resolve(url);
      },
    );
    stream.end(file.buffer);
  });
}

