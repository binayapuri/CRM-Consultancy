import { z } from 'zod';

const idParam = z.object({ id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID') });

export const getCollegesSchema = z.object({
  query: z.object({
    q: z.string().optional(),
    type: z.string().optional(),
    state: z.string().optional(),
    city: z.string().optional(),
    feeMin: z.string().optional(),
    feeMax: z.string().optional(),
    consultancyId: z.string().optional()
  })
});

export const compareCollegesSchema = z.object({
  query: z.object({ ids: z.string() })
});

export const createCollegeSchema = z.object({
  body: z.record(z.string(), z.any())
});

export const updateCollegeSchema = z.object({
  params: idParam,
  body: z.record(z.string(), z.any())
});

// Universities & Courses
export const createUniversitySchema = z.object({
  body: z.record(z.string(), z.any())
});

export const updateUniversitySchema = z.object({
  params: idParam,
  body: z.record(z.string(), z.any())
});

export const createCourseSchema = z.object({
  params: idParam, // universityId
  body: z.record(z.string(), z.any())
});

export const updateCourseSchema = z.object({
  params: z.object({ courseId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID') }),
  body: z.record(z.string(), z.any())
});
