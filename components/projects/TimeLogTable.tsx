'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2, Plus, Clock, DollarSign, FileText } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface TimeLogTableProps {
  projectId: string;
  timelogs: any[];
  summary: any;
}

export function TimeLogTable({ projectId, timelogs, summary }: TimeLogTableProps) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const createLogMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(`/api/projects/${projectId}/timelogs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      toast.success('Time logged successfully');
      setOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.message);
    },
  });

  const deleteLogMutation = useMutation({
    mutationFn: async (logId: string) => {
      const res = await fetch(`/api/projects/${projectId}/timelogs/${logId}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      toast.success('Time log deleted');
    },
    onError: (err: any) => {
      toast.error(err.message);
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      date: formData.get('date'),
      hours: parseFloat(formData.get('hours') as string),
      description: formData.get('description'),
      billable: formData.get('billable') === 'on',
    };
    createLogMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="bg-indigo-50 p-3 rounded-lg">
            <Clock className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Hours</p>
            <p className="text-2xl font-bold text-slate-900">{summary.totalHours.toFixed(1)}</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="bg-emerald-50 p-3 rounded-lg">
            <DollarSign className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Billable Hours</p>
            <p className="text-2xl font-bold text-slate-900">{summary.billableHours.toFixed(1)}</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="bg-amber-50 p-3 rounded-lg">
            <FileText className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Unbilled Billable</p>
            <p className="text-2xl font-bold text-slate-900">{summary.unbilledBillableHours.toFixed(1)}</p>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-slate-800">Time Logs</h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-indigo-600 hover:bg-indigo-700">
              <Plus className="w-4 h-4 mr-2" /> Log Time
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">Log Time</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input id="date" name="date" type="date" defaultValue={new Date().toISOString().split('T')[0]} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hours">Hours</Label>
                  <Input id="hours" name="hours" type="number" step="0.1" min="0.1" placeholder="e.g. 1.5" required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" placeholder="What did you work on?" required />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="billable" name="billable" defaultChecked />
                <Label htmlFor="billable" className="text-sm font-medium leading-none cursor-pointer">
                  Billable to client
                </Label>
              </div>
              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createLogMutation.isPending}>
                  {createLogMutation.isPending ? 'Logging...' : 'Log Time'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50/50">
            <TableRow>
              <TableHead className="font-bold">Date</TableHead>
              <TableHead className="font-bold">Description</TableHead>
              <TableHead className="font-bold text-center">Hours</TableHead>
              <TableHead className="font-bold text-center">Billable</TableHead>
              <TableHead className="font-bold text-center">Status</TableHead>
              <TableHead className="text-right font-bold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {timelogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-slate-400">
                  No time logs found for this project.
                </TableCell>
              </TableRow>
            ) : (
              timelogs.map((log) => (
                <TableRow key={log._id} className={log.billable && !log.invoiceId ? 'bg-amber-50/30' : ''}>
                  <TableCell className="font-medium">{format(new Date(log.date), 'MMM d, yyyy')}</TableCell>
                  <TableCell className="max-w-[300px] truncate" title={log.description}>{log.description}</TableCell>
                  <TableCell className="text-center font-bold">{log.hours.toFixed(1)}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline" className={log.billable ? 'text-emerald-600 border-emerald-200 bg-emerald-50' : 'text-slate-400 border-slate-200 bg-slate-50'}>
                      {log.billable ? 'Yes' : 'No'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    {log.invoiceId ? (
                      <Badge variant="secondary" className="bg-indigo-50 text-indigo-600 border-indigo-100">Invoiced</Badge>
                    ) : (
                      <Badge variant="outline" className="text-slate-400 border-slate-200">Unbilled</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-slate-400 hover:text-rose-500"
                      onClick={() => deleteLogMutation.mutate(log._id)}
                      disabled={deleteLogMutation.isPending}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
