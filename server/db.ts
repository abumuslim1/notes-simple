import { and, desc, eq, like, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, folders, notes, noteVersions, noteFiles, noteTags, licenses, taskBoardColumns, tasks, taskFiles, InsertFolder, InsertNote, InsertNoteVersion, InsertNoteFile, InsertNoteTag, InsertTaskBoardColumn, InsertTask, InsertTaskFile } from "../drizzle/schema";
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
  return result[0].insertId;
}

export async function getUserByUsername(username: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.query.users.findFirst({
    where: (u, { eq }) => eq(u.username, username),
  });
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.query.users.findFirst({
    where: (u, { eq }) => eq(u.id, id),
  });
}

export async function updateUser(id: number, data: Partial<{ name: string; email: string; role: "user" | "admin" }>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(users).set(data).where(eq(users.id, id));
}

export async function updateUserPassword(id: number, passwordHash: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(users).set({ passwordHash }).where(eq(users.id, id));
}

export async function deleteUser(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(users).where(eq(users.id, id));
}

export async function getAllUsers() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.query.users.findMany();
}

export async function countUsers() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result: any = await db.select({ count: sql`COUNT(*)` }).from(users);
  return result[0].count;
}

// Folders
export async function createFolder(userId: number, name: string, color?: string): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result: any = await db.insert(folders).values({
    userId,
    name,
    color: color || "#3b82f6",
  });
  return result[0].insertId;
}

export async function getFoldersByUserId(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.query.folders.findMany({
    where: (f, { eq }) => eq(f.userId, userId),
  });
}

export async function updateFolder(id: number, data: Partial<{ name: string; color: string }>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(folders).set(data).where(eq(folders.id, id));
}

export async function deleteFolder(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(folders).where(eq(folders.id, id));
}

// Notes
export async function createNote(userId: number, folderId: number | null, title: string, content: string): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result: any = await db.insert(notes).values({
    userId,
    folderId,
    title,
    content,
    isFavorite: 0,
  });
  return result[0].insertId;
}

export async function getNotesByUserId(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.query.notes.findMany({
    where: (n, { eq }) => eq(n.userId, userId),
    orderBy: (n, { desc }) => desc(n.updatedAt),
  });
}

export async function getNotesByFolderId(folderId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.query.notes.findMany({
    where: (n, { eq }) => eq(n.folderId, folderId),
    orderBy: (n, { desc }) => desc(n.updatedAt),
  });
}

export async function getFavoriteNotes(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.query.notes.findMany({
    where: (n, { eq, and }) => and(eq(n.userId, userId), eq(n.isFavorite, 1)),
    orderBy: (n, { desc }) => desc(n.updatedAt),
  });
}

export async function getNoteById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.query.notes.findFirst({
    where: (n, { eq }) => eq(n.id, id),
  });
}

export async function updateNote(id: number, data: Partial<{ title: string; content: string; isFavorite: number }>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(notes).set(data).where(eq(notes.id, id));
}

export async function deleteNote(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(notes).where(eq(notes.id, id));
}

export async function toggleNoteFavorite(id: number, isFavorite: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(notes).set({ isFavorite }).where(eq(notes.id, id));
}

// Note Files
export async function createNoteFile(noteId: number, fileName: string, fileKey: string, fileUrl: string, fileSize: number, mimeType?: string): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result: any = await db.insert(noteFiles).values({
    noteId,
    fileName,
    fileKey,
    fileUrl,
    fileSize,
    mimeType,
  });
  return result[0].insertId;
}

export async function getNoteFilesByNoteId(noteId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.query.noteFiles.findMany({
    where: (f, { eq }) => eq(f.noteId, noteId),
  });
}

export async function deleteNoteFile(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(noteFiles).where(eq(noteFiles.id, id));
}

// Note Versions
export async function createNoteVersion(noteId: number, content: string, title: string): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result: any = await db.insert(noteVersions).values({
    noteId,
    content,
    title,
  });
  return result[0].insertId;
}

export async function getNoteVersions(noteId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.query.noteVersions.findMany({
    where: (v, { eq }) => eq(v.noteId, noteId),
    orderBy: (v, { desc }) => desc(v.createdAt),
  });
}

// Licenses
export async function getLicense() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.query.licenses.findFirst();
}

export async function createLicense(serverId: string, ownerName: string): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result: any = await db.insert(licenses).values({
    serverId,
    ownerName,
    isActive: 1,
    allowPublicRegistration: 0,
  });
  return result[0].insertId;
}

export async function updateLicense(id: number, data: Partial<{ allowPublicRegistration: number; isActive: number }>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(licenses).set(data).where(eq(licenses.id, id));
}

// Task Board Functions
export async function createTaskBoardColumn(data: {
  userId: number;
  name: string;
  color: string;
  position: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result: any = await db.insert(taskBoardColumns).values(data);
  return result[0].insertId;
}

export async function getTaskBoardColumnsByUserId(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.query.taskBoardColumns.findMany({
    where: (columns, { eq }) => eq(columns.userId, userId),
    orderBy: (columns, { asc }) => asc(columns.position),
  });
}

export async function updateTaskBoardColumn(
  id: number,
  data: Partial<{ name: string; color: string }>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(taskBoardColumns).set(data).where(eq(taskBoardColumns.id, id));
}

export async function deleteTaskBoardColumn(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(taskBoardColumns).where(eq(taskBoardColumns.id, id));
}

// Task Functions
export async function createTask(data: {
  userId: number;
  columnId: number;
  title: string;
  description?: string;
  assignedToUserId?: number;
  dueDate?: Date;
  position: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result: any = await db.insert(tasks).values(data);
  return result[0].insertId;
}

export async function getTasksByColumnId(columnId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.query.tasks.findMany({
    where: (t, { eq }) => eq(t.columnId, columnId),
    orderBy: (t, { asc }) => asc(t.position),
  });
}

export async function getTaskById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.query.tasks.findFirst({
    where: (t, { eq }) => eq(t.id, id),
  });
}

export async function updateTask(
  id: number,
  data: Partial<{
    title: string;
    description: string;
    assignedToUserId: number;
    dueDate: Date;
  }>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(tasks).set(data).where(eq(tasks.id, id));
}

export async function deleteTask(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(tasks).where(eq(tasks.id, id));
}

export async function moveTask(taskId: number, columnId: number, position: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db
    .update(tasks)
    .set({ columnId, position })
    .where(eq(tasks.id, taskId));
}

// Task File Functions
export async function createTaskFile(data: {
  taskId: number;
  fileName: string;
  fileKey: string;
  fileUrl: string;
  fileSize: number;
  mimeType?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result: any = await db.insert(taskFiles).values(data);
  return result[0].insertId;
}

export async function getTaskFilesByTaskId(taskId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.query.taskFiles.findMany({
    where: (f, { eq }) => eq(f.taskId, taskId),
  });
}

export async function deleteTaskFile(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(taskFiles).where(eq(taskFiles.id, id));
}

export async function getLicenseSettings() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.query.licenses.findFirst();
}

export async function updateLicenseSettings(id: number, data: Partial<{ allowPublicRegistration: number }>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(licenses).set(data).where(eq(licenses.id, id));
}

export async function searchNotes(userId: number, query: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.query.notes.findMany({
    where: (n, { and, eq, or, like }) => and(
      eq(n.userId, userId),
      or(
        like(n.title, `%${query}%`),
        like(n.content, `%${query}%`)
      )
    ),
    orderBy: (n, { desc }) => [desc(n.updatedAt)],
  });
}

export async function getSearchSuggestions(userId: number, query: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.query.notes.findMany({
    where: (n, { and, eq, like }) => and(
      eq(n.userId, userId),
      like(n.title, `%${query}%`)
    ),
    orderBy: (n, { desc }) => [desc(n.updatedAt)],
    limit: 5,
  });
}

export async function getNoteTags(noteId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.query.noteTags.findMany({
    where: (t, { eq }) => eq(t.noteId, noteId),
  });
}

export async function getNoteFiles(noteId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.query.noteFiles.findMany({
    where: (f, { eq }) => eq(f.noteId, noteId),
  });
}

export async function createNoteTags(noteId: number, tags: string[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const values = tags.map(tag => ({ noteId, tag }));
  if (values.length > 0) {
    await db.insert(noteTags).values(values);
  }
}

export async function deleteNoteTags(noteId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(noteTags).where(eq(noteTags.noteId, noteId));
}

export async function updateUserLastSignedIn(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(users).set({ lastSignedIn: new Date() }).where(eq(users.id, id));
}

export async function updateUserRole(id: number, role: 'admin' | 'user') {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(users).set({ role }).where(eq(users.id, id));
}
