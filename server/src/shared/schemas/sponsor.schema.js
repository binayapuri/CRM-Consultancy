import { z } from 'zod';

const idParam = z.object({ id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID') });

export const createSponsorSchema = z.object({
  body: z.object({}).passthrough()
});

export const updateSponsorSchema = z.object({
  params: idParam,
  body: z.object({}).passthrough()
});

export const getSponsorsSchema = z.object({
  query: z.object({ consultancyId: z.string().optional() })
});
