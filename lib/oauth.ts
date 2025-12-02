import crypto from 'crypto';
import { getPrismaClient } from './postgresql-prisma';

// Generate a secure random token
export function generateToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

// Hash a token for storage
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

// Verify a token against its hash
export function verifyToken(token: string, hash: string): boolean {
  return hashToken(token) === hash;
}

// Hash client secret
export function hashClientSecret(secret: string): string {
  return crypto.createHash('sha256').update(secret).digest('hex');
}

// Token expiration times (in milliseconds)
export const TOKEN_EXPIRY = {
  AUTHORIZATION_CODE: 10 * 60 * 1000, // 10 minutes
  ACCESS_TOKEN: 7 * 24 * 60 * 60 * 1000, // 7 days
  REFRESH_TOKEN: 30 * 24 * 60 * 60 * 1000, // 30 days
};

// OAuth client operations
export async function getOAuthClient(clientId: string) {
  const prisma = getPrismaClient();
  return prisma.oAuthClient.findUnique({
    where: { clientId },
  });
}

export async function validateRedirectUri(clientId: string, redirectUri: string): Promise<boolean> {
  const client = await getOAuthClient(clientId);
  if (!client) return false;
  return client.redirectUris.includes(redirectUri);
}

// Authorization code operations
export async function createAuthorizationCode(
  clientId: string,
  userId: string,
  redirectUri: string,
  scope?: string
): Promise<string> {
  const prisma = getPrismaClient();
  const code = generateToken(32);
  const now = Date.now();

  await prisma.oAuthAuthorizationCode.create({
    data: {
      code,
      clientId,
      userId,
      redirectUri,
      scope,
      expiresAt: BigInt(now + TOKEN_EXPIRY.AUTHORIZATION_CODE),
      createdAt: BigInt(now),
    },
  });

  return code;
}

export async function consumeAuthorizationCode(code: string, clientId: string, redirectUri: string) {
  const prisma = getPrismaClient();
  const now = Date.now();

  const authCode = await prisma.oAuthAuthorizationCode.findUnique({
    where: { code },
  });

  if (!authCode) return null;
  if (authCode.used) return null;
  if (authCode.clientId !== clientId) return null;
  if (authCode.redirectUri !== redirectUri) return null;
  if (Number(authCode.expiresAt) < now) return null;

  // Mark as used
  await prisma.oAuthAuthorizationCode.update({
    where: { id: authCode.id },
    data: { used: true },
  });

  return authCode;
}

// Access token operations
export async function createAccessToken(
  clientId: string,
  userId: string,
  scope?: string
): Promise<{ accessToken: string; refreshToken: string; expiresIn: number }> {
  const prisma = getPrismaClient();
  const accessToken = generateToken(32);
  const refreshToken = generateToken(32);
  const now = Date.now();

  const accessTokenRecord = await prisma.oAuthAccessToken.create({
    data: {
      tokenHash: hashToken(accessToken),
      clientId,
      userId,
      scope,
      expiresAt: BigInt(now + TOKEN_EXPIRY.ACCESS_TOKEN),
      createdAt: BigInt(now),
    },
  });

  await prisma.oAuthRefreshToken.create({
    data: {
      tokenHash: hashToken(refreshToken),
      accessTokenId: accessTokenRecord.id,
      expiresAt: BigInt(now + TOKEN_EXPIRY.REFRESH_TOKEN),
      createdAt: BigInt(now),
    },
  });

  return {
    accessToken,
    refreshToken,
    expiresIn: Math.floor(TOKEN_EXPIRY.ACCESS_TOKEN / 1000),
  };
}

export async function validateAccessToken(token: string) {
  const prisma = getPrismaClient();
  const tokenHash = hashToken(token);
  const now = Date.now();

  const accessToken = await prisma.oAuthAccessToken.findUnique({
    where: { tokenHash },
  });

  if (!accessToken) return null;
  if (Number(accessToken.expiresAt) < now) return null;

  return accessToken;
}

export async function refreshAccessToken(refreshTokenValue: string) {
  const prisma = getPrismaClient();
  const tokenHash = hashToken(refreshTokenValue);
  const now = Date.now();

  const refreshToken = await prisma.oAuthRefreshToken.findUnique({
    where: { tokenHash },
    include: { accessToken: true },
  });

  if (!refreshToken) return null;
  if (Number(refreshToken.expiresAt) < now) return null;

  // Delete old tokens
  await prisma.oAuthRefreshToken.delete({ where: { id: refreshToken.id } });
  await prisma.oAuthAccessToken.delete({ where: { id: refreshToken.accessTokenId } });

  // Create new tokens
  return createAccessToken(
    refreshToken.accessToken.clientId,
    refreshToken.accessToken.userId,
    refreshToken.accessToken.scope || undefined
  );
}

// Cleanup expired tokens (can be called periodically)
export async function cleanupExpiredTokens() {
  const prisma = getPrismaClient();
  const now = Date.now();

  await prisma.oAuthAuthorizationCode.deleteMany({
    where: { expiresAt: { lt: BigInt(now) } },
  });

  await prisma.oAuthAccessToken.deleteMany({
    where: { expiresAt: { lt: BigInt(now) } },
  });

  await prisma.oAuthRefreshToken.deleteMany({
    where: { expiresAt: { lt: BigInt(now) } },
  });
}
