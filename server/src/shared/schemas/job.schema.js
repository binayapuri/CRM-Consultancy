import { z } from 'zod';

const idParam = z.object({ id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID') });

export const applyJobSchema = z.object({
  params: idParam,
  body: z.object({
    resumeUrl: z.string().url(),
    coverLetterUrl: z.string().url().optional()
  })
});

export const createJobSchema = z.object({
  body: z.object({
    title: z.string().min(1),
    description: z.string().min(1),
    location: z.string().optional(),
    type: z.string().optional(),
    anzscoCode: z.string().optional(),
    salary: z.string().optional(),
    expiryDate: z.string().optional()
  })
});

export const updateApplicationStatusSchema = z.object({
  params: idParam,
  body: z.object({
    status: z.string()
  })
});
