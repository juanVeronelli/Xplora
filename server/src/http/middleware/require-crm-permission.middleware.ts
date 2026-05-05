import type { RequestHandler } from 'express';
import type { CrmPermissionKey } from '../../permissions/crm-permissions.js';
import { hasAnyPermission } from '../../permissions/crm-permissions.js';
import { ForbiddenError } from '../errors/http-error.js';

export function createRequireAnyCrmPermission(keys: readonly CrmPermissionKey[]): RequestHandler {
  return (req, _res, next) => {
    const perms = req.staffProfile?.permissions;
    if (!perms?.length) {
      next(new ForbiddenError('Sin permisos para esta acción.'));
      return;
    }
    if (!hasAnyPermission(perms, keys)) {
      next(new ForbiddenError('No tenés permiso para esta acción.'));
      return;
    }
    next();
  };
}
