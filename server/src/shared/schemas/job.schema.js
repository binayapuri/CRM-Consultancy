import { z } from 'zod';

const idParam = z.object({ id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID') });

export const applyJobSchema = z.object({
  params: idParam,
  body: z
    .object({
      resumeUrl: z.string().optional(),
      resumeText: z.string().optional(),
      coverLetterUrl: z.string().optional(),
      coverLetterText: z.string().max(12000).optional(),
    })
    .refine(
      (b) =>
        (typeof b.resumeUrl === 'string' && b.resumeUrl.trim().length > 0) ||
        (typeof b.resumeText === 'string' && b.resumeText.trim().length >= 20),
      { message: 'Provide a resume document URL or paste resume text (at least 20 characters)' }
    ),
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
    recruiterEmployerProfileId: z.string().optional(),
    goLiveAt: z.union([z.string(), z.null()]).optional(),
    listingEndsAt: z.union([z.string(), z.null()]).optional(),
    companyLogoUrl: z.string().optional(),
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
    goLiveAt: z.union([z.string(), z.null()]).optional(),
    listingEndsAt: z.union([z.string(), z.null()]).optional(),
    companyLogoUrl: z.string().optional(),
    recruiterEmployerProfileId: z.string().optional(),
    anzscoCode: z.string().optional(),
    moderationState: z.enum(['ACTIVE', 'FLAGGED', 'REMOVED']).optional(),
  })
});

export const updateApplicationStatusSchema = z.object({
  params: idParam,
  body: z.object({
    status: z.string()
  })
});
