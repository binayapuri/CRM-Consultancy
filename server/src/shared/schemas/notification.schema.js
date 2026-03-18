import { z } from 'zod';

const idParam = z.object({ id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID') });

export const sendNotificationSchema = z.object({
  body: z.object({
    clientId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID'),
    type: z.string().optional(),
    title: z.string().optional(),
    message: z.string().optional()
  })
});

export const readNotificationSchema = z.object({
  params: idParam
});
