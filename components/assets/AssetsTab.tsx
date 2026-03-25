'use client';

import { useState } from 'react';
import { useAssets } from '@/hooks/use-assets';
import { useForm } from 'react-hook-form';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertBadge } from '@/components/assets/AlertBadge';
import { format } from 'date-fns';
import { Server, Globe, Shield, Database, Github, Pencil, Loader2 } from 'lucide-react';

function InfoRow({ label, value }: { label: string; value?: string | number | boolean | null }) {
  if (value === null || value === undefined || value === '') return null;
  const display = typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value);
  return (
    <div className="flex justify-between items-start py-2 border-b border-slate-100 last:border-0 gap-4">
      <span className="text-sm text-slate-500 shrink-0">{label}</span>
      <span className="text-sm font-semibold text-slate-700 text-right break-all">{display}</span>
    </div>
  );
}

function DateRow({ label, value }: { label: string; value?: string | Date | null }) {
  if (!value) return null;
  return (
    <div className="flex justify-between items-start py-2 border-b border-slate-100 last:border-0 gap-4">
      <span className="text-sm text-slate-500 shrink-0">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-slate-700">
          {format(new Date(value), 'MMM d, yyyy')}
        </span>
        <AlertBadge date={value} showDays />
      </div>
    </div>
  );
}

// ─── Section Edit Forms ────────────────────────────────────────────────────

function HostingForm({ data, onSave, onClose }: { data: any; onSave: (d: any) => void; onClose: () => void }) {
  const { register, handleSubmit, setValue, watch } = useForm({ defaultValues: data || {} });
  return (
    <form onSubmit={handleSubmit(onSave)} className="space-y-4 py-4">
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Provider</Label><Input {...register('provider')} placeholder="e.g. SiteGround" /></div>
        <div><Label>Plan</Label><Input {...register('plan')} placeholder="e.g. GrowBig" /></div>
        <div><Label>Username</Label><Input {...register('username')} /></div>
        <div><Label>Login URL</Label><Input {...register('loginUrl')} placeholder="https://..." /></div>
        <div><Label>Expiry Date</Label><Input type="date" {...register('expiryDate')} /></div>
        <div><Label>Cost</Label><Input type="number" step="0.01" {...register('cost', { valueAsNumber: true })} /></div>
        <div><Label>Currency</Label><Input {...register('currency')} placeholder="USD" /></div>
        <div><Label>Reminder Days</Label><Input type="number" {...register('reminderDays', { valueAsNumber: true })} /></div>
      </div>
      <div><Label>Notes</Label><Textarea {...register('notes')} rows={3} /></div>
      <SheetFooter className="pt-2">
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="submit">Save Hosting</Button>
      </SheetFooter>
    </form>
  );
}

function DomainForm({ data, onSave, onClose }: { data: any; onSave: (d: any) => void; onClose: () => void }) {
  const { register, handleSubmit } = useForm({ defaultValues: data || {} });
  return (
    <form onSubmit={handleSubmit(onSave)} className="space-y-4 py-4">
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Registrar</Label><Input {...register('registrar')} placeholder="e.g. Namecheap" /></div>
        <div><Label>Domain Name</Label><Input {...register('domainName')} placeholder="example.com" /></div>
        <div><Label>Expiry Date</Label><Input type="date" {...register('expiryDate')} /></div>
        <div><Label>Cost</Label><Input type="number" step="0.01" {...register('cost', { valueAsNumber: true })} /></div>
        <div><Label>Reminder Days</Label><Input type="number" {...register('reminderDays', { valueAsNumber: true })} /></div>
        <div className="flex items-center gap-2 pt-5">
          <input type="checkbox" id="autoRenewal" {...register('autoRenewal')} className="w-4 h-4 accent-indigo-600" />
          <Label htmlFor="autoRenewal">Auto Renewal</Label>
        </div>
      </div>
      <div><Label>Notes</Label><Textarea {...register('notes')} rows={3} /></div>
      <SheetFooter className="pt-2">
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="submit">Save Domain</Button>
      </SheetFooter>
    </form>
  );
}

function SslForm({ data, onSave, onClose }: { data: any; onSave: (d: any) => void; onClose: () => void }) {
  const { register, handleSubmit } = useForm({ defaultValues: data || {} });
  return (
    <form onSubmit={handleSubmit(onSave)} className="space-y-4 py-4">
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Provider</Label><Input {...register('provider')} placeholder="e.g. Let's Encrypt" /></div>
        <div><Label>Issued Date</Label><Input type="date" {...register('issuedDate')} /></div>
        <div><Label>Expiry Date</Label><Input type="date" {...register('expiryDate')} /></div>
        <div><Label>Reminder Days</Label><Input type="number" {...register('reminderDays', { valueAsNumber: true })} /></div>
      </div>
      <div><Label>Notes</Label><Textarea {...register('notes')} rows={3} /></div>
      <SheetFooter className="pt-2">
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="submit">Save SSL</Button>
      </SheetFooter>
    </form>
  );
}

function DatabaseForm({ data, onSave, onClose }: { data: any; onSave: (d: any) => void; onClose: () => void }) {
  const { register, handleSubmit, setValue, watch } = useForm({ defaultValues: data || {} });
  const dbType = watch('type');
  return (
    <form onSubmit={handleSubmit(onSave)} className="space-y-4 py-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Type</Label>
          <Select value={dbType} onValueChange={(v) => setValue('type', v)}>
            <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
            <SelectContent>
              {['mysql', 'pgsql', 'mongodb', 'sqlite', 'other'].map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div><Label>Host</Label><Input {...register('host')} placeholder="localhost" /></div>
        <div><Label>Port</Label><Input {...register('port')} placeholder="3306" /></div>
        <div><Label>DB Name</Label><Input {...register('dbName')} /></div>
        <div><Label>Backup Schedule</Label><Input {...register('backupSchedule')} placeholder="e.g. Daily at 2AM" /></div>
        <div><Label>Last Backup</Label><Input type="date" {...register('lastBackup')} /></div>
      </div>
      <div><Label>Notes</Label><Textarea {...register('notes')} rows={3} /></div>
      <SheetFooter className="pt-2">
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="submit">Save Database</Button>
      </SheetFooter>
    </form>
  );
}

function GithubForm({ data, onSave, onClose }: { data: any; onSave: (d: any) => void; onClose: () => void }) {
  const { register, handleSubmit, setValue, watch } = useForm({ defaultValues: data || {} });
  const accessStatus = watch('accessStatus');
  return (
    <form onSubmit={handleSubmit(onSave)} className="space-y-4 py-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2"><Label>Repository URL</Label><Input {...register('repoUrl')} placeholder="https://github.com/..." /></div>
        <div><Label>Deploy Branch</Label><Input {...register('deployBranch')} placeholder="main" /></div>
        <div>
          <Label>Access Status</Label>
          <Select value={accessStatus} onValueChange={(v) => setValue('accessStatus', v)}>
            <SelectTrigger><SelectValue placeholder="Select access" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="owner">Owner</SelectItem>
              <SelectItem value="collaborator">Collaborator</SelectItem>
              <SelectItem value="none">None</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div><Label>Last Pushed At</Label><Input type="date" {...register('lastPushedAt')} /></div>
        <div className="flex items-center gap-2 pt-5">
          <input type="checkbox" id="isPrivate" {...register('isPrivate')} className="w-4 h-4 accent-indigo-600" />
          <Label htmlFor="isPrivate">Private Repository</Label>
        </div>
      </div>
      <SheetFooter className="pt-2">
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="submit">Save GitHub</Button>
      </SheetFooter>
    </form>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────

const SECTIONS = [
  { key: 'hosting', label: 'Hosting', Icon: Server },
  { key: 'domain', label: 'Domain', Icon: Globe },
  { key: 'ssl', label: 'SSL Certificate', Icon: Shield },
  { key: 'database', label: 'Database', Icon: Database },
  { key: 'github', label: 'GitHub / Repository', Icon: Github },
] as const;

type SectionKey = (typeof SECTIONS)[number]['key'];

export function AssetsTab({ projectId }: { projectId: string }) {
  const { data: asset, isLoading, updateSection } = useAssets(projectId);
  const [editSection, setEditSection] = useState<SectionKey | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-14 bg-slate-100 animate-pulse rounded-xl" />
        ))}
      </div>
    );
  }

  const handleSave = (section: SectionKey, data: Record<string, unknown>) => {
    // Convert empty date strings to undefined
    const cleaned = Object.fromEntries(
      Object.entries(data).map(([k, v]) => [k, v === '' ? undefined : v])
    );
    updateSection.mutate(
      { section, data: cleaned },
      { onSuccess: () => setEditSection(null) }
    );
  };

  const getExpiryDate = (section: SectionKey) => {
    if (section === 'github' || section === 'database') return null;
    return (asset as any)?.[section]?.expiryDate;
  };

  const renderSectionContent = (key: SectionKey) => {
    const d = (asset as any)?.[key];
    if (!d) return <p className="text-sm text-slate-400 italic py-2">No data recorded yet. Click Edit to add details.</p>;

    if (key === 'hosting') return (
      <>
        <InfoRow label="Provider" value={d.provider} />
        <InfoRow label="Plan" value={d.plan} />
        <InfoRow label="Username" value={d.username} />
        <InfoRow label="Login URL" value={d.loginUrl} />
        <DateRow label="Expiry Date" value={d.expiryDate} />
        <InfoRow label="Cost" value={d.cost ? `${d.cost} ${d.currency || 'USD'}` : null} />
        <InfoRow label="Reminder" value={d.reminderDays ? `${d.reminderDays} days before expiry` : null} />
        <InfoRow label="Notes" value={d.notes} />
      </>
    );
    if (key === 'domain') return (
      <>
        <InfoRow label="Registrar" value={d.registrar} />
        <InfoRow label="Domain Name" value={d.domainName} />
        <DateRow label="Expiry Date" value={d.expiryDate} />
        <InfoRow label="Auto Renewal" value={typeof d.autoRenewal === 'boolean' ? d.autoRenewal : null} />
        <InfoRow label="Cost" value={d.cost} />
        <InfoRow label="Reminder" value={d.reminderDays ? `${d.reminderDays} days` : null} />
        <InfoRow label="Notes" value={d.notes} />
      </>
    );
    if (key === 'ssl') return (
      <>
        <InfoRow label="Provider" value={d.provider} />
        {d.issuedDate && <InfoRow label="Issued" value={format(new Date(d.issuedDate), 'MMM d, yyyy')} />}
        <DateRow label="Expiry Date" value={d.expiryDate} />
        <InfoRow label="Reminder" value={d.reminderDays ? `${d.reminderDays} days` : null} />
        <InfoRow label="Notes" value={d.notes} />
      </>
    );
    if (key === 'database') return (
      <>
        <InfoRow label="Type" value={d.type} />
        <InfoRow label="Host" value={d.host} />
        <InfoRow label="Port" value={d.port} />
        <InfoRow label="DB Name" value={d.dbName} />
        <InfoRow label="Backup Schedule" value={d.backupSchedule} />
        {d.lastBackup && <InfoRow label="Last Backup" value={format(new Date(d.lastBackup), 'MMM d, yyyy')} />}
        <InfoRow label="Notes" value={d.notes} />
      </>
    );
    if (key === 'github') return (
      <>
        <InfoRow label="Repo URL" value={d.repoUrl} />
        <InfoRow label="Deploy Branch" value={d.deployBranch} />
        <InfoRow label="Access Status" value={d.accessStatus} />
        {d.lastPushedAt && <InfoRow label="Last Pushed" value={format(new Date(d.lastPushedAt), 'MMM d, yyyy')} />}
        <InfoRow label="Private" value={typeof d.isPrivate === 'boolean' ? d.isPrivate : null} />
      </>
    );
    return null;
  };

  const renderEditForm = (key: SectionKey) => {
    const d = (asset as any)?.[key];
    const props = { data: d, onClose: () => setEditSection(null), onSave: (data: any) => handleSave(key, data) };
    if (key === 'hosting') return <HostingForm {...props} />;
    if (key === 'domain') return <DomainForm {...props} />;
    if (key === 'ssl') return <SslForm {...props} />;
    if (key === 'database') return <DatabaseForm {...props} />;
    if (key === 'github') return <GithubForm {...props} />;
    return null;
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <Accordion type="multiple" className="divide-y divide-slate-100">
          {SECTIONS.map(({ key, label, Icon }) => (
            <AccordionItem key={key} value={key} className="border-none">
              <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-slate-50/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                    <Icon className="w-4 h-4 text-indigo-600" />
                  </div>
                  <span className="text-sm font-semibold text-slate-800">{label}</span>
                  <AlertBadge date={getExpiryDate(key)} showDays />
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6">
                <div className="pb-2">
                  {renderSectionContent(key)}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-3 gap-2"
                  onClick={() => setEditSection(key)}
                >
                  <Pencil className="w-3.5 h-3.5" /> Edit
                </Button>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>

      {/* Edit Sheet */}
      <Sheet open={editSection !== null} onOpenChange={(open) => !open && setEditSection(null)}>
        <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>
              Edit {SECTIONS.find((s) => s.key === editSection)?.label}
            </SheetTitle>
          </SheetHeader>
          {editSection && renderEditForm(editSection)}
          {updateSection.isPending && (
            <div className="absolute inset-0 bg-white/60 flex items-center justify-center rounded-lg">
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
