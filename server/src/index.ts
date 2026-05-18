/**
 * Entrada del servidor Express: carga `.env`, construye la app (`composition-root`) y escucha `config.port`.
 * En producción sirve también el `dist/` del front si existe (SPA).
 */
import fs from 'fs';
import { loadEnvFromProjectRoot, getAppConfig } from './config/env.js';
import { createApplication } from './composition-root.js';

loadEnvFromProjectRoot();

const config = getAppConfig();
const app = createApplication(config);

app.listen(config.port, () => {
  const mode =
    config.nodeEnv === 'production' && fs.existsSync(config.paths.webDist)
      ? 'API + sitio estático (dist/)'
      : 'solo API (en dev Vite usa otro puerto; /api se proxifica)';
  console.log(`[server] http://localhost:${config.port} — ${mode}`);
  if (config.resend) {
    console.log(
      `[server] Resend: campañas de email habilitadas (from=${config.resend.from}).`,
    );
  } else {
    console.log(
      '[server] Resend: sin RESEND_API_KEY (ni RESEND_KEY) en .env (raíz del proyecto) — el envío de campañas desde el panel está deshabilitado.',
    );
  }
});
