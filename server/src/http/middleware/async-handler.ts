import type { RequestHandler } from 'express';

/** Evita try/catch en cada ruta async; errores van al error middleware. */
export function asyncHandler(fn: RequestHandler): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
