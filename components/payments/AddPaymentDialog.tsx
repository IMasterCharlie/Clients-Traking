'use client';

import { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const paymentSchema = z.object({
  clientId: z.string().min(1, 'Client is required'),
  projectId: z.string().min(1, 'Project is required'),
  type: z.enum(['one_time', 'subscription', 'milestone']),
  amount: z.number().min(0.01, 'Amount must be greater than 0'),
  currency: z.string().min(1, 'Currency is required'),
  dueDate: z.string().min(1, 'Due date is required'),
  description: z.string().min(1, 'Description is required'),
  isRecurring: z.boolean().default(false),
  recurringDay: z.number().min(1).max(28).optional(),
  notes: z.string().optional(),
});

interface AddPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddPaymentDialog({ open, onOpenChange }: AddPaymentDialogProps) {
  const queryClient = useQueryClient();
  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      type: 'one_time',
      currency: 'USD',
      isRecurring: false,
      amount: 0,
    }
  });

  const isRecurring = watch('isRecurring');

  const { data: clients } = useQuery({
    queryKey: ['clients-list'],
    queryFn: async () => {
      const res = await fetch('/api/clients');
      const json = await res.json();
      const clients = json.data?.clients;
      return Array.isArray(clients) ? clients : [];
    },
    initialData: [],
  });

  const selectedClientId = watch('clientId');
  const { data: projects } = useQuery({
    queryKey: ['projects-by-client', selectedClientId],
    queryFn: async () => {
      if (!selectedClientId) return [];
      const res = await fetch(`/api/projects?clientId=${selectedClientId}`);
      const json = await res.json();
      const projects = json.data;
      return Array.isArray(projects) ? projects : [];
    },
    enabled: !!selectedClientId,
    initialData: [],
  });

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create payment');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      toast.success('Payment created successfully');
      onOpenChange(false);
      reset();
    },
    onError: (err: any) => toast.error(err.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Payment</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Client</Label>
              <Select onValueChange={(v) => setValue('clientId', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select client" />
                </SelectTrigger>
                <SelectContent>
                  {clients?.map((c: any) => (
                    <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.clientId && <p className="text-xs text-destructive">{errors.clientId.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Project</Label>
              <Select onValueChange={(v) => setValue('projectId', v)} disabled={!selectedClientId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {projects?.map((p: any) => (
                    <SelectItem key={p._id} value={p._id}>{p.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.projectId && <p className="text-xs text-destructive">{errors.projectId.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select defaultValue="one_time" onValueChange={(v: any) => setValue('type', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="one_time">One Time</SelectItem>
                  <SelectItem value="subscription">Subscription</SelectItem>
                  <SelectItem value="milestone">Milestone</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Amount</Label>
              <Input 
                type="number" 
                step="0.01" 
                placeholder="0.00" 
                {...register('amount', { valueAsNumber: true })} 
              />
              {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Currency</Label>
              <Input {...register('currency')} defaultValue="USD" />
            </div>
            <div className="space-y-2">
              <Label>Due Date</Label>
              <Input type="date" {...register('dueDate')} />
              {errors.dueDate && <p className="text-xs text-destructive">{errors.dueDate.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Input placeholder="e.g. Monthly Maintenance - March" {...register('description')} />
            {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox 
              id="isRecurring" 
              checked={isRecurring} 
              onCheckedChange={(checked) => setValue('isRecurring', !!checked)} 
            />
            <Label htmlFor="isRecurring">Recurring Payment</Label>
          </div>

          {isRecurring && (
            <div className="space-y-2">
              <Label>Day of Month (1-28)</Label>
              <Input 
                type="number" 
                min="1" 
                max="28" 
                {...register('recurringDay', { valueAsNumber: true })} 
              />
              {errors.recurringDay && <p className="text-xs text-destructive">{errors.recurringDay.message}</p>}
            </div>
          )}

          <div className="space-y-2">
            <Label>Notes (Internal)</Label>
            <Textarea placeholder="Optional notes..." {...register('notes')} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Creating...' : 'Create Payment'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
