import { z } from 'zod';

const idParam = z.object({ id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID') });

export const getNewsSchema = z.object({
  query: z.object({
    category: z.string().optional()
  })
});

export const createArticleSchema = z.object({
  body: z.object({
    title: z.string().min(1),
    slug: z.string().min(1),
    content: z.string().min(1),
    summary: z.string().optional(),
    coverImage: z.string().optional(),
    categoryId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID').optional(),
    tags: z.array(z.string()).optional(),
    isPublished: z.boolean().optional()
  })
});

export const updateArticleSchema = z.object({
  params: idParam,
  body: z.object({
    title: z.string().optional(),
    slug: z.string().optional(),
    content: z.string().optional(),
    summary: z.string().optional(),
    coverImage: z.string().optional(),
    categoryId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID').optional(),
    tags: z.array(z.string()).optional(),
    isPublished: z.boolean().optional()
  })
});
