import { z } from 'zod';

const idParam = z.object({ id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID') });

export const getTrustLedgerSchema = z.object({
  query: z.object({
    applicationId: z.string().optional(),
    consultancyId: z.string().optional()
  })
});

export const createTrustEntrySchema = z.object({
  body: z.object({
    amount: z.number().positive(),
    direction: z.enum(['CREDIT', 'DEBIT']),
    applicationId: z.string().optional(),
    clientId: z.string().optional(),
    description: z.string(),
    category: z.string().optional()
  })
});

export const updateTrustEntrySchema = z.object({
  params: idParam,
  body: z.object({
    description: z.string().optional(),
    category: z.string().optional()
  })
});
