import { z } from 'zod';

const idParam = z.object({ id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID') });

export const getDocsSchema = z.object({
  query: z.object({
    applicationId: z.string().optional(),
    clientId: z.string().optional(),
    consultancyId: z.string().optional(),
    includeAllVersions: z.string().optional(),
  })
});

export const createDocSchema = z.object({
  body: z.object({
    clientId: z.string().optional(),
    applicationId: z.string().optional(),
    type: z.string().optional(),
    name: z.string().optional(),
    fileUrl: z.string().optional(),
    fileKey: z.string().optional(),
    metadata: z.record(z.string(), z.any()).optional(),
    visibility: z.record(z.string(), z.any()).optional(),
  }).passthrough()
});

export const uploadDocSchema = z.object({
  body: z.object({
    clientId: z.string().optional(),
    applicationId: z.string().optional(),
    type: z.string().optional(),
    replaceDocumentId: z.string().optional(),
    expiryDate: z.string().optional(),
    issueDate: z.string().optional(),
    shareWithClient: z.string().optional(),
    shareWithSponsor: z.string().optional(),
    internalOnly: z.string().optional(),
  }).passthrough()
});

export const bulkUploadDocSchema = z.object({
  body: z.object({
    clientId: z.string().optional(),
    applicationId: z.string().optional(),
    type: z.string().optional(),
    expiryDate: z.string().optional(),
    issueDate: z.string().optional(),
    shareWithClient: z.string().optional(),
    shareWithSponsor: z.string().optional(),
    internalOnly: z.string().optional(),
  }).passthrough()
});

export const updateDocSchema = z.object({
  params: idParam,
  body: z.record(z.string(), z.any())
});

export const deleteDocSchema = z.object({ params: idParam });

export const documentVersionsSchema = z.object({ params: idParam });

export const getChecklistSchema = z.object({
  params: z.object({ visaSubclass: z.string() })
});
