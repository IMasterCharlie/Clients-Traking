'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createProjectSchema } from '@/lib/validations/project';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X, Plus, ChevronRight, ChevronLeft } from 'lucide-react';

export function NewProjectDialog({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [techInput, setTechInput] = useState('');
  const queryClient = useQueryClient();

  const { data: clientsRes } = useQuery({
    queryKey: ['clients-list'],
    queryFn: async () => {
      const res = await fetch('/api/clients');
      const json = await res.json();
      const clients = json.data?.clients;
      return Array.isArray(clients) ? clients : [];
    },
    initialData: [],
  });


  const form = useForm({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      title: '',
      clientId: '',
      description: '',
      status: 'active',
      type: 'one_time',
      startDate: '',
      deadline: '',
      liveUrl: '',
      stagingUrl: '',
      techStack: [] as string[],
      color: '#4f46e5',
    },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Project created successfully');
      setOpen(false);
      form.reset();
      setStep(1);
    },
    onError: (err: any) => {
      toast.error(err.message);
    },
  });

  const onSubmit = (data: any) => {
    mutate(data);
  };

  const addTech = () => {
    if (!techInput.trim()) return;
    const current = form.getValues('techStack');
    if (!current.includes(techInput.trim())) {
      form.setValue('techStack', [...current, techInput.trim()]);
    }
    setTechInput('');
  };

  const removeTech = (tech: string) => {
    const current = form.getValues('techStack');
    form.setValue('techStack', current.filter(t => t !== tech));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">New Project</DialogTitle>
          <div className="flex gap-2 mt-2">
            {[1, 2, 3].map(s => (
              <div
                key={s}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  s <= step ? 'bg-indigo-600' : 'bg-slate-200'
                }`}
              />
            ))}
          </div>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="space-y-2">
                <Label htmlFor="title">Project Title</Label>
                <Input id="title" {...form.register('title')} placeholder="e.g. E-commerce Website" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="clientId">Client</Label>
                <Select onValueChange={v => form.setValue('clientId', v)} defaultValue={form.getValues('clientId')}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clientsRes?.map((client: any) => (
                      <SelectItem key={client._id} value={client._id}>
                        {client.name} {client.company ? `(${client.company})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" {...form.register('description')} placeholder="Brief overview of the project" />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input id="startDate" type="date" {...form.register('startDate')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deadline">Deadline</Label>
                  <Input id="deadline" type="date" {...form.register('deadline')} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Project Type</Label>
                <Select onValueChange={v => form.setValue('type', v as any)} defaultValue={form.getValues('type')}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="one_time">One-Time Project</SelectItem>
                    <SelectItem value="retainer">Retainer</SelectItem>
                    <SelectItem value="monthly_maintenance">Monthly Maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="color">Brand Color</Label>
                <div className="flex gap-2">
                  <Input id="color" type="color" {...form.register('color')} className="w-12 p-1 h-10" />
                  <Input value={form.watch('color')} onChange={e => form.setValue('color', e.target.value)} className="flex-1" />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="space-y-2">
                <Label>Tech Stack</Label>
                <div className="flex gap-2">
                  <Input
                    value={techInput}
                    onChange={e => setTechInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTech())}
                    placeholder="e.g. Next.js, Tailwind, MongoDB"
                  />
                  <Button type="button" variant="secondary" onClick={addTech}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {form.watch('techStack').map(tech => (
                    <Badge key={tech} variant="secondary" className="pl-2 pr-1 py-1 flex items-center gap-1">
                      {tech}
                      <button type="button" onClick={() => removeTech(tech)} className="hover:text-rose-500">
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="liveUrl">Live URL (Optional)</Label>
                <Input id="liveUrl" {...form.register('liveUrl')} placeholder="https://example.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stagingUrl">Staging URL (Optional)</Label>
                <Input id="stagingUrl" {...form.register('stagingUrl')} placeholder="https://staging.example.com" />
              </div>
            </div>
          )}

          <DialogFooter className="mt-6 flex justify-between sm:justify-between">
            {step > 1 ? (
              <Button type="button" variant="outline" onClick={() => setStep(s => s - 1)}>
                <ChevronLeft className="w-4 h-4 mr-2" /> Back
              </Button>
            ) : (
              <div />
            )}
            {step < 3 ? (
              <Button type="button" onClick={() => setStep(s => s + 1)}>
                Next <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Creating...' : 'Create Project'}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
