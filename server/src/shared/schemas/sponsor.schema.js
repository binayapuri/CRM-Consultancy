import { z } from 'zod';

const idParam = z.object({ id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID') });

export const createSponsorSchema = z.object({
  body: z.record(z.any())
});

export const updateSponsorSchema = z.object({
  params: idParam,
  body: z.record(z.any())
});

export const getSponsorsSchema = z.object({
  query: z.object({ consultancyId: z.string().optional() })
});
