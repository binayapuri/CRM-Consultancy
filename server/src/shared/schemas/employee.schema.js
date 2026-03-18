import { z } from 'zod';

const idParam = z.object({ id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID') });

export const getEmployeesSchema = z.object({
  query: z.object({ consultancyId: z.string().optional() })
});

export const createEmployeeSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().optional(),
    role: z.enum(['CONSULTANCY_ADMIN', 'MANAGER', 'AGENT']).optional(),
    profile: z.record(z.any()).optional()
  })
});

export const updateEmployeeSchema = z.object({
  params: idParam,
  body: z.object({
    password: z.string().optional(),
    role: z.string().optional(),
    profile: z.record(z.any()).optional(),
    isActive: z.boolean().optional()
  })
});

export const getJobSheetSchema = z.object({
  params: idParam
});
