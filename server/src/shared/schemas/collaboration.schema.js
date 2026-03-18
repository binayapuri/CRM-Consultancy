import { z } from 'zod';

const idParam = z.object({ id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID') });

export const sendMessageSchema = z.object({
  body: z.object({
    text: z.string().min(1)
  })
});

export const getPostsSchema = z.object({
  query: z.object({
    location: z.string().optional(),
    university: z.string().optional(),
    tag: z.string().optional()
  })
});

export const createPostSchema = z.object({
  body: z.record(z.any())
});

export const createCommentSchema = z.object({
  params: idParam,
  body: z.object({
    content: z.string().min(1)
  })
});
