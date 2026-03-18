import { z } from 'zod';

const idParam = z.object({ id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID') });

export const createAppointmentSchema = z.object({
  body: z.object({
    agentId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID'),
    consultancyId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID'),
    startTime: z.string(),
    topic: z.string(),
    notes: z.string().optional()
  })
});
