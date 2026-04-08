import crypto from 'crypto';

const INVITE_EXPIRY_HOURS = 48;

/**
 * Generate a cryptographically random invitation token (64 hex chars).
 */
export function generateInviteToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Hash a raw token for secure DB storage.
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Calculate invitation expiry date (now + INVITE_EXPIRY_HOURS).
 */
export function getInviteExpiry(): Date {
  const d = new Date();
  d.setHours(d.getHours() + INVITE_EXPIRY_HOURS);
  return d;
}

/**
 * Build the full invite URL given a raw token and base URL.
 */
export function buildInviteUrl(token: string, baseUrl: string): string {
  return `${baseUrl}/invite?token=${token}`;
}
