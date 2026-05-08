import type { AuthUser } from '../services/contracts/auth.interface.js';
import type { StaffProfile } from '../http/middleware/load-staff.middleware.js';

declare global {
  namespace Express {
    interface Request {
      /** Seteado por `requireAuthMiddleware` */
      authUser?: AuthUser;
      /** Seteado por `createLoadStaffProfileMiddleware` */
      staffProfile?: StaffProfile;
      /** Partner portal: company_id del usuario (si aplica). */
      partnerCompanyId?: string;
    }
  }
}

export {};
