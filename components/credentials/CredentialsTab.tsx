'use client';

import { useState } from 'react';
import { useCredentials, Credential } from '@/hooks/use-credentials';
import { CredentialField } from './CredentialField';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm, Controller } from 'react-hook-form';
import { Plus, Key, Loader2 } from 'lucide-react';

type CredentialFormData = {
  label: string;
  type: string;
  username?: string;
  password?: string;
  url?: string;
  notes?: string;
};

function CredentialForm({
  defaultValues,
  onSubmit,
  isPending,
  submitLabel,
  onClose,
}: {
  defaultValues?: Partial<CredentialFormData>;
  onSubmit: (data: CredentialFormData) => void;
  isPending: boolean;
  submitLabel: string;
  onClose: () => void;
}) {
  const { register, handleSubmit, control, formState: { errors } } = useForm<CredentialFormData>({
    defaultValues: defaultValues || { type: 'ftp' },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
      <div>
        <Label>Label <span className="text-rose-500">*</span></Label>
        <Input {...register('label', { required: 'Label is required' })} placeholder="e.g. FTP Main Server" />
        {errors.label && <p className="text-xs text-rose-500 mt-1">{errors.label.message}</p>}
      </div>
      <div>
        <Label>Type <span className="text-rose-500">*</span></Label>
        <Controller
          control={control}
          name="type"
          rules={{ required: true }}
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
              <SelectContent>
                {['ftp', 'cpanel', 'database', 'api_key', 'other'].map((t) => (
                  <SelectItem key={t} value={t}>{t.replace('_', ' ')}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </div>
      <div>
        <Label>Username</Label>
        <Input {...register('username')} placeholder="user@example.com" />
      </div>
      <div>
        <Label>{defaultValues ? 'New Password (leave blank to keep current)' : 'Password'}</Label>
        <Input type="password" {...register('password')} placeholder="••••••••" autoComplete="new-password" />
      </div>
      <div>
        <Label>URL</Label>
        <Input {...register('url')} placeholder="https://..." />
      </div>
      <div>
        <Label>Notes</Label>
        <Textarea {...register('notes')} rows={3} placeholder="Any additional notes..." />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="submit" disabled={isPending} className="gap-2">
          {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}

export function CredentialsTab({ projectId }: { projectId: string }) {
  const { data: credentials, isLoading, create, update, remove, reveal } = useCredentials(projectId);
  const [showAdd, setShowAdd] = useState(false);
  const [editCred, setEditCred] = useState<Credential | null>(null);

  const handleCreate = (data: CredentialFormData) => {
    create.mutate(data, { onSuccess: () => setShowAdd(false) });
  };

  const handleUpdate = (data: CredentialFormData) => {
    if (!editCred) return;
    update.mutate(
      { credId: editCred._id, body: data },
      { onSuccess: () => setEditCred(null) }
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-slate-100 animate-pulse rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-base font-bold text-slate-800">Credential Vault</h3>
          <p className="text-xs text-slate-400">
            Passwords are AES-256-GCM encrypted. Click Reveal for temporary access.
          </p>
        </div>
        <Button onClick={() => setShowAdd(true)} size="sm" className="gap-2 bg-indigo-600 hover:bg-indigo-700">
          <Plus className="w-4 h-4" /> Add Credential
        </Button>
      </div>

      {credentials.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-400 bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-200">
          <Key className="w-12 h-12 mb-3 opacity-20" />
          <p className="font-semibold">No credentials stored yet</p>
          <p className="text-sm">Add FTP, cPanel, database, API keys and more.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {credentials.map((cred) => (
            <CredentialField
              key={cred._id}
              credential={cred}
              onReveal={reveal}
              onDelete={(id) => remove.mutate(id)}
              onEdit={(c) => setEditCred(c)}
            />
          ))}
        </div>
      )}

      {/* Add Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Credential</DialogTitle>
          </DialogHeader>
          <CredentialForm
            onSubmit={handleCreate}
            isPending={create.isPending}
            submitLabel="Save Credential"
            onClose={() => setShowAdd(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Sheet */}
      <Sheet open={editCred !== null} onOpenChange={(open) => !open && setEditCred(null)}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Edit Credential</SheetTitle>
          </SheetHeader>
          {editCred && (
            <CredentialForm
              defaultValues={editCred}
              onSubmit={handleUpdate}
              isPending={update.isPending}
              submitLabel="Update Credential"
              onClose={() => setEditCred(null)}
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
