/** Errores operacionales con código HTTP fijo (no filtran stack al cliente). */
export class HttpError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly code = 'HTTP_ERROR',
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

export class BadRequestError extends HttpError {
  constructor(message: string) {
    super(400, message, 'BAD_REQUEST');
    this.name = 'BadRequestError';
  }
}

export class UnauthorizedError extends HttpError {
  constructor(message: string) {
    super(401, message, 'UNAUTHORIZED');
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends HttpError {
  constructor(message: string, code = 'FORBIDDEN') {
    super(403, message, code);
    this.name = 'ForbiddenError';
  }
}

export class InternalError extends HttpError {
  constructor(message: string) {
    super(500, message, 'INTERNAL');
    this.name = 'InternalError';
  }
}
