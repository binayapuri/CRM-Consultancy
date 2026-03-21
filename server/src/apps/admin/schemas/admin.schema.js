import { z } from 'zod';

export const verifySchema = z.object({
  params: z.object({
    type: z.enum(['CONSULTANCY', 'EMPLOYER', 'INSURER']),
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID'),
  }),
  body: z.object({
    action: z.enum(['APPROVE', 'REJECT']),
  }),
});

export const updateStudentSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid student ID'),
  }),
  body: z.object({
    isActive: z.boolean().optional(),
  }),
});

export const updateSettingsSchema = z.object({
  body: z.object({
    smtp: z.object({
      pass: z.string().optional(),
    }).passthrough().optional(),
    auth: z.object({
      google: z.object({
        clientSecret: z.string().optional(),
      }).passthrough().optional(),
      apple: z.object({
        privateKey: z.string().optional(),
      }).passthrough().optional(),
    }).passthrough().optional(),
    notifications: z.record(z.string(), z.any()).optional(),
  }).passthrough(),
});
