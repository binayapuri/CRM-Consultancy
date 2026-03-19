import { z } from 'zod';

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID');

export const consultancySearchSchema = z.object({
  query: z.object({
    q: z.string().min(1, 'Search query is required'),
    consultancyId: objectId.optional(),
    limit: z.string().transform(Number).optional(),
  }),
});
