import { eq, and, gt } from "drizzle-orm";
import { licenses, licenseKeys, License, LicenseKey } from "../drizzle/schema";
import { getDb } from "./db";
import { nanoid } from "nanoid";

/**
 * Generate a unique server ID
 */
export function generateServerId(): string {
  return nanoid(16).toUpperCase();
}

/**
 * Get or create license for this server
 */
export async function getOrCreateServerLicense(): Promise<License> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Try to find existing license
  const existing = await db.select().from(licenses).limit(1);
  
  if (existing.length > 0) {
    return existing[0];
  }

  // Create new license
  const serverId = generateServerId();
  const result = await db.insert(licenses).values({
    serverId,
    isActive: 0,
  });

  const newLicense = await db
    .select()
    .from(licenses)
    .where(eq(licenses.serverId, serverId))
    .limit(1);

  if (!newLicense.length) throw new Error("Failed to create license");
  return newLicense[0];
}

/**
 * Get server license info
 */
export async function getServerLicense(): Promise<License | null> {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(licenses).limit(1);
  return result.length > 0 ? result[0] : null;
}

/**
 * Check if license is valid and active
 */
export async function isLicenseValid(): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  const license = await getServerLicense();
  if (!license) return false;

  // Check if license is active and not expired
  if (license.isActive === 0) return false;
  if (!license.expiresAt) return false;

  const now = new Date();
  return license.expiresAt > now;
}

/**
 * Check trial period (10 days)
 */
export async function isTrialValid(): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  const license = await getServerLicense();
  if (!license) return false;

  // If license is active, trial doesn't matter
  if (license.isActive === 1) return true;

  // Check if trial period (10 days) is still valid
  const now = new Date();
  const trialEnd = new Date(license.trialStartedAt);
  trialEnd.setDate(trialEnd.getDate() + 10);

  return now < trialEnd;
}

/**
 * Get days remaining in trial
 */
export async function getTrialDaysRemaining(): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  const license = await getServerLicense();
  if (!license) return 0;

  // If license is active, no trial
  if (license.isActive === 1) return 0;

  const now = new Date();
  const trialEnd = new Date(license.trialStartedAt);
  trialEnd.setDate(trialEnd.getDate() + 10);

  const daysRemaining = Math.ceil(
    (trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );

  return Math.max(0, daysRemaining);
}

/**
 * Activate license with key
 */
export async function activateLicense(licenseKey: string): Promise<{
  success: boolean;
  message: string;
  ownerName?: string;
  expiresAt?: Date;
}> {
  const db = await getDb();
  if (!db)
    return { success: false, message: "Database not available" };

  try {
    // Find the license key
    const keyRecord = await db
      .select()
      .from(licenseKeys)
      .where(eq(licenseKeys.key, licenseKey))
      .limit(1);

    if (!keyRecord.length) {
      return { success: false, message: "Invalid license key" };
    }

    const key = keyRecord[0];

    // Check if key is expired
    const now = new Date();
    if (key.expiresAt < now) {
      return { success: false, message: "License key has expired" };
    }

    // Get server license
    const serverLicense = await getServerLicense();
    if (!serverLicense) {
      return { success: false, message: "Server license not found" };
    }

    // Update server license
    await db
      .update(licenses)
      .set({
        isActive: 1,
        ownerName: key.ownerName,
        expiresAt: key.expiresAt,
        updatedAt: new Date(),
      })
      .where(eq(licenses.id, serverLicense.id));

    return {
      success: true,
      message: "License activated successfully",
      ownerName: key.ownerName,
      expiresAt: key.expiresAt,
    };
  } catch (error) {
    console.error("Error activating license:", error);
    return { success: false, message: "Error activating license" };
  }
}

/**
 * Get license info
 */
export async function getLicenseInfo(): Promise<{
  serverId: string;
  isActive: boolean;
  ownerName?: string | null;
  expiresAt?: Date | null;
  trialDaysRemaining: number;
  isBlocked: boolean;
}> {
  // Get or create license if it doesn't exist
  const license = await getOrCreateServerLicense();

  const trialValid = await isTrialValid();
  const licenseValid = await isLicenseValid();
  const trialDays = await getTrialDaysRemaining();

  const isBlocked = !trialValid && !licenseValid;

  return {
    serverId: license.serverId,
    isActive: license.isActive === 1,
    ownerName: license.ownerName,
    expiresAt: license.expiresAt,
    trialDaysRemaining: license.isActive === 1 ? 0 : trialDays,
    isBlocked,
  };
}
