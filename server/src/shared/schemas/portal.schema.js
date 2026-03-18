import { z } from 'zod';

const idParam = z.object({ clientId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID') });
const sponsorIdParam = z.object({ sponsorId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID') });

export const sendAdviceSchema = z.object({
  params: idParam,
  body: z.object({
    applicationId: z.string().optional(),
    customBody: z.string().optional(),
    feeBlocks: z.array(z.object({
      label: z.string(),
      amount: z.string(),
      description: z.string().optional()
    })).optional()
  })
});

export const idParamsSchema = z.object({
  params: z.union([idParam, sponsorIdParam])
});
