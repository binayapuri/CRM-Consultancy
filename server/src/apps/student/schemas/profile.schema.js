import { z } from 'zod';

const addressSchema = z.object({
  street: z.string().optional(),
  suburb: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postcode: z.string().optional(),
  country: z.string().optional()
}).optional();

export const updateProfileSchema = z.object({
  body: z.object({
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    phone: z.string().optional(),
    dob: z.string().optional(),
    gender: z.string().optional(),
    nationality: z.string().optional(),
    countryOfBirth: z.string().optional(),
    maritalStatus: z.string().optional(),
    passportNumber: z.string().optional(),
    passportExpiry: z.string().optional(),
    passportCountry: z.string().optional(),
    address: addressSchema,
    businessName: z.string().optional(),
    abn: z.string().optional(),
    gstRegistered: z.boolean().optional()
  })
});

export const updateStatementSchema = z.object({
  body: z.object({
    initialStatement: z.string()
  })
});

export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().optional(),
    newPassword: z.string().min(6)
  })
});

export const familyMemberSchema = z.object({
  body: z.object({
    relationship: z.string(),
    firstName: z.string(),
    lastName: z.string().optional(),
    dob: z.string().optional(),
    nationality: z.string().optional(),
    passportNumber: z.string().optional(),
    passportExpiry: z.string().optional(),
    includedInApplication: z.boolean().optional(),
    visaStatus: z.string().optional(),
    notes: z.string().optional()
  })
});

export const addressHistorySchema = z.object({
  body: addressSchema.and(z.object({
    from: z.string().optional(),
    to: z.string().optional()
  }))
});

export const noteSchema = z.object({
  body: z.object({
    title: z.string().optional(),
    text: z.string(),
    category: z.string().optional(),
    isPinned: z.boolean().optional(),
    isPrivate: z.boolean().optional(),
    tags: z.array(z.string()).optional()
  })
});
