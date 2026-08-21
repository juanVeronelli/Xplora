import { createHash, randomBytes, randomInt } from 'node:crypto';
import { SignJWT, jwtVerify } from 'jose';

const MEMBER_JWT_TYP = 'member' as const;
const ACCESS_TTL = '30d';

export type MemberJwtPayload = {
  sub: string;
  email: string;
  typ: typeof MEMBER_JWT_TYP;
};

export function hashSecret(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

/** Token opaco para link de confirmación de registro. */
export function createConfirmToken(): string {
  return randomBytes(32).toString('base64url');
}

/** Código numérico de 5 dígitos para login. */
export function createLoginCode(): string {
  return String(randomInt(10000, 99999));
}

export async function signMemberAccessToken(
  secret: string,
  account: { id: string; email: string },
): Promise<string> {
  const key = new TextEncoder().encode(secret);
  return new SignJWT({ email: account.email, typ: MEMBER_JWT_TYP })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(account.id)
    .setIssuedAt()
    .setExpirationTime(ACCESS_TTL)
    .sign(key);
}

export async function verifyMemberAccessToken(
  secret: string,
  token: string,
): Promise<MemberJwtPayload> {
  const key = new TextEncoder().encode(secret);
  const { payload } = await jwtVerify(token, key, { algorithms: ['HS256'] });
  const sub = typeof payload.sub === 'string' ? payload.sub : '';
  const email = typeof payload.email === 'string' ? payload.email.toLowerCase() : '';
  const typ = payload.typ;
  if (!sub || !email || typ !== MEMBER_JWT_TYP) {
    throw new Error('Token de miembro inválido');
  }
  return { sub, email, typ: MEMBER_JWT_TYP };
}

export function bearerFromAuthorization(header: string | undefined): string | null {
  if (!header) return null;
  const m = /^Bearer\s+(.+)$/i.exec(header.trim());
  return m?.[1]?.trim() || null;
}
