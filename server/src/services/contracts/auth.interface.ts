export interface AuthUser {
  id: string;
  email?: string;
}

/**
 * Valida la sesión del cliente (Bearer JWT de Supabase).
 */
export interface IAuthService {
  getUserFromAuthorizationHeader(authHeader: string | undefined): Promise<AuthUser | null>;
}
