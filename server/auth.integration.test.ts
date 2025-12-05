import { describe, it, expect, beforeAll } from "vitest";
import * as db from "./db";
import { hashPassword, verifyPassword } from "./_core/password";

describe("Authentication Integration", () => {
  const testUsername = `testuser_${Date.now()}`;
  const testPassword = "testPassword123";
  const testName = "Test User";
  let userId: number;

  beforeAll(async () => {
    // Clean up any existing test user
    const existing = await db.getUserByUsername(testUsername);
    if (existing) {
      console.log("Test user already exists, skipping creation");
      userId = existing.id;
    }
  });

  it("should create a user with hashed password", async () => {
    const passwordHash = await hashPassword(testPassword);
    const createdUserId = await db.createUser(testUsername, passwordHash, testName);
    
    expect(createdUserId).toBeDefined();
    expect(createdUserId).toBeGreaterThan(0);
    userId = createdUserId;
  });

  it("should retrieve user by username", async () => {
    const user = await db.getUserByUsername(testUsername);
    
    expect(user).toBeDefined();
    expect(user?.username).toBe(testUsername);
    expect(user?.name).toBe(testName);
    expect(user?.passwordHash).toBeDefined();
    expect(user?.passwordHash).not.toBe(testPassword);
  });

  it("should verify correct password", async () => {
    const user = await db.getUserByUsername(testUsername);
    expect(user).toBeDefined();
    
    if (user) {
      const isValid = await verifyPassword(testPassword, user.passwordHash);
      expect(isValid).toBe(true);
    }
  });

  it("should reject incorrect password", async () => {
    const user = await db.getUserByUsername(testUsername);
    expect(user).toBeDefined();
    
    if (user) {
      const isValid = await verifyPassword("wrongPassword", user.passwordHash);
      expect(isValid).toBe(false);
    }
  });

  it("should get user by id", async () => {
    const user = await db.getUserById(userId);
    
    expect(user).toBeDefined();
    expect(user?.id).toBe(userId);
    expect(user?.username).toBe(testUsername);
  });
});
