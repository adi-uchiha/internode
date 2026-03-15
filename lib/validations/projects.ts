import { z } from 'zod';

export const createProjectSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  prefix: z.string().min(1).max(10).optional(),
  description: z.string().optional().default(''),
  color: z
    .string()
    .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Invalid hex color')
    .optional()
    .default('#3b82f6'),
  status: z.enum(['active', 'archived', 'completed']).optional().default('active'),
  startDate: z
    .string()
    .datetime()
    .optional()
    .default(() => new Date().toISOString()),
});

export const updateProjectSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  prefix: z.string().min(1).max(10).optional(),
  description: z.string().optional(),
  color: z
    .string()
    .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Invalid hex color')
    .optional(),
  status: z.enum(['active', 'archived', 'completed']).optional(),
  startDate: z.string().datetime().optional(),
});
