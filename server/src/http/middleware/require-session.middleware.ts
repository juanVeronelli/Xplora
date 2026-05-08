import type { RequestHandler } from 'express';
import type { IAuthService } from '../../services/contracts/auth.interface.js';
import { UnauthorizedError } from '../errors/http-error.js';
import { asyncHandler } from './async-handler.js';

/** Igual que requireAuth, pero mensaje genérico (no “admin”). */
export function createRequireSessionMiddleware(auth: IAuthService): RequestHandler {
  return asyncHandler(async (req, _res, next) => {
    const user = await auth.getUserFromAuthorizationHeader(req.headers.authorization);
    if (!user) {
      throw new UnauthorizedError('Tenés que iniciar sesión.');
    }
    req.authUser = user;
    next();
  });
}

