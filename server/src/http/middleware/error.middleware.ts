import type { ErrorRequestHandler } from 'express';
import multer from 'multer';
import { HttpError } from '../errors/http-error.js';

export const errorMiddleware: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof HttpError) {
    res.status(err.statusCode).json({ error: err.message, code: err.code });
    return;
  }
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      res.status(400).json({ error: 'El archivo supera el tamaño máximo permitido.', code: 'FILE_TOO_LARGE' });
      return;
    }
    res.status(400).json({ error: err.message, code: err.code });
    return;
  }
  console.error('[unhandled]', err);
  res.status(500).json({ error: 'Error interno del servidor.', code: 'INTERNAL' });
};
