import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import * as db from "../db";

export const tasksRouter = router({
  // Column operations
  getColumns: protectedProcedure.query(async ({ ctx }) => {
    return db.getTaskBoardColumnsByUserId(ctx.user.id);
  }),

  createColumn: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        color: z.string(),
        position: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const id = await db.createTaskBoardColumn({
        userId: ctx.user.id,
        ...input,
      });
      return { id };
    }),

  updateColumn: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().optional(),
        color: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await db.updateTaskBoardColumn(id, data);
      return { success: true };
    }),

  deleteColumn: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db.deleteTaskBoardColumn(input.id);
      return { success: true };
    }),

  reorderColumns: protectedProcedure
    .input(
      z.object({
        columnIds: z.array(z.number()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Reorder columns by updating positions
      for (let i = 0; i < input.columnIds.length; i++) {
        await db.updateTaskBoardColumn(input.columnIds[i], { position: i });
      }
      return { success: true };
    }),

  // Task operations
  getTaskById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return db.getTaskById(input.id);
    }),

  getTasksByColumn: protectedProcedure
    .input(z.object({ columnId: z.number() }))
    .query(async ({ input }) => {
      return db.getTasksByColumn(input.columnId);
    }),

  createTask: protectedProcedure
    .input(
      z.object({
        columnId: z.number(),
        title: z.string(),
        description: z.string().optional(),
        priority: z.enum(["low", "medium", "high"]).optional(),
        assignedToUserId: z.number().optional(),
        dueDate: z.string().optional(),
        tags: z.array(z.string()).optional(),
        position: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { dueDate, tags, ...rest } = input;
      const id = await db.createTask({
        userId: ctx.user.id,
        ...rest,
        dueDate: dueDate ? new Date(dueDate) : undefined,
      });
      
      // Add tags if provided
      if (tags && tags.length > 0) {
        for (const tag of tags) {
          await db.addTaskTag(id, tag);
        }
      }
      
      return { id };
    }),

  updateTask: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        title: z.string().optional(),
        description: z.string().optional(),
        priority: z.enum(["low", "medium", "high"]).optional(),
        assignedToUserId: z.number().optional(),
        dueDate: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, dueDate, ...rest } = input;
      await db.updateTask(id, {
        ...rest,
        dueDate: dueDate ? new Date(dueDate) : undefined,
      });
      return { success: true };
    }),

  deleteTask: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db.deleteTask(input.id);
      return { success: true };
    }),

  moveTask: protectedProcedure
    .input(
      z.object({
        taskId: z.number(),
        columnId: z.number(),
        position: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      await db.moveTask(input.taskId, input.columnId, input.position);
      return { success: true };
    }),

  getUsers: protectedProcedure.query(async () => {
    return db.getAllUsers();
  }),

  getComments: protectedProcedure
    .input(z.object({ taskId: z.number() }))
    .query(async ({ input }) => {
      return db.getTaskComments(input.taskId);
    }),

  addComment: protectedProcedure
    .input(z.object({ taskId: z.number(), content: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const comment = await db.createTaskComment({
        taskId: input.taskId,
        userId: ctx.user.id,
        content: input.content,
      });
      return comment;
    }),

  deleteComment: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db.deleteTaskComment(input.id);
      return { success: true };
    }),

  getCommentFiles: protectedProcedure
    .input(z.object({ commentId: z.number() }))
    .query(async ({ input }) => {
      return db.getCommentFiles(input.commentId);
    }),

  addCommentFile: protectedProcedure
    .input(z.object({ commentId: z.number(), fileName: z.string(), fileKey: z.string(), fileUrl: z.string(), fileSize: z.number(), mimeType: z.string().optional() }))
    .mutation(async ({ input }) => {
      const id = await db.addCommentFile(input);
      return { id };
    }),

  deleteCommentFile: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db.deleteCommentFile(input.id);
      return { success: true };
    }),

  toggleColumnArchive: protectedProcedure
    .input(z.object({ columnId: z.number(), isArchived: z.boolean() }))
    .mutation(async ({ input }) => {
      await db.updateColumnArchiveStatus(input.columnId, input.isArchived);
      return { success: true };
    }),

  getArchivedColumns: protectedProcedure.query(async ({ ctx }) => {
    return db.getArchivedColumns(ctx.user.id);
  }),
});
