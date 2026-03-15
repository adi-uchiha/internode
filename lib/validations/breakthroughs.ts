import { z } from 'zod';

export const createBreakthroughSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().min(1, 'Description is required'),
  skillTags: z.array(z.string().regex(/^#/, 'Tags must start with #')).optional().default([]),
  prLink: z
    .string()
    .url('Invalid URL format')
    .refine(
      (val) => val.startsWith('https://github.com/') || val.startsWith('https://gitlab.com/'),
      'PR link must be a GitHub or GitLab URL'
    )
    .optional()
    .nullable(),
  projectId: z.string().optional().nullable(),
  date: z
    .string()
    .datetime()
    .optional()
    .default(() => new Date().toISOString()),
});

export const updateBreakthroughSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().min(1).optional(),
  skillTags: z.array(z.string().regex(/^#/, 'Tags must start with #')).optional(),
  prLink: z
    .string()
    .url('Invalid URL format')
    .refine(
      (val) => val.startsWith('https://github.com/') || val.startsWith('https://gitlab.com/'),
      'PR link must be a GitHub or GitLab URL'
    )
    .optional()
    .nullable(),
  projectId: z.string().optional().nullable(),
  date: z.string().datetime().optional(),
});
