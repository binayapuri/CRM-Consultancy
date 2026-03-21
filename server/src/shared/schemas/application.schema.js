import { z } from 'zod';

const idParam = z.object({ id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID') });

export const getAppsSchema = z.object({
  query: z.object({ consultancyId: z.string().optional() })
});

export const getByIdSchema = z.object({ params: idParam });

export const createAppSchema = z.object({
  body: z.object({
    clientId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Client ID'),
    visaSubclass: z.string().min(1),
    agentId: z.string().optional(),
    sponsorId: z.string().optional(),
    documentChecklist: z.array(z.any()).optional()
  }).passthrough()
});

export const updateAppSchema = z.object({
  params: idParam,
  body: z.record(z.string(), z.any())
});

export const updateChecklistSchema = z.object({
  params: idParam,
  body: z.object({
    index: z.union([z.number(), z.string()]),
    documentId: z.string().optional(),
    uploaded: z.boolean().optional()
  })
});

export const updateStatusSchema = z.object({
  params: idParam,
  body: z.object({ status: z.string().min(1) })
});

export const addNoteSchema = z.object({
  params: idParam,
  body: z.object({
    text: z.string().min(1),
    isLegalAdvice: z.boolean().optional()
  })
});

export const deleteAppSchema = z.object({ params: idParam });
