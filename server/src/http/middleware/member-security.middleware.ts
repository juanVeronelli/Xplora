/**
 * Hardening compartido para `/api/member/*`:
 * rate limits (IP + email), headers anti-cache, CORS ya en composition-root.
 */
import type { Request, RequestHandler, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';

function clientIp(req: Request): string {
  return req.ip || req.socket.remoteAddress || 'unknown';
}

function bodyEmail(req: Request): string {
  const raw = (req.body as { email?: unknown } | undefined)?.email;
  if (typeof raw !== 'string') return '';
  return raw.trim().toLowerCase().slice(0, 160);
}

/** Clave IP + email (auth por correo). */
export function memberAuthKey(req: Request): string {
  const email = bodyEmail(req);
  return `${clientIp(req)}|${email || '-'}`;
}

const common = {
  standardHeaders: true as const,
  legacyHeaders: false as const,
  // keyGenerator custom (IP+email): desactiva validación estricta de v7
  validate: false as const,
};

/** Techo general por IP en toda la API miembro. */
export const memberGlobalLimiter = rateLimit({
  ...common,
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { error: 'Demasiadas solicitudes. Probá más tarde.', code: 'RATE_LIMIT' },
});

/** Registro: muy estricto (abuso de Resend). */
export const memberRegisterLimiter = rateLimit({
  ...common,
  windowMs: 60 * 60 * 1000,
  max: 8,
  keyGenerator: memberAuthKey,
  message: { error: 'Demasiados intentos de registro. Esperá un rato.', code: 'RATE_LIMIT' },
});

/** Pedir código de login / reenvío. */
export const memberLoginRequestLimiter = rateLimit({
  ...common,
  windowMs: 15 * 60 * 1000,
  max: 6,
  keyGenerator: memberAuthKey,
  message: { error: 'Demasiados pedidos de código. Esperá unos minutos.', code: 'RATE_LIMIT' },
});

/** Verificar OTP. */
export const memberLoginVerifyLimiter = rateLimit({
  ...common,
  windowMs: 15 * 60 * 1000,
  max: 12,
  keyGenerator: memberAuthKey,
  message: { error: 'Demasiados intentos de código. Esperá unos minutos.', code: 'RATE_LIMIT' },
});

/** Confirmar link de email. */
export const memberConfirmLimiter = rateLimit({
  ...common,
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Demasiados intentos de confirmación.', code: 'RATE_LIMIT' },
});

/** Lecturas autenticadas (me, jobs, listados). */
export const memberReadLimiter = rateLimit({
  ...common,
  windowMs: 15 * 60 * 1000,
  max: 180,
  message: { error: 'Demasiadas lecturas. Probá más tarde.', code: 'RATE_LIMIT' },
});

/** Escrituras autenticadas (perfil, propuestas). */
export const memberWriteLimiter = rateLimit({
  ...common,
  windowMs: 15 * 60 * 1000,
  max: 40,
  message: { error: 'Demasiadas escrituras. Probá más tarde.', code: 'RATE_LIMIT' },
});

/** Propuestas: techo horario extra. */
export const memberProposalLimiter = rateLimit({
  ...common,
  windowMs: 60 * 60 * 1000,
  max: 12,
  message: { error: 'Llegaste al límite de propuestas por hora.', code: 'RATE_LIMIT' },
});

/** Uploads avatar/CV. */
export const memberUploadLimiter = rateLimit({
  ...common,
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: { error: 'Demasiadas subidas. Probá más tarde.', code: 'RATE_LIMIT' },
});

/** No cachear respuestas de sesión / datos personales. */
export function memberNoStoreHeaders(_req: Request, res: Response, next: NextFunction): void {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  next();
}

/** Body JSON chico en rutas miembro (evita payloads enormes). */
export const memberJsonGuard: RequestHandler = (req, res, next) => {
  const len = Number(req.headers['content-length'] || 0);
  if (Number.isFinite(len) && len > 64 * 1024 && req.method !== 'GET' && !req.is('multipart/form-data')) {
    res.status(413).json({ error: 'Payload demasiado grande.', code: 'PAYLOAD_TOO_LARGE' });
    return;
  }
  next();
};
