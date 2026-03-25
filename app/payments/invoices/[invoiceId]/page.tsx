'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import DashboardLayout from '@/components/shared/DashboardLayout';
import { InvoicePreview } from '@/components/payments/InvoicePreview';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  ArrowLeft,
  Printer,
  MoreVertical,
  Trash2,
  CheckCircle,
  Send,
  Clock,
  FileText,
} from 'lucide-react';
import { toast } from 'sonner';

const statusConfig: Record<string, { label: string; className: string }> = {
  draft:   { label: 'Draft',   className: 'bg-slate-100 text-slate-600 border-slate-200' },
  sent:    { label: 'Sent',    className: 'bg-blue-100 text-blue-700 border-blue-200' },
  paid:    { label: 'Paid',    className: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  overdue: { label: 'Overdue', className: 'bg-rose-100 text-rose-700 border-rose-200' },
};

export default function InvoiceDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const invoiceId = params.invoiceId as string;

  const { data: invoice, isLoading, isError } = useQuery({
    queryKey: ['invoice', invoiceId],
    queryFn: async () => {
      const res = await fetch(`/api/invoices/${invoiceId}`);
      if (!res.ok) throw new Error('Failed to load invoice');
      return res.json();
    },
  });

  const statusMutation = useMutation({
    mutationFn: async (status: string) => {
      const res = await fetch(`/api/invoices/${invoiceId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Failed to update status');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoice', invoiceId] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('Invoice status updated');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/invoices/${invoiceId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete invoice');
      return res.json();
    },
    onSuccess: () => {
      toast.success('Invoice deleted');
      router.push('/payments');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const handlePrint = () => window.print();

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="p-6 max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-[600px] w-full rounded-xl" />
        </div>
      </DashboardLayout>
    );
  }

  if (isError || !invoice) {
    return (
      <DashboardLayout>
        <div className="p-6 max-w-4xl mx-auto flex flex-col items-center justify-center py-24 text-slate-400">
          <FileText className="w-16 h-16 mb-4 opacity-20" />
          <p className="text-xl font-bold">Invoice not found</p>
          <Button variant="outline" className="mt-6" onClick={() => router.push('/payments')}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Payments
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const status = statusConfig[invoice.status] ?? statusConfig.draft;

  return (
    <DashboardLayout>
      {/* ── Toolbar — hidden when printing ── */}
      <div className="print:hidden p-4 md:p-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          {/* Left */}
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900">
                  Invoice #{invoice.invoiceNumber}
                </h1>
                <Badge variant="outline" className={status.className}>
                  {status.label}
                </Badge>
              </div>
              <p className="text-sm text-slate-500">{invoice.clientId?.name}</p>
            </div>
          </div>

          {/* Right */}
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-2" /> Print / Save PDF
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {invoice.status === 'draft' && (
                  <DropdownMenuItem onClick={() => statusMutation.mutate('sent')}>
                    <Send className="w-4 h-4 mr-2 text-blue-500" />
                    Mark as Sent
                  </DropdownMenuItem>
                )}
                {invoice.status !== 'paid' && (
                  <DropdownMenuItem onClick={() => statusMutation.mutate('paid')}>
                    <CheckCircle className="w-4 h-4 mr-2 text-emerald-500" />
                    Mark as Paid
                  </DropdownMenuItem>
                )}
                {invoice.status !== 'overdue' && invoice.status !== 'paid' && (
                  <DropdownMenuItem onClick={() => statusMutation.mutate('overdue')}>
                    <Clock className="w-4 h-4 mr-2 text-rose-500" />
                    Mark as Overdue
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <DropdownMenuItem
                      className="text-rose-600 focus:text-rose-600"
                      onSelect={(e) => e.preventDefault()}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Invoice
                    </DropdownMenuItem>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete this invoice?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. Only draft invoices can be deleted.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-rose-600 hover:bg-rose-700"
                        onClick={() => deleteMutation.mutate()}
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* ── Invoice Preview ── */}
        <InvoicePreview invoice={invoice} />
      </div>

      {/* ── Print-only view (no sidebar chrome) ── */}
      <div className="hidden print:block p-0">
        <InvoicePreview invoice={invoice} />
      </div>
    </DashboardLayout>
  );
}
