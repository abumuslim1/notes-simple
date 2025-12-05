import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  generateServerId,
  getOrCreateServerLicense,
  getServerLicense,
  isLicenseValid,
  isTrialValid,
  getTrialDaysRemaining,
  activateLicense,
  getLicenseInfo,
} from "./license";
import { getDb } from "./db";
import { licenses, licenseKeys } from "../drizzle/schema";
import { eq } from "drizzle-orm";

describe("License System", () => {
  let db: any;

  beforeAll(async () => {
    db = await getDb();
  });

  afterAll(async () => {
    // Cleanup
    if (db) {
      await db.delete(licenseKeys);
      await db.delete(licenses);
    }
  });

  it("should generate a unique server ID", () => {
    const id1 = generateServerId();
    const id2 = generateServerId();

    expect(id1).toBeTruthy();
    expect(id2).toBeTruthy();
    expect(id1).not.toBe(id2);
    expect(id1.length).toBe(16);
    expect(id2.length).toBe(16);
  });

  it("should create or get server license", async () => {
    const license = await getOrCreateServerLicense();

    expect(license).toBeTruthy();
    expect(license.serverId).toBeTruthy();
    expect(license.isActive).toBe(0);
  });

  it("should get server license", async () => {
    const license = await getServerLicense();

    expect(license).toBeTruthy();
    expect(license?.serverId).toBeTruthy();
  });

  it("should have valid trial period initially", async () => {
    const isValid = await isTrialValid();
    expect(isValid).toBe(true);
  });

  it("should return correct trial days remaining", async () => {
    const days = await getTrialDaysRemaining();

    expect(days).toBeGreaterThan(0);
    expect(days).toBeLessThanOrEqual(10);
  });

  it("should not be valid without active license", async () => {
    const isValid = await isLicenseValid();
    expect(isValid).toBe(false);
  });

  it("should get license info", async () => {
    const info = await getLicenseInfo();

    expect(info).toBeTruthy();
    expect(info.serverId).toBeTruthy();
    expect(info.isActive).toBe(false);
    expect(info.trialDaysRemaining).toBeGreaterThan(0);
    expect(info.isBlocked).toBe(false);
  });

  it("should reject invalid license key", async () => {
    const result = await activateLicense("invalid-key");

    expect(result.success).toBe(false);
    expect(result.message).toContain("Invalid");
  });

  it("should activate valid license key", async () => {
    const license = await getServerLicense();
    if (!license) throw new Error("License not found");

    // Create a valid license key
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 365);

    const keyResult = await db.insert(licenseKeys).values({
      licenseId: license.id,
      key: "TEST-KEY-" + Date.now(),
      ownerName: "Test Owner",
      expiresAt,
    });

    const keys = await db
      .select()
      .from(licenseKeys)
      .where(eq(licenseKeys.licenseId, license.id));

    if (keys.length === 0) throw new Error("Key not created");

    const testKey = keys[0];

    // Activate with the key
    const result = await activateLicense(testKey.key);

    expect(result.success).toBe(true);
    expect(result.ownerName).toBe("Test Owner");
    expect(result.expiresAt).toBeTruthy();
  });

  it("should show license as active after activation", async () => {
    const info = await getLicenseInfo();

    expect(info.isActive).toBe(true);
    expect(info.ownerName).toBe("Test Owner");
  });

  it("should validate active license", async () => {
    const isValid = await isLicenseValid();
    expect(isValid).toBe(true);
  });
});
