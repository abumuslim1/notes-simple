import { and, desc, eq, like, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, folders, notes, noteVersions, noteFiles, noteTags, licenses, InsertFolder, InsertNote, InsertNoteVersion, InsertNoteFile, InsertNoteTag } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// User authentication
export async function createUser(username: string, passwordHash: string, name: string, email?: string, role: "user" | "admin" = "user"): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result: any = await db.insert(users).values({
    username,
    passwordHash,
    name,
    email,
    role,
  });

  const insertId = result[0]?.insertId || result.insertId;
  return Number(insertId);
}

export async function getUserByUsername(username: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateUserLastSignedIn(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set({ lastSignedIn: new Date() }).where(eq(users.id, userId));
}

// User management
export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).orderBy(desc(users.createdAt));
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result[0];
}

export async function updateUser(userId: number, data: Partial<{ name: string; email: string; role: "user" | "admin" }>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set(data).where(eq(users.id, userId));
}

export async function updateUserRole(userId: number, role: "user" | "admin") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set({ role }).where(eq(users.id, userId));
}

export async function deleteUser(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(users).where(eq(users.id, userId));
}

// Folders
export async function createFolder(folder: InsertFolder) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result: any = await db.insert(folders).values(folder);
  const insertId = result[0]?.insertId || result.insertId;
  return Number(insertId);
}

export async function getFoldersByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(folders).where(eq(folders.userId, userId)).orderBy(desc(folders.createdAt));
}

export async function updateFolder(folderId: number, name: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(folders).set({ name }).where(eq(folders.id, folderId));
}

export async function deleteFolder(folderId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(folders).where(eq(folders.id, folderId));
}

// Notes
export async function createNote(note: InsertNote) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result: any = await db.insert(notes).values(note);
  const insertId = result[0]?.insertId || result.insertId;
  return Number(insertId);
}

export async function getNotesByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(notes).where(eq(notes.userId, userId)).orderBy(desc(notes.updatedAt));
}

export async function getNoteById(noteId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(notes).where(eq(notes.id, noteId)).limit(1);
  return result[0];
}

export async function updateNote(noteId: number, data: Partial<InsertNote>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(notes).set(data).where(eq(notes.id, noteId));
}

export async function deleteNote(noteId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(notes).where(eq(notes.id, noteId));
}

export async function toggleNoteFavorite(noteId: number, isFavorite: boolean) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(notes).set({ isFavorite }).where(eq(notes.id, noteId));
}

export async function getFavoriteNotes(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(notes).where(and(eq(notes.userId, userId), eq(notes.isFavorite, true))).orderBy(desc(notes.updatedAt));
}

// Note versions
export async function createNoteVersion(version: InsertNoteVersion) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(noteVersions).values(version);
}

export async function getNoteVersions(noteId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(noteVersions).where(eq(noteVersions.noteId, noteId)).orderBy(desc(noteVersions.createdAt));
}

// Note files
export async function createNoteFile(file: InsertNoteFile) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result: any = await db.insert(noteFiles).values(file);
  // Drizzle returns insertId directly in the result
  const insertId = result?.insertId || result[0]?.insertId;
  if (!insertId) throw new Error("Failed to get file ID from insert");
  return Number(insertId);
}

export async function getNoteFiles(noteId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(noteFiles).where(eq(noteFiles.noteId, noteId)).orderBy(desc(noteFiles.createdAt));
}

export async function deleteNoteFile(fileId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(noteFiles).where(eq(noteFiles.id, fileId));
}

// Note tags
export async function createNoteTags(noteId: number, tags: string[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (tags.length === 0) return;
  const values = tags.map(tag => ({ noteId, tag }));
  await db.insert(noteTags).values(values);
}

export async function getNoteTags(noteId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(noteTags).where(eq(noteTags.noteId, noteId));
}

export async function deleteNoteTags(noteId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(noteTags).where(eq(noteTags.noteId, noteId));
}

// Search
export async function searchNotes(userId: number, query: string) {
  const db = await getDb();
  if (!db) return [];
  
  const searchPattern = `%${query}%`;
  
  // Search in notes by title and content
  const noteResults = await db
    .select()
    .from(notes)
    .where(
      and(
        eq(notes.userId, userId),
        or(
          like(notes.title, searchPattern),
          like(notes.content, searchPattern)
        )
      )
    )
    .orderBy(desc(notes.updatedAt));
  
  // Search by tags
  const tagResults = await db
    .select({
      id: notes.id,
      title: notes.title,
      content: notes.content,
      userId: notes.userId,
      folderId: notes.folderId,
      passwordHash: notes.passwordHash,
      isFavorite: notes.isFavorite,
      createdAt: notes.createdAt,
      updatedAt: notes.updatedAt,
    })
    .from(noteTags)
    .innerJoin(notes, eq(noteTags.noteId, notes.id))
    .where(
      and(
        eq(notes.userId, userId),
        like(noteTags.tag, searchPattern)
      )
    )
    .orderBy(desc(notes.updatedAt));
  
  // Combine and deduplicate results
  const allResults = [...noteResults, ...tagResults];
  const uniqueResults = Array.from(new Map(allResults.map(note => [note.id, note])).values());
  
  return uniqueResults;
}

export async function getSearchSuggestions(userId: number, query: string, limit: number = 5) {
  const db = await getDb();
  if (!db) return [];
  
  const searchPattern = `%${query}%`;
  
  return db
    .select({
      id: notes.id,
      title: notes.title,
    })
    .from(notes)
    .where(
      and(
        eq(notes.userId, userId),
        like(notes.title, searchPattern)
      )
    )
    .orderBy(desc(notes.updatedAt))
    .limit(limit);
}


// License settings
export async function getLicenseSettings() {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(licenses).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function updateLicenseSettings(data: Partial<{ allowPublicRegistration: number }>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const license = await getLicenseSettings();
  if (license) {
    await db.update(licenses).set(data).where(eq(licenses.id, license.id));
  }
}
