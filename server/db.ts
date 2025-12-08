import { and, desc, eq, like, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, folders, notes, noteVersions, noteFiles, noteTags, licenses, taskBoardColumns, tasks, taskFiles, taskTags, taskComments, taskCommentFiles, taskBoardColumnsArchive, InsertFolder, InsertNote, InsertNoteVersion, InsertNoteFile, InsertNoteTag, InsertTaskBoardColumn, InsertTask, InsertTaskFile, InsertTaskTag, InsertTaskComment, InsertTaskCommentFile, InsertTaskBoardColumnArchive } from "../drizzle/schema";
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

// Folders
export async function createFolder(userId: number, name: string): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result: any = await db.insert(folders).values({ userId, name });
  return result[0].insertId;
}

export async function getFolders(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(folders).where(eq(folders.userId, userId));
}

export async function updateFolder(id: number, name: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(folders).set({ name }).where(eq(folders.id, id));
}

export async function deleteFolder(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(folders).where(eq(folders.id, id));
}

// Notes
export async function createNote(userId: number, title: string, content: string, folderId?: number): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result: any = await db.insert(notes).values({
    userId,
    title,
    content,
    folderId: folderId || null,
  });
  return result[0].insertId;
}

export async function getNoteById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(notes).where(eq(notes.id, id)).then(r => r[0] || null);
}

export async function getNotesByFolder(userId: number, folderId?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  if (folderId) {
    return db.select().from(notes).where(and(eq(notes.userId, userId), eq(notes.folderId, folderId)));
  }
  return db.select().from(notes).where(eq(notes.userId, userId));
}

export async function updateNote(id: number, data: Partial<{ title: string; content: string; folderId: number | null; passwordHash: string | null }>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(notes).set(data).where(eq(notes.id, id));
}

export async function deleteNote(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(notes).where(eq(notes.id, id));
}

// Note versions
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
  return db.select().from(noteVersions).where(eq(noteVersions.noteId, noteId));
}

// Note files
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

export async function getNoteFiles(noteId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(noteFiles).where(eq(noteFiles.noteId, noteId));
}

export async function deleteNoteFile(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(noteFiles).where(eq(noteFiles.id, id));
}

// Note tags
export async function createNoteTags(noteId: number, tags: string[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(noteTags).values(tags.map(tag => ({ noteId, tag })));
}

export async function getNoteTags(noteId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select({ tag: noteTags.tag }).from(noteTags).where(eq(noteTags.noteId, noteId));
}

export async function deleteNoteTag(noteId: number, tag: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(noteTags).where(and(eq(noteTags.noteId, noteId), eq(noteTags.tag, tag)));
}

// Licenses
export async function createLicense(serverId: string, ownerName?: string): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result: any = await db.insert(licenses).values({
    serverId,
    ownerName,
    isActive: 1,
  });
  return result[0].insertId;
}

export async function getLicenseByServerId(serverId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(licenses).where(eq(licenses.serverId, serverId)).then(r => r[0] || null);
}

export async function updateLicense(id: number, data: Partial<{ ownerName: string; expiresAt: Date; isActive: number; allowPublicRegistration: number }>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(licenses).set(data).where(eq(licenses.id, id));
}

// License keys
export async function createLicenseKey(licenseId: number, key: string, ownerName: string, expiresAt: Date): Promise<number> {
  // This function is not used - license keys are stored in the licenses table
  // Placeholder for compatibility
  return 1;
}

// Task board columns
export async function createTaskBoardColumn(data: InsertTaskBoardColumn): Promise<number> {
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

export async function updateTaskBoardColumn(id: number, data: Partial<{ name: string; color: string; position: number }>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(taskBoardColumns).set(data).where(eq(taskBoardColumns.id, id));
}

export async function deleteTaskBoardColumn(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(taskBoardColumns).where(eq(taskBoardColumns.id, id));
}

// Tasks
export async function createTask(data: InsertTask): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result: any = await db.insert(tasks).values(data);
  return result[0].insertId;
}

export async function getTaskById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const task = await db.select().from(tasks).where(eq(tasks.id, id)).then(r => r[0] || null);
  if (!task) return null;
  
  const assignee = task.assignedToUserId ? await getUserById(task.assignedToUserId) : null;
  const files = await getTaskFiles(id);
  
  return {
    ...task,
    assignee,
    attachments: files,
  };
}

export async function getTasksByColumn(columnId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(tasks).where(eq(tasks.columnId, columnId)).orderBy(tasks.position);
}

export async function updateTask(id: number, data: Partial<{ title: string; description: string; priority: "low" | "medium" | "high"; assignedToUserId: number | null; dueDate: Date | null; columnId: number }>) {
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
  return db.update(tasks).set({ columnId, position }).where(eq(tasks.id, taskId));
}

// Task files
export async function createTaskFile(data: InsertTaskFile): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result: any = await db.insert(taskFiles).values(data);
  return result[0].insertId;
}

export async function getTaskFiles(taskId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const files = await db.select().from(taskFiles).where(eq(taskFiles.taskId, taskId));
  return files.map(f => ({
    id: f.id,
    name: f.fileName,
    url: f.fileUrl,
    size: f.fileSize,
    mimeType: f.mimeType,
    createdAt: f.createdAt,
  }));
}

export async function addTaskFile(data: { taskId: number; fileName: string; fileKey: string; fileUrl: string; fileSize: number; mimeType: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result: any = await db.insert(taskFiles).values({
    taskId: data.taskId,
    fileName: data.fileName,
    fileKey: data.fileKey,
    fileUrl: data.fileUrl,
    fileSize: data.fileSize,
    mimeType: data.mimeType,
  });
  return result[0].insertId;
}

export async function deleteTaskFile(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(taskFiles).where(eq(taskFiles.id, id));
}

// Task tags
export async function addTaskTag(taskId: number, tag: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(taskTags).values({ taskId, tag });
}

export async function getTaskTags(taskId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select({ tag: taskTags.tag }).from(taskTags).where(eq(taskTags.taskId, taskId));
}

export async function deleteTaskTag(taskId: number, tag: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(taskTags).where(and(eq(taskTags.taskId, taskId), eq(taskTags.tag, tag)));
}


// Task comments
export async function getTaskComments(taskId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const comments = await db.select().from(taskComments).where(eq(taskComments.taskId, taskId)).orderBy(desc(taskComments.createdAt));
  
  // Enrich comments with user information
  const enrichedComments = await Promise.all(
    comments.map(async (comment) => {
      const user = await getUserById(comment.userId);
      return {
        ...comment,
        author: user ? { id: user.id, name: user.name, username: user.username } : null,
      };
    })
  );
  
  return enrichedComments;
}

export async function createTaskComment(data: { taskId: number; userId: number; content: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result: any = await db.insert(taskComments).values(data);
  const commentId = result[0].insertId;
  
  // Fetch the created comment with author info
  const comment = await db.select().from(taskComments).where(eq(taskComments.id, commentId)).then(r => r[0]);
  if (!comment) throw new Error("Failed to create comment");
  
  const author = await getUserById(comment.userId);
  return {
    ...comment,
    author: author ? { id: author.id, name: author.name, username: author.username } : null,
  };
}

export async function deleteTaskComment(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(taskComments).where(eq(taskComments.id, id));
  return true;
}

// Column archive status
export async function updateColumnArchiveStatus(columnId: number, isArchived: boolean) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const archivedAt = isArchived ? new Date() : null;
  const existing = await db.select().from(taskBoardColumnsArchive).where(eq(taskBoardColumnsArchive.columnId, columnId)).then(r => r[0]);
  
  if (existing) {
    await db.update(taskBoardColumnsArchive).set({ isArchived, archivedAt }).where(eq(taskBoardColumnsArchive.columnId, columnId));
  } else {
    await db.insert(taskBoardColumnsArchive).values({ columnId, isArchived, archivedAt });
  }
  return true;
}

export async function getArchivedColumns(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(taskBoardColumnsArchive).where(eq(taskBoardColumnsArchive.isArchived, true));
}

// Search
export async function searchNotes(userId: number, query: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const searchPattern = `%${query}%`;
  return db.select().from(notes).where(
    and(
      eq(notes.userId, userId),
      or(
        like(notes.title, searchPattern),
        like(notes.content, searchPattern)
      )
    )
  );
}

export async function getSearchSuggestions(userId: number, query: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const searchPattern = `%${query}%`;
  const results = await db.select({ title: notes.title }).from(notes).where(
    and(
      eq(notes.userId, userId),
      like(notes.title, searchPattern)
    )
  ).limit(5);
  return results.map(r => r.title);
}

export async function updateNotePassword(id: number, passwordHash: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(notes).set({ passwordHash }).where(eq(notes.id, id));
}


// Favorites
export async function getFavoriteNotes(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(notes).where(and(eq(notes.userId, userId), eq(notes.isFavorite, true)));
}

// License settings
export async function getLicenseSettings(licenseId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(licenses).where(eq(licenses.id, licenseId)).then(r => r[0] || null);
}

export async function updateLicenseSettings(licenseId: number, data: Partial<{ ownerName: string; expiresAt: Date; isActive: number; allowPublicRegistration: number }>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(licenses).set(data).where(eq(licenses.id, licenseId));
}


// Additional functions
export async function deleteNoteTags(noteId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(noteTags).where(eq(noteTags.noteId, noteId));
}

export async function toggleNoteFavorite(noteId: number, isFavorite: boolean) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(notes).set({ isFavorite: isFavorite ? true : false }).where(eq(notes.id, noteId));
}


// Additional user functions
export async function updateUserLastSignedIn(userId: number) {
  // Placeholder - not used in current implementation
  return true;
}


// Task comment files
export async function addCommentFile(data: { commentId: number; fileName: string; fileKey: string; fileUrl: string; fileSize: number; mimeType?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result: any = await db.insert(taskCommentFiles).values({
    commentId: data.commentId,
    fileName: data.fileName,
    fileKey: data.fileKey,
    fileUrl: data.fileUrl,
    fileSize: data.fileSize,
    mimeType: data.mimeType || null,
  });
  return result[0].insertId;
}

export async function getCommentFiles(commentId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const files = await db.select().from(taskCommentFiles).where(eq(taskCommentFiles.commentId, commentId));
  return files.map(f => ({
    id: f.id,
    name: f.fileName,
    url: f.fileUrl,
    size: f.fileSize,
    mimeType: f.mimeType,
    createdAt: f.createdAt,
  }));
}

export async function deleteCommentFile(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(taskCommentFiles).where(eq(taskCommentFiles.id, id));
  return true;
}
