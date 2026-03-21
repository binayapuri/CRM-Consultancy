import { z } from 'zod';

export const getAuditLogsSchema = z.object({
  query: z.object({
    clientId: z.string().optional(),
    entityType: z.string().optional(),
    userId: z.string().optional(),
    assignedAgentId: z.string().optional(),
    visaSubclass: z.string().optional(),
    dateFrom: z.string().optional(),
    dateTo: z.string().optional(),
    page: z.string().transform(Number).optional(),
    limit: z.string().transform(Number).optional(),
    consultancyId: z.string().optional()
  })
});

export const getAuditLogsByDateSchema = z.object({
  query: z.object({
    date: z.string()
  })
});
