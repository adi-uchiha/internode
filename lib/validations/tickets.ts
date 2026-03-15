import { z } from 'zod';

export const createTicketSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().optional(),
  status: z.enum(['todo', 'in-progress', 'done', 'backlog']).default('todo'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  projectIds: z.array(z.string()).optional().default([]),
  assigneeId: z.string().nullable().optional().default(null),
  estimatedHours: z.number().min(0).optional().default(0),
  dueDate: z.string().datetime().nullable().optional().default(null),
  labels: z.array(z.string()).optional().default([]),
});

export const updateTicketSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  status: z.enum(['todo', 'in-progress', 'done', 'backlog']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  projectIds: z.array(z.string()).optional(),
  assigneeId: z.string().nullable().optional(),
  estimatedHours: z.number().min(0).optional(),
  dueDate: z.string().datetime().nullable().optional(),
  labels: z.array(z.string()).optional(),
  addLoggedHours: z.number().min(0).optional(),
});

export const logTimeSchema = z.object({
  hours: z.number().positive('Hours must be positive'),
  note: z.string().optional(),
  isBreakthrough: z.boolean().optional().default(false),
  date: z
    .string()
    .datetime()
    .optional()
    .default(() => new Date().toISOString()),
});

export const createCommentSchema = z.object({
  content: z.string().min(1, 'Comment content is required'),
});
