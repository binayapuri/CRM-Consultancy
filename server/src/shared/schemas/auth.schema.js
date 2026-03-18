import { z } from 'zod';

export const forgotPasswordSchema = z.object({
  body: z.object({ email: z.string().email() })
});

export const resetPasswordSchema = z.object({
  body: z.object({
    token: z.string(),
    email: z.string().email(),
    newPassword: z.string().min(6)
  })
});

export const sendOtpSchema = z.object({
  body: z.object({ phone: z.string().min(8) })
});

export const verifyOtpSchema = z.object({
  body: z.object({
    phone: z.string().min(8),
    code: z.string().length(6)
  })
});

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(6),
    role: z.string().optional(),
    profile: z.record(z.any()).optional()
  })
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string()
  })
});

export const updateMeSchema = z.object({
  body: z.object({
    profile: z.record(z.any()).optional()
  })
});

export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string(),
    newPassword: z.string().min(6)
  })
});
