import { z } from 'zod';

const idParam = z.object({ id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID') });

export const createAppointmentSchema = z.object({
  body: z.object({
    studentId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID').optional(),
    agentId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID'),
    consultancyId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID').optional(),
    startTime: z.string(),
    endTime: z.string().optional(),
    topic: z.string(),
    notes: z.string().optional(),
    meetingLink: z.string().optional(),
    internalNotes: z.string().optional(),
    status: z.enum(['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED']).optional(),
  })
});

export const updateAppointmentSchema = z.object({
  params: idParam,
  body: z.object({
    agentId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID').optional(),
    studentId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID').optional(),
    startTime: z.string().optional(),
    endTime: z.string().optional(),
    topic: z.string().optional(),
    notes: z.string().optional(),
    meetingLink: z.string().optional(),
    internalNotes: z.string().optional(),
    status: z.enum(['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED']).optional(),
  }).refine((body) => Object.keys(body).length > 0, 'At least one field is required'),
});
