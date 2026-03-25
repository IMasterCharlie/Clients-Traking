'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/shared/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  RefreshCw, 
  FileText, 
  Mail, 
  CheckCircle, 
  Trash2,
  Calendar,
  DollarSign
} from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { usePayments } from '@/hooks/use-payments';
import { useCurrency } from '@/hooks/use-currency';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AddPaymentDialog } from '@/components/payments/AddPaymentDialog';
import { InvoiceBuilderDialog } from '@/components/payments/InvoiceBuilderDialog';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';

export default function PaymentsPage() {
  const queryClient = useQueryClient();
  const { data, isLoading, filters, setFilters } = usePayments();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isInvoiceBuilderOpen, setIsInvoiceBuilderOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: string }) => {
      const res = await fetch(`/api/payments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Failed to update status');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      toast.success('Payment status updated');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/payments/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete payment');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      toast.success('Payment deleted');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const sendReminderMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/payments/${id}/send-reminder`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to send reminder');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      toast.success('Reminder sent to client');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-700 border-green-200';
      case 'unpaid': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'overdue': return 'bg-red-100 text-red-700 border-red-200';
      case 'partial': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'refunded': return 'bg-gray-100 text-gray-700 border-gray-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Payments</h1>
            <p className="text-muted-foreground">Manage your revenue, subscriptions, and billing.</p>
          </div>
          <Button onClick={() => setIsAddOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add Payment
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search payments..."
                  className="pl-8"
                  onChange={(e) => setFilters({ ...filters, from: e.target.value })} // Just a placeholder for search
                />
              </div>
              <div className="flex items-center gap-2">
                <Select 
                  value={filters.status || 'all'} 
                  onValueChange={(v) => setFilters({ ...filters, status: v === 'all' ? undefined : v })}
                >
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="unpaid">Unpaid</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                    <SelectItem value="partial">Partial</SelectItem>
                    <SelectItem value="refunded">Refunded</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="icon">
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client / Project</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center">Loading...</TableCell>
                    </TableRow>
                  ) : data?.payments?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center">No payments found.</TableCell>
                    </TableRow>
                  ) : (
                    data?.payments?.map((payment: any) => (
                      <TableRow key={payment._id}>
                        <TableCell>
                          <div className="font-medium">{payment.clientId?.name}</div>
                          <div className="text-xs text-muted-foreground">{payment.projectId?.name}</div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5 capitalize">
                            {payment.isRecurring && <RefreshCw className="h-3 w-3 text-blue-500" />}
                            {payment.type.replace('_', ' ')}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          {new Intl.NumberFormat('en-US', { style: 'currency', currency: payment.currency }).format(payment.amount)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getStatusColor(payment.status)}>
                            {payment.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            {format(new Date(payment.dueDate), 'MMM dd, yyyy')}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {payment.status !== 'paid' && (
                                <DropdownMenuItem onClick={() => updateStatusMutation.mutate({ id: payment._id, status: 'paid' })}>
                                  <CheckCircle className="mr-2 h-4 w-4" /> Mark as Paid
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem onClick={() => {
                                setSelectedPayment(payment);
                                setIsInvoiceBuilderOpen(true);
                              }}>
                                <FileText className="mr-2 h-4 w-4" /> Generate Invoice
                              </DropdownMenuItem>
                              {payment.status !== 'paid' && (
                                <DropdownMenuItem onClick={() => sendReminderMutation.mutate(payment._id)}>
                                  <Mail className="mr-2 h-4 w-4" /> Send Reminder
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive" onClick={() => deleteMutation.mutate(payment._id)}>
                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <AddPaymentDialog open={isAddOpen} onOpenChange={setIsAddOpen} />
      {selectedPayment && (
        <InvoiceBuilderDialog 
          open={isInvoiceBuilderOpen} 
          onOpenChange={setIsInvoiceBuilderOpen} 
          payment={selectedPayment} 
        />
      )}
    </DashboardLayout>
  );
}
