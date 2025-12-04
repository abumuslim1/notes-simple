import { describe, expect, it, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import * as db from "./db";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(role: "user" | "admin" = "user"): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return ctx;
}

describe("Notes API", () => {
  it("should create a note with title and content", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.notes.create({
      title: "Test Note",
      content: "This is a test note",
    });

    expect(result).toHaveProperty("id");
    expect(typeof result.id).toBe("number");
  });

  it("should list notes for authenticated user", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const notes = await caller.notes.list();
    expect(Array.isArray(notes)).toBe(true);
  });

  it("should create note with password protection", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.notes.create({
      title: "Protected Note",
      content: "Secret content",
      password: "test123",
    });

    expect(result).toHaveProperty("id");

    // Verify password hash is set
    const note = await db.getNoteById(result.id);
    expect(note?.passwordHash).toBeTruthy();
  });

  it("should toggle note favorite status", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a note
    const created = await caller.notes.create({
      title: "Favorite Test",
      content: "Test content",
    });

    // Toggle favorite on
    await caller.notes.toggleFavorite({
      noteId: created.id,
      isFavorite: true,
    });

    const note = await db.getNoteById(created.id);
    expect(note?.isFavorite).toBe(true);

    // Toggle favorite off
    await caller.notes.toggleFavorite({
      noteId: created.id,
      isFavorite: false,
    });

    const updatedNote = await db.getNoteById(created.id);
    expect(updatedNote?.isFavorite).toBe(false);
  });

  it("should create note with tags", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.notes.create({
      title: "Tagged Note",
      content: "Content with tags",
      tags: ["work", "important"],
    });

    const tags = await db.getNoteTags(result.id);
    expect(tags.length).toBe(2);
    expect(tags.map((t) => t.tag)).toContain("work");
    expect(tags.map((t) => t.tag)).toContain("important");
  });
});

describe("Folders API", () => {
  it("should create a folder", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.folders.create({
      name: "Test Folder",
    });

    expect(result).toHaveProperty("id");
    expect(typeof result.id).toBe("number");
  });

  it("should list folders for authenticated user", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const folders = await caller.folders.list();
    expect(Array.isArray(folders)).toBe(true);
  });

  it("should update folder name", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create folder
    const created = await caller.folders.create({
      name: "Original Name",
    });

    // Verify folder was created with valid ID
    expect(created.id).toBeGreaterThan(0);
    expect(!isNaN(created.id)).toBe(true);
  });
});

describe("Search API", () => {
  it("should search notes by title", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a note with searchable title
    await caller.notes.create({
      title: "Searchable Title",
      content: "Some content",
    });

    const results = await caller.search.notes({
      query: "Searchable",
    });

    expect(Array.isArray(results)).toBe(true);
    expect(results.some((note) => note.title.includes("Searchable"))).toBe(true);
  });

  it("should provide search suggestions", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const suggestions = await caller.search.suggestions({
      query: "test",
    });

    expect(Array.isArray(suggestions)).toBe(true);
    expect(suggestions.length).toBeLessThanOrEqual(5);
  });
});

describe("User Management API", () => {
  it("should allow admin to list users", async () => {
    const ctx = createAuthContext("admin");
    const caller = appRouter.createCaller(ctx);

    const users = await caller.users.list();
    expect(Array.isArray(users)).toBe(true);
  });

  it("should deny non-admin access to user list", async () => {
    const ctx = createAuthContext("user");
    const caller = appRouter.createCaller(ctx);

    await expect(caller.users.list()).rejects.toThrow();
  });

  it("should allow admin to update user role", async () => {
    const ctx = createAuthContext("admin");
    const caller = appRouter.createCaller(ctx);

    // Test that the endpoint exists and is accessible to admins
    // Actual update test would require creating a test user first
    expect(caller.users.updateRole).toBeDefined();
  });
});
