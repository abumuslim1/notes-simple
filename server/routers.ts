import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { TRPCError } from "@trpc/server";
import { hashPassword, verifyPassword } from "./_core/password";
import { storagePut } from "./storage";
import { nanoid } from "nanoid";
import { licenseRouter } from "./routers/license";
import { sdk } from "./_core/sdk";
import { COOKIE_NAME } from "../shared/const";

// Admin-only procedure
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'admin') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
  }
  return next({ ctx });
});

export const appRouter = router({
  system: systemRouter,
  license: licenseRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    
    logout: publicProcedure.mutation(({ ctx }) => {
      ctx.res.clearCookie(COOKIE_NAME, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
      });
      return { success: true };
    }),
    
    register: publicProcedure
      .input(z.object({
        username: z.string().min(3).max(64),
        password: z.string().min(6),
        name: z.string().min(1).max(255),
      }))
      .mutation(async ({ ctx, input }) => {
        const existingUser = await db.getUserByUsername(input.username);
        if (existingUser) {
          throw new TRPCError({ code: "CONFLICT", message: "Username already exists" });
        }
        
        // Check if this is the first user
        const allUsers = await db.getAllUsers();
        const isFirstUser = allUsers.length === 0;
        
        const passwordHash = await hashPassword(input.password);
        const userId = await db.createUser(input.username, passwordHash, input.name, undefined, isFirstUser ? 'admin' : 'user');
        const user = await db.getUserById(userId);
        
        if (!user) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create user" });
        }
        
        return { id: user.id, username: user.username, name: user.name, role: user.role };
      }),
    
    login: publicProcedure
      .input(z.object({
        username: z.string(),
        password: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const user = await db.getUserByUsername(input.username);
        if (!user) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid credentials" });
        }
        
        const isPasswordValid = await verifyPassword(input.password, user.passwordHash);
        if (!isPasswordValid) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid credentials" });
        }
        
        await db.updateUserLastSignedIn(user.id);
        
        // Generate JWT token and set cookie
        const token = sdk.generateToken({
          userId: user.id,
          username: user.username,
          role: user.role,
        });
        sdk.setAuthCookie(ctx.res, token);
        
        return { id: user.id, username: user.username, name: user.name, role: user.role };
      }),
  }),

  // User management (admin only)
  users: router({
    list: adminProcedure.query(async () => {
      return db.getAllUsers();
    }),
    
    update: adminProcedure
      .input(z.object({
        userId: z.number(),
        name: z.string().optional(),
        email: z.string().optional(),
        password: z.string().min(6).optional(),
      }))
      .mutation(async ({ input }) => {
        const updateData: any = {};
        if (input.name !== undefined) updateData.name = input.name;
        if (input.email !== undefined) updateData.email = input.email;
        if (input.password !== undefined) {
          updateData.passwordHash = await hashPassword(input.password);
        }
        
        await db.updateUser(input.userId, updateData);
        return { success: true };
      }),
    
    updateRole: adminProcedure
      .input(z.object({
        userId: z.number(),
        role: z.enum(["user", "admin"]),
      }))
      .mutation(async ({ input }) => {
        await db.updateUserRole(input.userId, input.role);
        return { success: true };
      }),
    
    delete: adminProcedure
      .input(z.object({ userId: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteUser(input.userId);
        return { success: true };
      }),
  }),

  // Folders
  folders: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getFoldersByUserId(ctx.user.id);
    }),
    
    create: protectedProcedure
      .input(z.object({ name: z.string().min(1).max(255) }))
      .mutation(async ({ ctx, input }) => {
        const folderId = await db.createFolder({
          name: input.name,
          userId: ctx.user.id,
        });
        return { id: folderId };
      }),
    
    update: protectedProcedure
      .input(z.object({
        folderId: z.number(),
        name: z.string().min(1).max(255),
      }))
      .mutation(async ({ input }) => {
        await db.updateFolder(input.folderId, input.name);
        return { success: true };
      }),
    
    delete: protectedProcedure
      .input(z.object({ folderId: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteFolder(input.folderId);
        return { success: true };
      }),
  }),

  // Notes
  notes: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getNotesByUserId(ctx.user.id);
    }),
    
    get: protectedProcedure
      .input(z.object({ noteId: z.number() }))
      .query(async ({ ctx, input }) => {
        const note = await db.getNoteById(input.noteId);
        if (!note || note.userId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Note not found" });
        }
        return note;
      }),
    
    create: protectedProcedure
      .input(z.object({
        title: z.string().min(1).max(500),
        content: z.string(),
        folderId: z.number().optional(),
        password: z.string().optional(),
        tags: z.array(z.string()).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const noteId = await db.createNote({
          title: input.title,
          content: input.content,
          userId: ctx.user.id,
          folderId: input.folderId,
          passwordHash: input.password ? await hashPassword(input.password) : undefined,
          isFavorite: false,
        });
        
        // Ensure noteId is valid before creating version
        if (noteId && !isNaN(noteId)) {
          // Create initial version
          await db.createNoteVersion({
            noteId,
            title: input.title,
            content: input.content,
          });
          
          // Add tags if provided
          if (input.tags && input.tags.length > 0) {
            await db.createNoteTags(noteId, input.tags);
          }
        }
        
        return { id: noteId };
      }),
    
    update: protectedProcedure
      .input(z.object({
        noteId: z.number(),
        title: z.string().min(1).max(500).optional(),
        content: z.string().optional(),
        folderId: z.number().optional().nullable(),
        password: z.string().optional().nullable(),
        tags: z.array(z.string()).optional(),
      }))
      .mutation(async ({ input }) => {
        const updateData: any = {};
        
        if (input.title !== undefined) updateData.title = input.title;
        if (input.content !== undefined) updateData.content = input.content;
        if (input.folderId !== undefined) updateData.folderId = input.folderId;
        if (input.password !== undefined) {
          updateData.passwordHash = input.password ? await hashPassword(input.password) : null;
        }
        
        await db.updateNote(input.noteId, updateData);
        
        // Create version if title or content changed
        if (input.title !== undefined || input.content !== undefined) {
          const note = await db.getNoteById(input.noteId);
          if (note) {
            await db.createNoteVersion({
              noteId: input.noteId,
              title: note.title,
              content: note.content,
            });
          }
        }
        
        // Update tags if provided
        if (input.tags !== undefined) {
          await db.deleteNoteTags(input.noteId);
          if (input.tags.length > 0) {
            await db.createNoteTags(input.noteId, input.tags);
          }
        }
        
        return { success: true };
      }),
    
    delete: protectedProcedure
      .input(z.object({ noteId: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteNote(input.noteId);
        return { success: true };
      }),
    
    toggleFavorite: protectedProcedure
      .input(z.object({
        noteId: z.number(),
        isFavorite: z.boolean(),
      }))
      .mutation(async ({ input }) => {
        await db.toggleNoteFavorite(input.noteId, input.isFavorite);
        return { success: true };
      }),
    
    favorites: protectedProcedure.query(async ({ ctx }) => {
      return db.getFavoriteNotes(ctx.user.id);
    }),
    
    verifyPassword: protectedProcedure
      .input(z.object({
        noteId: z.number(),
        password: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const note = await db.getNoteById(input.noteId);
        if (!note || note.userId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Note not found" });
        }
        
        if (!note.passwordHash) {
          return { valid: true };
        }
        
        const isValid = await verifyPassword(input.password, note.passwordHash);
        return { valid: isValid };
      }),
    
    versions: protectedProcedure
      .input(z.object({ noteId: z.number() }))
      .query(async ({ input }) => {
        return db.getNoteVersions(input.noteId);
      }),
    
    tags: protectedProcedure
      .input(z.object({ noteId: z.number() }))
      .query(async ({ input }) => {
        return db.getNoteTags(input.noteId);
      }),
  }),

  // Files
  files: router({
    list: protectedProcedure
      .input(z.object({ noteId: z.number() }))
      .query(async ({ input }) => {
        return db.getNoteFiles(input.noteId);
      }),
    
    upload: protectedProcedure
      .input(z.object({
        noteId: z.number(),
        fileName: z.string(),
        fileData: z.string(), // base64
        mimeType: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Decode base64
        const buffer = Buffer.from(input.fileData, 'base64');
        const fileSize = buffer.length;
        
        // Check file size (50MB limit)
        if (fileSize > 50 * 1024 * 1024) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'File size exceeds 50MB limit' });
        }
        
        // Upload to S3
        const fileKey = `notes/${ctx.user.id}/${input.noteId}/${nanoid()}-${input.fileName}`;
        const { url } = await storagePut(fileKey, buffer, input.mimeType);
        
        // Save to database
        const fileId = await db.createNoteFile({
          noteId: input.noteId,
          fileName: input.fileName,
          fileKey,
          fileUrl: url,
          fileSize,
          mimeType: input.mimeType,
        });
        
        return { id: fileId, url };
      }),
    
    delete: protectedProcedure
      .input(z.object({ fileId: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteNoteFile(input.fileId);
        return { success: true };
      }),
  }),

  // Search
  search: router({
    notes: protectedProcedure
      .input(z.object({ query: z.string() }))
      .query(async ({ ctx, input }) => {
        return db.searchNotes(ctx.user.id, input.query);
      }),
    
    suggestions: protectedProcedure
      .input(z.object({ query: z.string() }))
      .query(async ({ ctx, input }) => {
        return db.getSearchSuggestions(ctx.user.id, input.query);
      }),
  }),
});

export type AppRouter = typeof appRouter;
