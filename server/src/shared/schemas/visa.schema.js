import { z } from 'zod';

const idParam = z.object({ id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID') });

export const updateMilestoneSchema = z.object({
  params: z.object({ milestoneId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID') }),
  body: z.object({
    status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED', 'CANCELLED', 'SKIPPED'])
  })
});
