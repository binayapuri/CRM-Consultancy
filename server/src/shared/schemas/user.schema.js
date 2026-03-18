import { z } from 'zod';

const idParam = z.object({ id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID') });

export const createTestAccountSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(6),
    role: z.enum(['STUDENT', 'AGENT', 'MANAGER', 'CONSULTANCY_ADMIN']),
    profile: z.record(z.any()).optional(),
    consultancyId: z.string().optional()
  })
});

export const getUsersSchema = z.object({
  query: z.object({ consultancyId: z.string().optional() })
});

export const updateUserSchema = z.object({
  params: idParam,
  body: z.record(z.any())
});

export const deleteUserSchema = z.object({ params: idParam });
