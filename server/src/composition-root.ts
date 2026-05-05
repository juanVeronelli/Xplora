import express, { type Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import type { AppConfig } from './config/env.js';
import { getAppConfig } from './config/env.js';
import { SupabaseJwtAuthService } from './services/supabase-auth.service.js';
import { CloudinaryImageStorageService } from './services/cloudinary-image-storage.service.js';
import { registerApiRoutes } from './http/routes/register-api.routes.js';
import { setupSpaStaticIfProduction } from './http/setup-spa-static.js';
import { errorMiddleware } from './http/middleware/error.middleware.js';

/**
 * Composition root: acá se crean implementaciones concretas e inyectan dependencias.
 * Para nuevos módulos (ej. notificaciones): crear servicio + registrar rutas.
 */
export function createApplication(config: AppConfig = getAppConfig()): Express {
  const app = express();
  app.set('trust proxy', 1);

  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(cors());
  app.use(express.json({ limit: '2mb' }));

  const auth = new SupabaseJwtAuthService(config);
  const imageStorage = config.cloudinary ? new CloudinaryImageStorageService(config) : null;

  registerApiRoutes(app, { config, auth, imageStorage });

  setupSpaStaticIfProduction(app, config);

  app.use(errorMiddleware);

  return app;
}
