import { z } from 'zod';

const idParam = z.object({ id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID') });

export const sendMessageSchema = z.object({
  body: z.object({
    text: z.string().min(1),
    recipientId: z.string().optional(),
    postId: z.string().optional()
  })
});

export const getPostsSchema = z.object({
  query: z.object({
    location: z.string().optional(),
    university: z.string().optional(),
    tag: z.string().optional(),
    category: z.string().optional(),
    search: z.string().optional()
  })
});

export const createPostSchema = z.object({
  body: z.object({
    title: z.string().min(3),
    content: z.string().min(5),
    tags: z.array(z.string()).optional(),
    category: z.string().optional(),
    location: z.string().optional(),
    university: z.string().optional(),
    contactPreference: z.string().optional(),
  })
});

export const createCommentSchema = z.object({
  params: idParam,
  body: z.object({
    content: z.string().min(1)
  })
});
