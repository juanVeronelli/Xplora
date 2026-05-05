import type { RequestHandler } from 'express';
import type { IAuthService } from '../../services/contracts/auth.interface.js';
import { UnauthorizedError } from '../errors/http-error.js';
import { asyncHandler } from './async-handler.js';

export function createRequireAuthMiddleware(auth: IAuthService): RequestHandler {
  return asyncHandler(async (req, _res, next) => {
    const user = await auth.getUserFromAuthorizationHeader(req.headers.authorization);
    if (!user) {
      throw new UnauthorizedError('Tenés que iniciar sesión como administrador.');
    }
    req.authUser = user;
    next();
  });
}
