import { z } from 'zod';

const idParam = z.object({ id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID') });
const idxParam = z.object({ id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID'), idx: z.string().regex(/^[0-9]+$/, 'Invalid Index') });
const aidParam = z.object({ id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID'), aid: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID') });
const nestedIdParam = (key) => z.object({ id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID'), [key]: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID') });

export const getClientsSchema = z.object({
  query: z.object({ consultancyId: z.string().optional() })
});

export const getByIdSchema = z.object({ params: idParam });

export const createClientSchema = z.object({
  body: z.record(z.any())
});

export const updateClientSchema = z.object({
  params: idParam,
  body: z.record(z.any())
});

export const deleteClientSchema = z.object({ params: idParam });

// Sub-arrays (using basic any records for now due to deep nesting complexity, but structured natively)
export const addArrayItemSchema = z.object({ params: idParam, body: z.record(z.any()) });
export const updateArrayItemSchema = z.object({ params: idxParam, body: z.record(z.any()) });

export const addActivitySchema = z.object({
  params: idParam,
  body: z.object({
    text: z.string().min(1),
    type: z.string().optional(),
    metadata: z.record(z.any()).optional()
  })
});

export const updateActivitySchema = z.object({
  params: aidParam,
  body: z.object({
    text: z.string().optional(),
    type: z.string().optional()
  })
});

export const deleteActivitySchema = z.object({ params: aidParam });

export const addNoteSchema = z.object({
  params: idParam,
  body: z.object({
    text: z.string().min(1),
    type: z.string().optional(),
    isLegalAdvice: z.boolean().optional()
  })
});

export const updateNoteSchema = z.object({
  params: idxParam,
  body: z.object({
    text: z.string().optional(),
    type: z.string().optional()
  })
});

export const deleteNoteSchema = z.object({ params: idxParam });

export const updateGenericSchema = z.object({ params: idParam, body: z.record(z.any()) });
export const deleteNestedSchema = (key) => z.object({ params: nestedIdParam(key) });
