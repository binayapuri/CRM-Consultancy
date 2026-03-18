import { z } from 'zod';

export const checkInSchema = z.object({
  body: z.object({
    location: z.record(z.any()).optional()
  })
});

export const checkOutSchema = z.object({
  body: z.object({
    breakMinutes: z.number().int().min(0).optional(),
    notes: z.string().optional()
  })
});

export const getAttendanceSchema = z.object({
  query: z.object({
    from: z.string().optional(),
    to: z.string().optional(),
    userId: z.string().optional(),
    consultancyId: z.string().optional()
  })
});
