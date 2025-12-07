import { and, desc, eq, like, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, folders, notes, noteVersions, noteFiles, noteTags, licenses, taskBoardColumns, tasks, taskFiles, taskTags, InsertFolder, InsertNote, InsertNoteVersion, InsertNoteFile, InsertNoteTag, InsertTaskBoardColumn, InsertTask, InsertTaskFile, InsertTaskTag } from "../drizzle/schema";
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
  return db.select().from(users).where(eq(users.username, username)).then(r => r[0] || null);
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(users).where(eq(users.id, id)).then(r => r[0] || null);
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
  return db.select().from(users);
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
  });
  return result[0].insertId;
}

export async function getFoldersByUserId(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(folders).where(eq(folders.userId, userId));
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
    isFavorite: false,
  });
  return result[0].insertId;
}

export async function getNotesByUserId(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(notes).where(eq(notes.userId, userId)).orderBy(desc(notes.updatedAt));
}

export async function getNotesByFolderId(folderId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(notes).where(eq(notes.folderId, folderId)).orderBy(desc(notes.updatedAt));
}

export async function getFavoriteNotes(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(notes).where(
    and(eq(notes.userId, userId), eq(notes.isFavorite, true))
  ).orderBy(desc(notes.updatedAt));
}

export async function getNoteById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(notes).where(eq(notes.id, id)).then(r => r[0] || null);
}

export async function updateNote(id: number, data: Partial<{ title: string; content: string; isFavorite: number }>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const updateData: any = {};
  if (data.title !== undefined) updateData.title = data.title;
  if (data.content !== undefined) updateData.content = data.content;
  if (data.isFavorite !== undefined) updateData.isFavorite = Boolean(data.isFavorite);
  return db.update(notes).set(updateData).where(eq(notes.id, id));
}

export async function deleteNote(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(notes).where(eq(notes.id, id));
}

export async function toggleNoteFavorite(id: number, isFavorite: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(notes).set({ isFavorite: Boolean(isFavorite) }).where(eq(notes.id, id));
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
  return db.select().from(noteFiles).where(eq(noteFiles.noteId, noteId));
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
  return db.select().from(noteVersions).where(eq(noteVersions.noteId, noteId)).orderBy(desc(noteVersions.createdAt));
}

// Licenses
export async function getLicense() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(licenses).limit(1).then(r => r[0] || null);
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
  return db.select().from(taskBoardColumns).where(eq(taskBoardColumns.userId, userId)).orderBy(taskBoardColumns.position);
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
  priority?: "low" | "medium" | "high";
  assignedToUserId?: number;
  dueDate?: Date;
  position: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result: any = await db.insert(tasks).values({
    ...data,
    priority: data.priority || "medium",
  });
  return result[0].insertId;
}

export async function getTasksByColumnId(columnId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const taskList = await db.select().from(tasks).where(eq(tasks.columnId, columnId)).orderBy(tasks.position);
  
  // Fetch tags for each task
  const result = await Promise.all(
    taskList.map(async (task) => {
      const tags = await db.select().from(taskTags).where(eq(taskTags.taskId, task.id));
      return {
        ...task,
        tags: tags.map(t => t.tag),
      };
    })
  );
  return result;
}

export async function getTaskById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const task = await db.select().from(tasks).where(eq(tasks.id, id)).then(r => r[0] || null);
  
  if (!task) return null;
  
  // Fetch tags for this task
  const tags = await db.select().from(taskTags).where(eq(taskTags.taskId, id));
  return {
    ...task,
    tags: tags.map(t => t.tag),
  };
}

export async function addTaskTag(taskId: number, tag: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(taskTags).values({ taskId, tag });
}

export async function updateTask(
  id: number,
  data: Partial<{
    title: string;
    description: string;
    priority: "low" | "medium" | "high";
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

// Task Files
export async function createTaskFile(taskId: number, fileName: string, fileKey: string, fileUrl: string, fileSize: number, mimeType?: string): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result: any = await db.insert(taskFiles).values({
    taskId,
    fileName,
    fileKey,
    fileUrl,
    fileSize,
    mimeType,
  });
  return result[0].insertId;
}

export async function getTaskFilesByTaskId(taskId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(taskFiles).where(eq(taskFiles.taskId, taskId));
}

export async function deleteTaskFile(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(taskFiles).where(eq(taskFiles.id, id));
}

export async function getLicenseSettings() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select().from(licenses).limit(1);
  return result[0] || null;
}

export async function updateLicenseSettings(id: number, data: Partial<{ allowPublicRegistration: number }>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(licenses).set(data).where(eq(licenses.id, id));
}

export async function searchNotes(userId: number, query: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(notes).where(
    and(
      eq(notes.userId, userId),
      or(
        like(notes.title, `%${query}%`),
        like(notes.content, `%${query}%`)
      )
    )
  ).orderBy(desc(notes.updatedAt));
}

export async function getSearchSuggestions(userId: number, query: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(notes).where(
    and(
      eq(notes.userId, userId),
      like(notes.title, `%${query}%`)
    )
  ).orderBy(desc(notes.updatedAt)).limit(5);
}

export async function getNoteTags(noteId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(noteTags).where(eq(noteTags.noteId, noteId));
}

export async function getNoteFiles(noteId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(noteFiles).where(eq(noteFiles.noteId, noteId));
}

export async function createNoteTags(noteId: number, tags: string[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const values = tags.map(tag => ({ noteId, tag }));
  const result: any = await db.insert(noteTags).values(values);
  return result[0].insertId;
}

export async function deleteNoteTags(noteId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(noteTags).where(eq(noteTags.noteId, noteId));
}

export async function updateUserLastSignedIn(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(users).set({ lastSignedIn: new Date() }).where(eq(users.id, userId));
}

export async function updateUserRole(userId: number, role: "user" | "admin") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(users).set({ role }).where(eq(users.id, userId));
}

export async function getOrCreateServerLicense(serverId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  let license = await db.select().from(licenses).where(eq(licenses.serverId, serverId)).then(r => r[0] || null);
  
  if (!license) {
    const result: any = await db.insert(licenses).values({
      serverId,
      ownerName: "Administrator",
      isActive: 1,
      allowPublicRegistration: 0,
    });
    const id = result[0].insertId;
    license = await db.select().from(licenses).where(eq(licenses.id, id)).then(r => r[0] || null);
  }
  
  return license;
}

export async function getLicenseInfo() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Get or create server license
  const serverId = process.env.VITE_APP_ID || "default-server";
  return getOrCreateServerLicense(serverId);
}

export async function moveTask(taskId: number, columnId: number, position: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(tasks).set({ columnId, position }).where(eq(tasks.id, taskId));
}

export async function updateNotePassword(id: number, passwordHash: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(notes).set({ passwordHash }).where(eq(notes.id, id));
}
