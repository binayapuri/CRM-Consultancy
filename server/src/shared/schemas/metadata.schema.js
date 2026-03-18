import { z } from 'zod';

const idParam = z.object({ id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID') });

export const calculatePointsSchema = z.object({
  body: z.object({
    age: z.number().int().min(18),
    englishScore: z.string(),
    educationLevel: z.string(),
    workExperienceAus: z.number().int().min(0),
    australianStudy: z.boolean()
  })
});

export const createTemplateSchema = z.object({
  body: z.object({
    title: z.string().min(1),
    content: z.string().min(1),
    description: z.string().optional(),
    tags: z.array(z.string()).optional()
  })
});
