import { z } from 'zod';

const idParam = z.object({ id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID') });

export const getLeadsSchema = z.object({
  query: z.object({ consultancyId: z.string().optional() })
});

export const createLeadSchema = z.object({
  body: z.record(z.string(), z.any())
});

export const updateLeadSchema = z.object({
  params: idParam,
  body: z.record(z.string(), z.any())
});

export const publicEnquirySchema = z.object({
  body: z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    email: z.string().email(),
    phone: z.string().optional(),
    interest: z.string().optional(),
    message: z.string().optional(),
    consultancyId: z.string().optional()
  })
});

export const deleteLeadSchema = z.object({ params: idParam });
export const convertLeadSchema = z.object({ params: idParam });
