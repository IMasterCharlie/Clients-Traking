import { z } from 'zod';

export const createProjectSchema = z.object({
  clientId: z.string().min(1, 'Client is required'),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  status: z.enum(['active', 'maintenance', 'completed', 'pending_payment', 'paused']).default('active'),
  type: z.enum(['one_time', 'retainer', 'monthly_maintenance']).default('one_time'),
  startDate: z.string().optional().or(z.date()),
  deadline: z.string().optional().or(z.date()),
  liveUrl: z.string().url().optional().or(z.literal('')),
  stagingUrl: z.string().url().optional().or(z.literal('')),
  techStack: z.array(z.string()).default([]),
  color: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
});

export const updateProjectSchema = createProjectSchema.partial().extend({
  notes: z.string().optional(),
  onboardingDone: z.array(z.string()).optional(),
});

export const taskSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  status: z.enum(['todo', 'in_progress', 'done']).default('todo'),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  dueDate: z.string().optional().or(z.date()),
  order: z.number().optional(),
});

export const timeLogSchema = z.object({
  date: z.string().or(z.date()).default(new Date()),
  hours: z.number().min(0.1, 'Hours must be at least 0.1'),
  description: z.string().optional(),
  billable: z.boolean().default(true),
});
