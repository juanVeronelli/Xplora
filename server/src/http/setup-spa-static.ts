import type { Express } from 'express';
import express from 'express';
import fs from 'fs';
import path from 'path';
import type { AppConfig } from '../config/env.js';

/** Sirve `dist/` del front y fallback SPA (solo producción con build presente). */
export function setupSpaStaticIfProduction(app: Express, config: AppConfig): void {
  const isProd = config.nodeEnv === 'production';
  const distDir = config.paths.webDist;
  const hasDist = fs.existsSync(distDir);

  if (!isProd || !hasDist) {
    return;
  }

  app.use(express.static(distDir));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      res.status(404).json({ error: 'Ruta API no encontrada.', code: 'NOT_FOUND' });
      return;
    }
    res.sendFile(path.join(distDir, 'index.html'), err => {
      if (err) next(err);
    });
  });
}
