import { z } from 'zod';

export const createClientSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  company: z.string().optional(),
  country: z.string().optional(),
  currency: z.string().min(1, 'Currency is required'),
  taxId: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export const updateClientSchema = createClientSchema.partial().extend({
  status: z.enum(['active', 'inactive', 'archived']).optional(),
  notes: z.string().optional(),
  portalEnabled: z.boolean().optional(),
});

export const commsSchema = z.object({
  type: z.enum(['call', 'email', 'meeting', 'note', 'whatsapp']),
  subject: z.string().min(1, 'Subject is required'),
  body: z.string().min(1, 'Body is required'),
  date: z.string().min(1, 'Date is required'),
  followUpDate: z.string().optional(),
});
