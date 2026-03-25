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
import { Textarea } from '@/components/ui/textarea';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Trash2, Plus, Calculator } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface InvoiceBuilderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payment: any;
}

export function InvoiceBuilderDialog({ open, onOpenChange, payment }: InvoiceBuilderDialogProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [lineItems, setLineItems] = useState<any[]>([]);
  const [taxRate, setTaxRate] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');

  // Fetch unbilled timelogs for the project
  const { data: unbilledLogs } = useQuery({
    queryKey: ['unbilled-logs', payment.projectId?._id],
    queryFn: async () => {
      if (!payment.projectId?._id) return [];
      const res = await fetch(`/api/projects/${payment.projectId._id}/timelogs?billable=true&invoiceId=null`);
      const data = await res.json();
      return data.timelogs || [];
    },
    enabled: !!payment.projectId?._id
  });

  useEffect(() => {
    if (payment) {
      const initialItems = [
        {
          description: payment.description,
          quantity: 1,
          unitPrice: payment.amount,
          total: payment.amount
        }
      ];

      // Add unbilled logs if any
      if (unbilledLogs?.length > 0) {
        const logsTotal = unbilledLogs.reduce((acc: number, log: any) => acc + (log.hours * 50), 0); // Assuming $50/hr default
        initialItems.push({
          description: `Billable Hours (${unbilledLogs.length} logs)`,
          quantity: unbilledLogs.reduce((acc: number, log: any) => acc + log.hours, 0),
          unitPrice: 50,
          total: logsTotal
        });
      }

      setLineItems(initialItems);
      setDueDate(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]); // 14 days from now
    }
  }, [payment, unbilledLogs]);

  const subtotal = lineItems.reduce((acc, item) => acc + item.total, 0);
  const taxAmount = (subtotal * taxRate) / 100;
  const total = subtotal + taxAmount - discount;

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...lineItems];
    newItems[index][field] = value;
    if (field === 'quantity' || field === 'unitPrice') {
      newItems[index].total = newItems[index].quantity * newItems[index].unitPrice;
    }
    setLineItems(newItems);
  };

  const addItem = () => {
    setLineItems([...lineItems, { description: '', quantity: 1, unitPrice: 0, total: 0 }]);
  };

  const removeItem = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) {
        if (res.status === 401) throw new Error('Session expired — please log in again');
        throw new Error(json.error || json.message || 'Failed to create invoice');
      }
      return json;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('Invoice draft created');
      onOpenChange(false);
      router.push(`/payments/invoices/${data._id}`);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const handleCreate = () => {
    mutation.mutate({
      clientId: payment.clientId._id,
      projectId: payment.projectId?._id,
      lineItems,
      taxRate,
      discount,
      dueDate,
      notes,
      currency: payment.currency
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Generate Invoice</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Client</Label>
              <div className="font-medium">{payment.clientId?.name}</div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Project</Label>
              <div className="font-medium">{payment.projectId?.name || 'N/A'}</div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Line Items</Label>
              <Button type="button" variant="outline" size="sm" onClick={addItem}>
                <Plus className="mr-2 h-3 w-3" /> Add Item
              </Button>
            </div>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50%]">Description</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Unit Price</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lineItems.map((item, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <Input 
                          value={item.description} 
                          onChange={(e) => updateItem(i, 'description', e.target.value)}
                        />
                      </TableCell>
                      <TableCell>
                        <Input 
                          type="number" 
                          className="w-20"
                          value={item.quantity} 
                          onChange={(e) => updateItem(i, 'quantity', parseFloat(e.target.value) || 0)}
                        />
                      </TableCell>
                      <TableCell>
                        <Input 
                          type="number" 
                          className="w-24"
                          value={item.unitPrice} 
                          onChange={(e) => updateItem(i, 'unitPrice', parseFloat(e.target.value) || 0)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        {item.total.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => removeItem(i)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Due Date</Label>
                <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea 
                  placeholder="Payment instructions, etc." 
                  value={notes} 
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-3 bg-muted/50 p-4 rounded-lg">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>{payment.currency} {subtotal.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <Label className="text-sm">Tax Rate (%)</Label>
                <Input 
                  type="number" 
                  className="w-20 h-8" 
                  value={taxRate} 
                  onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="flex items-center justify-between gap-4">
                <Label className="text-sm">Discount</Label>
                <Input 
                  type="number" 
                  className="w-24 h-8" 
                  value={discount} 
                  onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="border-t pt-3 flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>{payment.currency} {total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleCreate} disabled={mutation.isPending}>
            <Calculator className="mr-2 h-4 w-4" /> Create Draft Invoice
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
