import { z } from 'zod';

export const validateInvitationSchema = z.object({
  query: z.object({
    token: z.string().min(1),
    email: z.string().email()
  })
});

export const activateInvitationSchema = z.object({
  body: z.object({
    token: z.string().min(1),
    email: z.string().email(),
    password: z.string().min(6)
  })
});
