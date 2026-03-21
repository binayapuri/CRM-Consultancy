import { z } from 'zod';

export const createCategorySchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required').trim(),
    slug: z.string().trim().optional(),
    order: z.preprocess((val) => (val != null ? Number(val) : undefined), z.number().optional()),
  }),
});

export const updateCategorySchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid category ID'),
  }),
  body: z.object({
    name: z.string().trim().optional(),
    slug: z.string().trim().optional(),
    order: z.preprocess((val) => (val != null ? Number(val) : undefined), z.number().optional()),
  }),
});

export const deleteCategorySchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid category ID'),
  }),
});
