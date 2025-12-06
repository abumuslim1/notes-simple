import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import {
  createTaskBoardColumn,
  getTaskBoardColumnsByUserId,
  updateTaskBoardColumn,
  deleteTaskBoardColumn,
  createTask,
  getTasksByColumnId,
  getTaskById,
  updateTask,
  deleteTask,
  moveTask,
  createTaskFile,
  getTaskFilesByTaskId,
  deleteTaskFile,
} from "../db";

export const tasksRouter = router({
  // Board Columns
  columns: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await getTaskBoardColumnsByUserId(ctx.user.id);
    }),

    create: protectedProcedure
      .input(
        z.object({
          name: z.string().min(1).max(255),
          color: z.string().default("blue"),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const columns = await getTaskBoardColumnsByUserId(ctx.user.id);
        const position = columns.length;
        const id = await createTaskBoardColumn({
          userId: ctx.user.id,
          name: input.name,
          color: input.color,
          position,
        });
        return { id };
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().min(1).max(255).optional(),
          color: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await updateTaskBoardColumn(input.id, {
          name: input.name,
          color: input.color,
        });
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await deleteTaskBoardColumn(input.id);
        return { success: true };
      }),
  }),

  // Tasks
  list: protectedProcedure
    .input(z.object({ columnId: z.number() }))
    .query(async ({ ctx, input }) => {
      return await getTasksByColumnId(input.columnId);
    }),

  create: protectedProcedure
    .input(
      z.object({
        columnId: z.number(),
        title: z.string().min(1).max(500),
        description: z.string().optional(),
        assignedToUserId: z.number().optional(),
        dueDate: z.date().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const tasks = await getTasksByColumnId(input.columnId);
      const position = tasks.length;
      const id = await createTask({
        userId: ctx.user.id,
        columnId: input.columnId,
        title: input.title,
        description: input.description,
        assignedToUserId: input.assignedToUserId,
        dueDate: input.dueDate,
        position,
      });
      return { id };
    }),

  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const task = await getTaskById(input.id);
      if (!task || task.userId !== ctx.user.id) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      return task;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        title: z.string().min(1).max(500).optional(),
        description: z.string().optional(),
        assignedToUserId: z.number().optional(),
        dueDate: z.date().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const task = await getTaskById(input.id);
      if (!task || task.userId !== ctx.user.id) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      await updateTask(input.id, {
        title: input.title,
        description: input.description,
        assignedToUserId: input.assignedToUserId,
        dueDate: input.dueDate,
      });
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const task = await getTaskById(input.id);
      if (!task || task.userId !== ctx.user.id) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      await deleteTask(input.id);
      return { success: true };
    }),

  move: protectedProcedure
    .input(
      z.object({
        taskId: z.number(),
        columnId: z.number(),
        position: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const task = await getTaskById(input.taskId);
      if (!task || task.userId !== ctx.user.id) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      await moveTask(input.taskId, input.columnId, input.position);
      return { success: true };
    }),

  // Task Files
  files: router({
    list: protectedProcedure
      .input(z.object({ taskId: z.number() }))
      .query(async ({ ctx, input }) => {
        return await getTaskFilesByTaskId(input.taskId);
      }),

    delete: protectedProcedure
      .input(z.object({ fileId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await deleteTaskFile(input.fileId);
        return { success: true };
      }),
  }),
});
