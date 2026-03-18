import { z } from 'zod';

const idParam = z.object({ id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID') });

export const getConsultancyReviewsSchema = z.object({
  params: idParam
});

export const createReviewSchema = z.object({
  body: z.object({
    consultancyId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID'),
    rating: z.number().min(1).max(5),
    comment: z.string(),
    tags: z.array(z.string()).optional()
  })
});
