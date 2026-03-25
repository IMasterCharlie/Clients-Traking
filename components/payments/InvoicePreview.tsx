'use client';

import { format } from 'date-fns';

interface InvoicePreviewProps {
  invoice: any;
}

export function InvoicePreview({ invoice }: InvoicePreviewProps) {
  if (!invoice) return null;

  const fmt = (n: number) =>
    `${invoice.currency ?? 'INR'} ${Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="bg-white w-full shadow-xl rounded-lg overflow-hidden font-sans print:shadow-none print:rounded-none">

      {/* ── TOP HEADER BAR ── */}
      <div className="relative flex items-stretch min-h-[90px]">
        {/* Left purple block — brand */}
        <div className="bg-[#1e1b4b] flex items-center px-8 py-5 w-[45%]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-violet-500 flex items-center justify-center">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
              </svg>
            </div>
            <div>
              <div className="text-white font-bold text-lg leading-tight">DevManager Pro</div>
              <div className="text-violet-300 text-xs">Professional Invoicing</div>
            </div>
          </div>
        </div>

        {/* Right dark block — INVOICE label */}
        <div className="bg-[#312e81] flex-1 flex items-center justify-end px-8 py-5">
          <div className="text-right">
            <h1 className="text-4xl font-extrabold tracking-widest text-violet-300 uppercase">INVOICE</h1>
          </div>
        </div>

        {/* Diagonal divider SVG overlay */}
        <div className="absolute inset-0 pointer-events-none" style={{ left: '43%', width: '60px' }}>
          <svg viewBox="0 0 60 90" preserveAspectRatio="none" className="w-full h-full">
            <polygon points="0,0 60,0 60,90 0,0" fill="#312e81" />
          </svg>
        </div>
      </div>

      {/* ── INVOICE META ── */}
      <div className="flex justify-between items-start px-8 pt-7 pb-5 border-b border-slate-100">
        {/* Bill To */}
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Invoice to:</p>
          <p className="text-lg font-bold text-slate-900">{invoice.clientId?.name ?? '—'}</p>
          {invoice.clientId?.company && (
            <p className="text-sm text-slate-500">{invoice.clientId.company}</p>
          )}
          {invoice.clientId?.email && (
            <p className="text-sm text-slate-500">{invoice.clientId.email}</p>
          )}
          {invoice.clientId?.phone && (
            <p className="text-sm text-slate-500">{invoice.clientId.phone}</p>
          )}
        </div>

        {/* Invoice meta */}
        <div className="text-right space-y-1.5">
          <div className="flex justify-end gap-6">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Invoice #</span>
            <span className="text-sm font-bold text-slate-800">{invoice.invoiceNumber}</span>
          </div>
          <div className="flex justify-end gap-6">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Date</span>
            <span className="text-sm text-slate-600">
              {invoice.issueDate ? format(new Date(invoice.issueDate), 'dd / MM / yyyy') : '—'}
            </span>
          </div>
          <div className="flex justify-end gap-6">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Due Date</span>
            <span className="text-sm font-semibold text-violet-700">
              {invoice.dueDate ? format(new Date(invoice.dueDate), 'dd / MM / yyyy') : '—'}
            </span>
          </div>
          {invoice.projectId?.title && (
            <div className="flex justify-end gap-6">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Project</span>
              <span className="text-sm text-slate-600">{invoice.projectId.title}</span>
            </div>
          )}
        </div>
      </div>

      {/* ── LINE ITEMS TABLE ── */}
      <div className="px-8 pt-5 pb-3">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#1e1b4b] text-white">
              <th className="py-3 px-4 text-left font-semibold rounded-tl-md w-12">SL.</th>
              <th className="py-3 px-4 text-left font-semibold">Item Description</th>
              <th className="py-3 px-4 text-center font-semibold">Price</th>
              <th className="py-3 px-4 text-center font-semibold">Qty.</th>
              <th className="py-3 px-4 text-right font-semibold rounded-tr-md">Total</th>
            </tr>
          </thead>
          <tbody>
            {invoice.lineItems?.map((item: any, i: number) => (
              <tr
                key={i}
                className={i % 2 === 0 ? 'bg-white' : 'bg-violet-50/60'}
              >
                <td className="py-3 px-4 text-slate-400 font-medium text-center">{i + 1}</td>
                <td className="py-3 px-4 text-slate-800">{item.description}</td>
                <td className="py-3 px-4 text-center text-slate-600">
                  {fmt(item.unitPrice)}
                </td>
                <td className="py-3 px-4 text-center text-slate-600">{item.quantity}</td>
                <td className="py-3 px-4 text-right font-semibold text-slate-800">
                  {fmt(item.total)}
                </td>
              </tr>
            ))}
            {/* Empty rows for visual padding (min 5 rows) */}
            {Array.from({ length: Math.max(0, 4 - (invoice.lineItems?.length ?? 0)) }).map((_, i) => (
              <tr key={`empty-${i}`} className={((invoice.lineItems?.length ?? 0) + i) % 2 === 0 ? 'bg-white' : 'bg-violet-50/60'}>
                <td className="py-3 px-4">&nbsp;</td>
                <td className="py-3 px-4"></td>
                <td className="py-3 px-4"></td>
                <td className="py-3 px-4"></td>
                <td className="py-3 px-4"></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── THANK YOU + TOTALS ── */}
      <div className="flex justify-between items-end px-8 pt-4 pb-6">
        {/* Left — thank you + payment info */}
        <div className="max-w-[55%]">
          <p className="text-sm font-bold text-slate-700 mb-3">Thank you for your business</p>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Payment Info:</p>
          <div className="text-xs text-slate-500 space-y-0.5">
            <p><span className="text-slate-400 w-20 inline-block">Account:</span> Add your bank details in Settings</p>
            <p><span className="text-slate-400 w-20 inline-block">A/C Name:</span> {invoice.clientId?.name}</p>
          </div>
          {invoice.notes && (
            <div className="mt-3">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Notes:</p>
              <p className="text-xs text-slate-500">{invoice.notes}</p>
            </div>
          )}
        </div>

        {/* Right — totals */}
        <div className="w-56 space-y-1.5">
          <div className="flex justify-between text-sm text-slate-600">
            <span>Sub Total:</span>
            <span className="font-medium">{fmt(invoice.subtotal ?? 0)}</span>
          </div>
          {(invoice.taxRate ?? 0) > 0 && (
            <div className="flex justify-between text-sm text-slate-600">
              <span>Tax ({invoice.taxRate}%):</span>
              <span className="font-medium">{fmt(invoice.taxAmount ?? 0)}</span>
            </div>
          )}
          {(invoice.taxRate ?? 0) === 0 && (
            <div className="flex justify-between text-sm text-slate-600">
              <span>Tax:</span>
              <span className="font-medium">0.00%</span>
            </div>
          )}
          {(invoice.discount ?? 0) > 0 && (
            <div className="flex justify-between text-sm text-slate-600">
              <span>Discount:</span>
              <span className="font-medium text-green-600">-{fmt(invoice.discount)}</span>
            </div>
          )}
          <div className="flex justify-between items-center pt-2 border-t-2 border-[#1e1b4b]">
            <span className="font-bold text-slate-800">Total:</span>
            <span className="text-xl font-extrabold text-[#1e1b4b]">{fmt(invoice.total ?? 0)}</span>
          </div>
        </div>
      </div>

      {/* ── FOOTER BAR ── */}
      <div className="bg-[#1e1b4b] flex justify-between items-start px-8 py-5 mt-2">
        <div className="max-w-[60%]">
          <p className="text-violet-300 text-xs font-bold uppercase tracking-wider mb-1">Terms &amp; Conditions</p>
          <p className="text-violet-200/60 text-xs leading-relaxed">
            Payment is due within 14 days of the invoice date. Late payments may incur a 1.5% monthly interest charge.
          </p>
        </div>
        <div className="text-right">
          <div className="border-b border-violet-400 w-36 mb-1" />
          <p className="text-violet-300 text-xs font-semibold">Authorised Sign</p>
        </div>
      </div>

    </div>
  );
}
