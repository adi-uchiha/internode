import { z } from 'zod';

export const createLeaveSchema = z.object({
  type: z.enum(['vacation', 'sick', 'personal', 'other']),
  date: z.string().datetime(),
  reason: z.string().optional().default(''),
});

export const updateLeaveSchema = z.object({
  type: z.enum(['vacation', 'sick', 'personal', 'other']).optional(),
  date: z.string().datetime().optional(),
  reason: z.string().optional(),
  status: z.enum(['pending', 'approved', 'rejected']).optional(),
});
