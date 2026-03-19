import { z } from 'zod';

const idParam = z.object({ clientId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID') });
const sponsorIdParam = z.object({ sponsorId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID') });
const feeBlockSchema = z.object({
  label: z.string(),
  amount: z.string(),
  description: z.string().optional(),
});
const governmentFeeBlockSchema = z.object({
  label: z.string(),
  amount: z.string(),
  description: z.string().optional(),
  payer: z.string().optional(),
});
const draftBodySchema = z.object({
  applicationId: z.string().optional(),
  subject: z.string().optional(),
  customBody: z.string().optional(),
  includeConsumerGuide: z.boolean().optional(),
  includeForm956Attachment: z.boolean().optional(),
  feeBlocks: z.array(feeBlockSchema).optional(),
  governmentFeeBlocks: z.array(governmentFeeBlockSchema).optional(),
  checklistItems: z.array(z.string()).optional(),
  sampleAttachments: z.array(z.string()).optional(),
  occupation: z.string().optional(),
  anzscoCode: z.string().optional(),
  positionTitle: z.string().optional(),
  sbsStatus: z.string().optional(),
  recipientName: z.string().optional(),
}).optional();

export const sendAdviceSchema = z.object({
  params: idParam,
  body: draftBodySchema.default({})
});

export const idParamsSchema = z.object({
  params: z.union([idParam, sponsorIdParam])
});

export const previewClientDraftSchema = z.object({
  params: idParam,
  body: draftBodySchema.default({})
});

export const previewSponsorDraftSchema = z.object({
  params: sponsorIdParam,
  body: draftBodySchema.default({})
});
