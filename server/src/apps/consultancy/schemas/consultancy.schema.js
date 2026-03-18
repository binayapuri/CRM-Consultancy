import { z } from 'zod';

export const signatureSchema = z.object({
  // Multer handles the file. We just validate that the auth exists.
  body: z.any().optional()
});

export const searchSchema = z.object({
  query: z.object({
    q: z.string().optional(),
    specialization: z.string().optional(),
    state: z.string().optional()
  })
});

export const getByIdSchema = z.object({
  params: z.object({ id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID') })
});

export const registerConsultancySchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(6),
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    marnNumber: z.union([z.string(), z.number()]),
    consultancyName: z.string().min(1),
    abn: z.string().optional(),
    phone: z.string().optional()
  })
});

export const createConsultancySchema = z.object({
  body: z.record(z.any()) // Flexible for Super Admin raw creation for now
});

export const updateConsultancySchema = z.object({
  body: z.object({
    consultancyId: z.string().optional(),
    emailProfiles: z.array(z.any()).optional()
  }).passthrough()
});

export const updateByIdSchema = z.object({
  params: z.object({ id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID') }),
  body: z.record(z.any())
});

export const deleteConsultancySchema = z.object({
  params: z.object({ id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID') })
});
