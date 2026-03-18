import { z } from 'zod';

const idParam = z.object({ id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID') });

export const applyJobSchema = z.object({
  params: idParam,
  body: z.object({
    resumeUrl: z.string().min(1, 'Resume is required'),
    coverLetterUrl: z.string().optional()
  })
});

export const createJobSchema = z.object({
  body: z.object({
    title: z.string().min(1),
    company: z.string().optional(),
    description: z.string().min(1),
    location: z.string().min(1),
    type: z.string().optional(),
    anzscoCode: z.string().optional(),
    salaryRange: z.string().optional(),
    salaryMin: z.number().optional(),
    salaryMax: z.number().optional(),
    expiryDate: z.string().optional(),
    tags: z.array(z.string()).optional(),
    visaSponsorshipAvailable: z.boolean().optional(),
    partTimeAllowed: z.boolean().optional(),
    workRights: z.array(z.string()).optional(),
    experienceLevel: z.string().optional(),
    recruiterEmployerProfileId: z.string().optional()
  })
});

export const updateJobSchema = z.object({
  params: idParam,
  body: z.object({
    title: z.string().min(1).optional(),
    company: z.string().optional(),
    location: z.string().optional(),
    type: z.string().optional(),
    description: z.string().optional(),
    salaryRange: z.string().optional(),
    requirements: z.array(z.string()).optional(),
    visaSponsorshipAvailable: z.boolean().optional(),
    partTimeAllowed: z.boolean().optional(),
    workRights: z.array(z.string()).optional(),
    tags: z.array(z.string()).optional(),
    isActive: z.boolean().optional(),
  })
});

export const updateApplicationStatusSchema = z.object({
  params: idParam,
  body: z.object({
    status: z.string()
  })
});
