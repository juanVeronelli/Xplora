import type { RequestHandler } from 'express';
import type { AppConfig } from '../../config/env.js';
import { createServiceSupabase } from '../../infra/supabase-clients.js';
import { findMemberById } from '../../services/member-accounts.service.js';
import {
  bearerFromAuthorization,
  verifyMemberAccessToken,
} from '../../services/member-jwt.service.js';
import { UnauthorizedError, InternalError } from '../errors/http-error.js';
import { asyncHandler } from './async-handler.js';

export type MemberAuthContext = {
  accountId: string;
  email: string;
};

declare global {
  namespace Express {
    interface Request {
      memberAuth?: MemberAuthContext;
    }
  }
}

export function createRequireMemberAuthMiddleware(config: AppConfig): RequestHandler {
  return asyncHandler(async (req, _res, next) => {
    const secret = config.memberJwtSecret;
    if (!secret) {
      throw new InternalError('MEMBER_JWT_SECRET no está configurado en el servidor.');
    }
    const token = bearerFromAuthorization(req.header('authorization') ?? undefined);
    if (!token) throw new UnauthorizedError('Iniciá sesión para continuar.');

    let payload;
    try {
      payload = await verifyMemberAccessToken(secret, token);
    } catch {
      throw new UnauthorizedError('Sesión inválida o vencida. Volvé a iniciar sesión.');
    }

    const sb = createServiceSupabase(config);
    if (!sb) throw new InternalError('Base de datos no configurada (service role).');

    const account = await findMemberById(sb, payload.sub);
    if (!account?.email_confirmed_at) {
      throw new UnauthorizedError('Cuenta no confirmada o inexistente.');
    }

    req.memberAuth = { accountId: account.id, email: account.email };
    next();
  });
}
