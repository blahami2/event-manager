import { prisma } from "./prisma";
import type { TokenData } from "@/types/registration";

/**
 * Token data-access layer.
 *
 * Every function maps directly to a Prisma operation and converts the
 * result to a typed `TokenData`.  No business logic lives here.
 */

// ── Helpers ──

function toOutput(row: {
  id: string;
  registrationId: string;
  tokenHash: string;
  expiresAt: Date;
  isRevoked: boolean;
  createdAt: Date;
}): TokenData {
  return {
    id: row.id,
    registrationId: row.registrationId,
    tokenHash: row.tokenHash,
    expiresAt: row.expiresAt,
    isRevoked: row.isRevoked,
    createdAt: row.createdAt,
  };
}

// ── Public API ──

/** Create a new token record for a registration. */
export async function createToken(
  registrationId: string,
  tokenHash: string,
  expiresAt: Date,
): Promise<TokenData> {
  const row = await prisma.registrationToken.create({
    data: {
      registrationId,
      tokenHash,
      expiresAt,
    },
  });
  return toOutput(row);
}

/** Find a valid (non-revoked, non-expired) token by its hash. */
export async function findByTokenHash(
  hash: string,
): Promise<TokenData | null> {
  const row = await prisma.registrationToken.findFirst({
    where: {
      tokenHash: hash,
      isRevoked: false,
      expiresAt: { gt: new Date() },
    },
  });
  return row ? toOutput(row) : null;
}

/** Revoke a single token by its ID. */
export async function revokeToken(
  tokenId: string,
): Promise<TokenData> {
  const row = await prisma.registrationToken.update({
    where: { id: tokenId },
    data: { isRevoked: true },
  });
  return toOutput(row);
}

/** Revoke all tokens for a given registration (batch update). */
export async function revokeAllTokensForRegistration(
  registrationId: string,
): Promise<number> {
  const result = await prisma.registrationToken.updateMany({
    where: { registrationId },
    data: { isRevoked: true },
  });
  return result.count;
}

/**
 * Revoke every token for a registration except one. Returns count of revoked rows.
 *
 * This is the shape token rotation actually needs: the replacement token is
 * created *before* the email that carries it is sent, so that a failed send
 * leaves the guest's existing link working. Revocation is then the last step,
 * and it must spare the token just issued.
 */
export async function revokeAllTokensForRegistrationExcept(
  registrationId: string,
  exceptTokenId: string,
): Promise<number> {
  const result = await prisma.registrationToken.updateMany({
    where: { registrationId, id: { not: exceptTokenId } },
    data: { isRevoked: true },
  });
  return result.count;
}

/** Delete tokens that are both expired and revoked. Returns count of deleted rows. */
export async function deleteExpiredRevokedTokens(): Promise<number> {
  const result = await prisma.registrationToken.deleteMany({
    where: {
      expiresAt: { lt: new Date() },
      isRevoked: true,
    },
  });
  return result.count;
}

/** Find the most recent non-revoked, non-expired token for a registration. */
export async function findActiveTokenForRegistration(
  registrationId: string,
): Promise<TokenData | null> {
  const row = await prisma.registrationToken.findFirst({
    where: {
      registrationId,
      isRevoked: false,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });
  return row ? toOutput(row) : null;
}
