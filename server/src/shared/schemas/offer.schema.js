import { z } from 'zod';

const idParam = z.object({ id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID') });

export const applyOfferSchema = z.object({
  body: z.object({
    courseId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID'),
    documents: z.array(z.string()).optional(),
    studentNotes: z.string().optional()
  })
});

export const updateOfferStatusSchema = z.object({
  params: idParam,
  body: z.object({
    status: z.string(),
    universityNotes: z.string().optional()
  })
});

// OSHC
export const getOshcSchema = z.object({
  query: z.object({
    coverageType: z.string().optional(),
    applicationType: z.string().optional(),
    consultancyId: z.string().optional()
  })
});

export const createOshcSchema = z.object({
  body: z.record(z.any())
});

export const updateOshcSchema = z.object({
  params: idParam,
  body: z.record(z.any())
});
