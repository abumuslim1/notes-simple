import { createHash } from "crypto";

/**
 * Hash a password using SHA-256
 * In production, consider using bcrypt or argon2 for better security
 */
export async function hashPassword(password: string): Promise<string> {
  return createHash("sha256").update(password).digest("hex");
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  const passwordHash = await hashPassword(password);
  return passwordHash === hash;
}
