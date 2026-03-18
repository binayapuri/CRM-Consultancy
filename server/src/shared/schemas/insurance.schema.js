import { z } from 'zod';

const idParam = z.object({ id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID') });

export const applyInsuranceSchema = z.object({
  body: z.object({
    planId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID'),
    notes: z.string().optional()
  })
});

export const updateInsuranceStatusSchema = z.object({
  params: idParam,
  body: z.object({
    status: z.string(),
    policyNumber: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional()
  })
});
