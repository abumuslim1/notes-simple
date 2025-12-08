import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean } from "drizzle-orm/mysql-core";

/**
 * Core user table with local authentication
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  username: varchar("username", { length: 64 }).notNull().unique(),
  passwordHash: varchar("passwordHash", { length: 255 }).notNull(),
  name: text("name").notNull(),
  email: varchar("email", { length: 320 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * License system tables
 */
export const licenses = mysqlTable("licenses", {
  id: int("id").autoincrement().primaryKey(),
  serverId: varchar("serverId", { length: 64 }).notNull().unique(),
  ownerName: text("ownerName"),
  expiresAt: timestamp("expiresAt"),
  trialStartedAt: timestamp("trialStartedAt").defaultNow().notNull(),
  isActive: int("isActive").default(0).notNull(),
  allowPublicRegistration: int("allowPublicRegistration").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type License = typeof licenses.$inferSelect;
export type InsertLicense = typeof licenses.$inferInsert;

export const licenseKeys = mysqlTable("licenseKeys", {
  id: int("id").autoincrement().primaryKey(),
  licenseId: int("licenseId").notNull().references(() => licenses.id, { onDelete: "cascade" }),
  key: varchar("key", { length: 256 }).notNull().unique(),
  ownerName: text("ownerName").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type LicenseKey = typeof licenseKeys.$inferSelect;
export type InsertLicenseKey = typeof licenseKeys.$inferInsert;

/**
 * Folders and notes
 */
export const folders = mysqlTable("folders", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  userId: int("userId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Folder = typeof folders.$inferSelect;
export type InsertFolder = typeof folders.$inferInsert;

/**
 * Notes table with password protection and favorites
 */
export const notes = mysqlTable("notes", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 500 }).notNull(),
  content: text("content").notNull(),
  userId: int("userId").notNull(),
  folderId: int("folderId"),
  passwordHash: varchar("passwordHash", { length: 255 }),
  isFavorite: boolean("isFavorite").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Note = typeof notes.$inferSelect;
export type InsertNote = typeof notes.$inferInsert;

/**
 * Version history for notes
 */
export const noteVersions = mysqlTable("noteVersions", {
  id: int("id").autoincrement().primaryKey(),
  noteId: int("noteId").notNull(),
  title: varchar("title", { length: 500 }).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type NoteVersion = typeof noteVersions.$inferSelect;
export type InsertNoteVersion = typeof noteVersions.$inferInsert;

/**
 * File attachments for notes
 */
export const noteFiles = mysqlTable("noteFiles", {
  id: int("id").autoincrement().primaryKey(),
  noteId: int("noteId").notNull(),
  fileName: varchar("fileName", { length: 500 }).notNull(),
  fileKey: varchar("fileKey", { length: 500 }).notNull(),
  fileUrl: text("fileUrl").notNull(),
  fileSize: int("fileSize").notNull(),
  mimeType: varchar("mimeType", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type NoteFile = typeof noteFiles.$inferSelect;
export type InsertNoteFile = typeof noteFiles.$inferInsert;

/**
 * Tags for notes (for search and organization)
 */
export const noteTags = mysqlTable("noteTags", {
  id: int("id").autoincrement().primaryKey(),
  noteId: int("noteId").notNull(),
  tag: varchar("tag", { length: 100 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type NoteTag = typeof noteTags.$inferSelect;
export type InsertNoteTag = typeof noteTags.$inferInsert;


/**
 * Task Management System (Kanban Board)
 */
export const taskBoardColumns = mysqlTable("taskBoardColumns", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  color: varchar("color", { length: 50 }).default("blue").notNull(),
  position: int("position").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TaskBoardColumn = typeof taskBoardColumns.$inferSelect;
export type InsertTaskBoardColumn = typeof taskBoardColumns.$inferInsert;

export const tasks = mysqlTable("tasks", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  columnId: int("columnId").notNull().references(() => taskBoardColumns.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 500 }).notNull(),
  description: text("description"),
  priority: mysqlEnum("priority", ["low", "medium", "high"]).default("medium"),
  assignedToUserId: int("assignedToUserId").references(() => users.id, { onDelete: "set null" }),
  dueDate: timestamp("dueDate"),
  position: int("position").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Task = typeof tasks.$inferSelect;
export type InsertTask = typeof tasks.$inferInsert;

export const taskFiles = mysqlTable("taskFiles", {
  id: int("id").autoincrement().primaryKey(),
  taskId: int("taskId").notNull().references(() => tasks.id, { onDelete: "cascade" }),
  fileName: varchar("fileName", { length: 500 }).notNull(),
  fileKey: varchar("fileKey", { length: 500 }).notNull(),
  fileUrl: text("fileUrl").notNull(),
  fileSize: int("fileSize").notNull(),
  mimeType: varchar("mimeType", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TaskFile = typeof taskFiles.$inferSelect;
export type InsertTaskFile = typeof taskFiles.$inferInsert;

/**
 * Task tags
 */
export const taskTags = mysqlTable("taskTags", {
  id: int("id").autoincrement().primaryKey(),
  taskId: int("taskId").notNull().references(() => tasks.id, { onDelete: "cascade" }),
  tag: varchar("tag", { length: 100 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TaskTag = typeof taskTags.$inferSelect;
export type InsertTaskTag = typeof taskTags.$inferInsert;

/**
 * Task comments
 */
export const taskComments = mysqlTable("taskComments", {
  id: int("id").autoincrement().primaryKey(),
  taskId: int("taskId").notNull().references(() => tasks.id, { onDelete: "cascade" }),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TaskComment = typeof taskComments.$inferSelect;
export type InsertTaskComment = typeof taskComments.$inferInsert;

/**
 * Task comment files/attachments
 */
export const taskCommentFiles = mysqlTable("taskCommentFiles", {
  id: int("id").autoincrement().primaryKey(),
  commentId: int("commentId").notNull().references(() => taskComments.id, { onDelete: "cascade" }),
  fileName: varchar("fileName", { length: 500 }).notNull(),
  fileKey: varchar("fileKey", { length: 500 }).notNull(),
  fileUrl: text("fileUrl").notNull(),
  fileSize: int("fileSize").notNull(),
  mimeType: varchar("mimeType", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TaskCommentFile = typeof taskCommentFiles.$inferSelect;
export type InsertTaskCommentFile = typeof taskCommentFiles.$inferInsert;

/**
 * Column archive status
 */
export const taskBoardColumnsArchive = mysqlTable("taskBoardColumnsArchive", {
  id: int("id").autoincrement().primaryKey(),
  columnId: int("columnId").notNull().references(() => taskBoardColumns.id, { onDelete: "cascade" }),
  isArchived: boolean("isArchived").default(false).notNull(),
  archivedAt: timestamp("archivedAt"),
});

export type TaskBoardColumnArchive = typeof taskBoardColumnsArchive.$inferSelect;
export type InsertTaskBoardColumnArchive = typeof taskBoardColumnsArchive.$inferInsert;
