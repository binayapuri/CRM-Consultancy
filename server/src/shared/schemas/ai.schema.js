import { z } from 'zod';

const idParam = z.object({ id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID') });

export const compassSchema = z.object({
  body: z.object({
    message: z.string().min(1),
    chatId: z.string().optional()
  })
});

export const documentSuggestionsSchema = z.object({
  body: z.object({
    visaSubclass: z.string()
  })
});
