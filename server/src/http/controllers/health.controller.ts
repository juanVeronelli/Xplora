import type { RequestHandler } from 'express';
import type { AppConfig } from '../../config/env.js';

export function createHealthHandler(config: AppConfig): RequestHandler {
  return (_req, res) => {
    res.json({
      ok: true,
      cloudinaryConfigured: config.cloudinary !== null,
      env: config.nodeEnv,
    });
  };
}
