import { z } from 'zod';

const idParam = z.object({ id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID') });

export const getTasksSchema = z.object({
  query: z.object({
    consultancyId: z.string().optional(),
    date: z.string().optional(),
    assignedTo: z.string().optional(),
    status: z.string().optional()
  })
});

export const getDailyTasksSchema = z.object({
  query: z.object({
    consultancyId: z.string().optional(),
    date: z.string().optional()
  })
});

export const getByIdSchema = z.object({ params: idParam });

export const createTaskSchema = z.object({
  body: z.object({
    title: z.string().min(1),
    consultancyId: z.string().optional(),
    dailyTaskDate: z.string().optional()
  }).passthrough()
});

export const updateTaskSchema = z.object({
  params: idParam,
  body: z.object({
    status: z.string().optional(),
    reviewedBy: z.string().optional(),
    tags: z.array(z.string()).optional(),
    assignedTo: z.string().optional(),
    title: z.string().optional(),
    description: z.string().optional(),
    priority: z.string().optional(),
    dueDate: z.string().optional()
  }).passthrough()
});

export const reviewTaskSchema = z.object({ params: idParam });

export const addCommentSchema = z.object({
  params: idParam,
  body: z.object({ text: z.string().min(1) })
});

export const deleteTaskSchema = z.object({ params: idParam });
