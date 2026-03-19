import { z } from 'zod';

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID');

const lineItemSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  quantity: z.coerce.number().min(0),
  unit: z.string().optional(),
  unitPrice: z.coerce.number().min(0),
});

export const getBillingSchema = z.object({
  query: z.object({
    consultancyId: objectId.optional(),
    documentType: z.enum(['QUOTE', 'INVOICE']).optional(),
    status: z.enum(['DRAFT', 'SENT', 'ACCEPTED', 'PAID', 'CANCELLED']).optional(),
    clientId: objectId.optional(),
    applicationId: objectId.optional(),
    q: z.string().optional(),
  }),
});

export const billingIdSchema = z.object({
  params: z.object({ id: objectId }),
  query: z.object({ consultancyId: objectId.optional() }).optional(),
});

export const createBillingSchema = z.object({
  body: z.object({
    consultancyId: objectId.optional(),
    documentType: z.enum(['QUOTE', 'INVOICE']),
    clientId: objectId,
    applicationId: objectId.optional(),
    title: z.string().optional(),
    issueDate: z.string().optional(),
    dueDate: z.string().optional(),
    validUntil: z.string().optional(),
    gstEnabled: z.boolean().optional(),
    gstRate: z.coerce.number().optional(),
    notes: z.string().optional(),
    lineItems: z.array(lineItemSchema).min(1, 'At least one line item is required'),
  }),
});

export const updateBillingSchema = z.object({
  params: z.object({ id: objectId }),
  query: z.object({ consultancyId: objectId.optional() }).optional(),
  body: z.object({
    title: z.string().optional(),
    issueDate: z.string().optional(),
    dueDate: z.string().optional(),
    validUntil: z.string().optional(),
    status: z.enum(['DRAFT', 'SENT', 'ACCEPTED', 'PAID', 'CANCELLED']).optional(),
    gstEnabled: z.boolean().optional(),
    gstRate: z.coerce.number().optional(),
    notes: z.string().optional(),
    lineItems: z.array(lineItemSchema).optional(),
  }).passthrough(),
});

export const sendBillingSchema = z.object({
  params: z.object({ id: objectId }),
  query: z.object({ consultancyId: objectId.optional() }).optional(),
  body: z.object({
    to: z.string().email().optional(),
    subject: z.string().optional(),
    text: z.string().optional(),
  }).default({}),
});
