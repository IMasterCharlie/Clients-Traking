'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/shared/DashboardLayout';
import { useProfile } from '@/hooks/use-reports';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useForm, Controller } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/authStore';
import {
  User, Building2, Shield, Bell, Loader2, Upload, Check,
  Eye, EyeOff, QrCode, CheckCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function patchProfile(data: Record<string, unknown>) {
  const res = await fetch('/api/auth/profile', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.message);
  return json.data;
}

const CURRENCIES = ['USD', 'EUR', 'GBP', 'INR', 'AUD', 'CAD', 'SGD', 'AED', 'JPY'];
const TIMEZONES = [
  'UTC', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
  'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Asia/Kolkata', 'Asia/Dubai',
  'Asia/Singapore', 'Asia/Tokyo', 'Australia/Sydney', 'Pacific/Auckland',
];

// ─── Tab 1: Profile ───────────────────────────────────────────────────────────
function ProfileTab({ profile }: { profile: any }) {
  const qc = useQueryClient();
  const { register, handleSubmit, control, reset } = useForm({ defaultValues: profile || {} });

  useEffect(() => { if (profile) reset(profile); }, [profile]);

  const mutation = useMutation({
    mutationFn: patchProfile,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Profile saved');
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <form onSubmit={handleSubmit((d) => mutation.mutate({ name: d.name, timezone: d.timezone, defaultCurrency: d.defaultCurrency }))}
      className="space-y-5 max-w-lg">
      <div>
        <Label>Full Name</Label>
        <Input {...register('name', { required: true })} className="mt-1" />
      </div>
      <div>
        <Label>Email <span className="text-slate-400 text-xs">(read-only)</span></Label>
        <Input value={profile?.email || ''} readOnly className="mt-1 bg-slate-50 cursor-not-allowed" />
      </div>
      <div>
        <Label>Timezone</Label>
        <Controller control={control} name="timezone" render={({ field }) => (
          <Select value={field.value} onValueChange={field.onChange}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              {TIMEZONES.map((tz) => <SelectItem key={tz} value={tz}>{tz}</SelectItem>)}
            </SelectContent>
          </Select>
        )} />
      </div>
      <div>
        <Label>Default Currency</Label>
        <Controller control={control} name="defaultCurrency" render={({ field }) => (
          <Select value={field.value} onValueChange={field.onChange}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              {CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        )} />
      </div>
      <Button type="submit" disabled={mutation.isPending} className="gap-2 bg-indigo-600 hover:bg-indigo-700">
        {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
        Save Profile
      </Button>
    </form>
  );
}

// ─── Tab 2: Business ──────────────────────────────────────────────────────────
function BusinessTab({ profile }: { profile: any }) {
  const qc = useQueryClient();
  const { register, handleSubmit, watch, setValue, reset } = useForm({ defaultValues: profile || {} });
  const [uploading, setUploading] = useState(false);
  const logoUrl = watch('businessLogo');

  useEffect(() => { if (profile) reset(profile); }, [profile]);

  const mutation = useMutation({
    mutationFn: patchProfile,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['profile'] }); toast.success('Business settings saved'); },
    onError: (e: any) => toast.error(e.message),
  });

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/upload/logo', { method: 'POST', body: fd });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      setValue('businessLogo', json.data.url);
      toast.success('Logo uploaded');
    } catch (err: any) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const values = watch();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <form onSubmit={handleSubmit((d) => mutation.mutate({
        businessName: d.businessName,
        businessAddress: d.businessAddress,
        defaultTaxRate: d.defaultTaxRate,
        businessLogo: d.businessLogo,
      }))} className="space-y-5">
        <div>
          <Label>Business Name</Label>
          <Input {...register('businessName')} className="mt-1" placeholder="Acme LLC" />
        </div>
        <div>
          <Label>Business Address</Label>
          <Textarea {...register('businessAddress')} className="mt-1 resize-none" rows={3} placeholder="123 Main St..." />
        </div>
        <div>
          <Label>Default Tax Rate (%)</Label>
          <Input type="number" step="0.01" min="0" max="100" {...register('defaultTaxRate', { valueAsNumber: true })} className="mt-1 w-32" />
        </div>
        <div>
          <Label>Business Logo</Label>
          <div className="mt-1 flex items-center gap-3">
            {logoUrl && (
              <img src={logoUrl} alt="Logo" className="w-14 h-14 rounded-xl object-contain border border-slate-200" />
            )}
            <label className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 text-sm font-medium cursor-pointer hover:bg-slate-50 transition-colors',
              uploading && 'opacity-50 cursor-not-allowed'
            )}>
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {uploading ? 'Uploading...' : 'Upload Logo'}
              <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} disabled={uploading} />
            </label>
          </div>
          <p className="text-xs text-slate-400 mt-1">JPG, PNG, WebP or SVG. Max 2MB.</p>
        </div>
        <Button type="submit" disabled={mutation.isPending} className="gap-2 bg-indigo-600 hover:bg-indigo-700">
          {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          Save Business Info
        </Button>
      </form>

      {/* Invoice header preview */}
      <div>
        <p className="text-sm font-semibold text-slate-600 mb-3">Invoice Header Preview</p>
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              {values.businessLogo && (
                <img src={values.businessLogo} alt="logo" className="w-14 h-14 object-contain mb-2 rounded-lg" />
              )}
              <p className="font-bold text-lg text-slate-900">{values.businessName || 'Your Business Name'}</p>
              <p className="text-xs text-slate-500 mt-1 whitespace-pre-line">{values.businessAddress || '123 Business St, City'}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-indigo-600">INVOICE</p>
              <p className="text-xs text-slate-400 mt-1">#INV-0001</p>
              <p className="text-xs text-slate-400">Tax Rate: {values.defaultTaxRate || 0}%</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Tab 3: Security ──────────────────────────────────────────────────────────
function SecurityTab({ profile }: { profile: any }) {
  const router = useRouter();
  const { clearUser } = useAuthStore();
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [qrUri, setQrUri] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [disablePassword, setDisablePassword] = useState('');
  const qc = useQueryClient();

  const { register: regPw, handleSubmit: handlePw, formState: { errors: pwErrors }, watch: watchPw } = useForm<{
    oldPassword: string; newPassword: string; confirmPassword: string;
  }>();

  const pwMutation = useMutation({
    mutationFn: async (d: any) => {
      const res = await fetch('/api/auth/password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldPassword: d.oldPassword, newPassword: d.newPassword }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
    },
    onSuccess: async () => {
      await fetch('/api/auth/logout', { method: 'POST' });
      clearUser();
      toast.success('Password changed. Please log in again.');
      router.push('/login');
    },
    onError: (e: any) => toast.error(e.message),
  });

  const handleSetup2FA = async () => {
    const res = await fetch('/api/auth/2fa/setup', { method: 'POST' });
    const json = await res.json();
    if (json.success) { setQrUri(json.data.qrCodeUrl || json.data.otpAuthUrl || ''); setQrDialogOpen(true); }
    else toast.error(json.message);
  };

  const handleVerify2FA = async () => {
    setVerifying(true);
    try {
      const res = await fetch('/api/auth/2fa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: totpCode }),
      });
      const json = await res.json();
      if (json.success) { qc.invalidateQueries({ queryKey: ['profile'] }); setQrDialogOpen(false); toast.success('2FA enabled!'); }
      else toast.error(json.message || 'Invalid code');
    } finally { setVerifying(false); }
  };

  const handleDisable2FA = async () => {
    const res = await fetch('/api/auth/2fa/disable', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: disablePassword }),
    });
    const json = await res.json();
    if (json.success) { qc.invalidateQueries({ queryKey: ['profile'] }); toast.success('2FA disabled'); }
    else toast.error(json.message);
  };

  const newPw = watchPw('newPassword');

  return (
    <div className="space-y-8 max-w-lg">
      {/* Change Password */}
      <div>
        <h3 className="text-base font-bold text-slate-800 mb-4">Change Password</h3>
        <form onSubmit={handlePw((d) => pwMutation.mutate(d))} className="space-y-4">
          <div>
            <Label>Current Password</Label>
            <div className="relative mt-1">
              <Input type={showCurrent ? 'text' : 'password'} {...regPw('oldPassword', { required: 'Required' })} />
              <button type="button" className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                onClick={() => setShowCurrent(!showCurrent)}>
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {pwErrors.oldPassword && <p className="text-xs text-rose-500 mt-1">{pwErrors.oldPassword.message}</p>}
          </div>
          <div>
            <Label>New Password</Label>
            <div className="relative mt-1">
              <Input type={showNew ? 'text' : 'password'} {...regPw('newPassword', {
                required: 'Required', minLength: { value: 8, message: 'Minimum 8 characters' }
              })} />
              <button type="button" className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                onClick={() => setShowNew(!showNew)}>
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {pwErrors.newPassword && <p className="text-xs text-rose-500 mt-1">{pwErrors.newPassword.message}</p>}
          </div>
          <div>
            <Label>Confirm New Password</Label>
            <Input type="password" className="mt-1" {...regPw('confirmPassword', {
              required: 'Required',
              validate: (v) => v === newPw || 'Passwords do not match',
            })} />
            {pwErrors.confirmPassword && <p className="text-xs text-rose-500 mt-1">{pwErrors.confirmPassword.message}</p>}
          </div>
          <Button type="submit" disabled={pwMutation.isPending} variant="destructive" className="gap-2">
            {pwMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Change Password
          </Button>
        </form>
      </div>

      {/* 2FA Section */}
      <div className="border-t border-slate-100 pt-7">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-800">Two-Factor Authentication</h3>
            <p className="text-xs text-slate-500 mt-0.5">Add an extra layer of security with TOTP authentication.</p>
          </div>
          {profile?.twoFactorEnabled ? (
            <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 gap-1.5">
              <CheckCircle className="w-3.5 h-3.5" /> Active
            </Badge>
          ) : (
            <Badge variant="outline" className="text-slate-500">Disabled</Badge>
          )}
        </div>

        {profile?.twoFactorEnabled ? (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="gap-2 border-rose-200 text-rose-600 hover:bg-rose-50">
                Disable 2FA
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Disable Two-Factor Authentication</AlertDialogTitle>
                <AlertDialogDescription>Enter your current password to confirm.</AlertDialogDescription>
              </AlertDialogHeader>
              <Input
                type="password"
                placeholder="Current password"
                value={disablePassword}
                onChange={(e) => setDisablePassword(e.target.value)}
                className="mt-2"
              />
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction className="bg-rose-600 hover:bg-rose-700" onClick={handleDisable2FA}>
                  Disable 2FA
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        ) : (
          <Button onClick={handleSetup2FA} className="gap-2 bg-indigo-600 hover:bg-indigo-700">
            <QrCode className="w-4 h-4" /> Enable 2FA
          </Button>
        )}
      </div>

      {/* QR Dialog */}
      <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Set Up Two-Factor Authentication</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-slate-600">
              Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.):
            </p>
            {qrUri && (
              <div className="flex justify-center p-4 bg-white border border-slate-200 rounded-xl">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(qrUri)}`}
                  alt="2FA QR Code"
                  className="w-44 h-44"
                />
              </div>
            )}
            <div>
              <Label>Enter the 6-digit code from your app</Label>
              <Input
                className="mt-1 text-center text-xl tracking-[0.5em] font-mono"
                maxLength={6}
                placeholder="000000"
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
              />
            </div>
            <Button
              className="w-full gap-2 bg-indigo-600 hover:bg-indigo-700"
              onClick={handleVerify2FA}
              disabled={totpCode.length !== 6 || verifying}
            >
              {verifying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Verify & Enable 2FA
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Tab 4: Notifications ─────────────────────────────────────────────────────
const LEAD_TIME_OPTS = [
  { value: '7', label: '7 days' },
  { value: '14', label: '14 days' },
  { value: '30', label: '30 days' },
  { value: '60', label: '60 days' },
];
const SUB_DUE_OPTS = [
  { value: '1', label: '1 day before' },
  { value: '3', label: '3 days before' },
  { value: '7', label: '7 days before' },
];

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none',
        checked ? 'bg-indigo-600' : 'bg-slate-200'
      )}
    >
      <span className={cn(
        'inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform',
        checked ? 'translate-x-6' : 'translate-x-1'
      )} />
    </button>
  );
}

function NotificationsTab({ profile }: { profile: any }) {
  const qc = useQueryClient();
  const prefs = profile?.notificationPrefs || {};

  const [state, setState] = useState({
    emailAlertsEnabled: prefs.emailAlertsEnabled ?? true,
    hostingExpiryDays: prefs.hostingExpiryDays ?? 30,
    domainExpiryDays: prefs.domainExpiryDays ?? 30,
    sslExpiryDays: prefs.sslExpiryDays ?? 14,
    paymentOverdueEnabled: prefs.paymentOverdueEnabled ?? true,
    paymentOverdueEmailEnabled: prefs.paymentOverdueEmailEnabled ?? true,
    subscriptionDueDays: prefs.subscriptionDueDays ?? 3,
    hostingExpiryEmailEnabled: prefs.hostingExpiryEmailEnabled ?? true,
    domainExpiryEmailEnabled: prefs.domainExpiryEmailEnabled ?? true,
    sslExpiryEmailEnabled: prefs.sslExpiryEmailEnabled ?? true,
    subscriptionDueEmailEnabled: prefs.subscriptionDueEmailEnabled ?? true,
  });

  useEffect(() => {
    if (profile?.notificationPrefs) setState({ ...state, ...profile.notificationPrefs });
  }, [profile]);

  const mutation = useMutation({
    mutationFn: () => patchProfile({ notificationPrefs: state }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['profile'] }); toast.success('Notification preferences saved'); },
    onError: (e: any) => toast.error(e.message),
  });

  const set = (key: string, value: unknown) => setState((s) => ({ ...s, [key]: value }));

  return (
    <div className="space-y-7 max-w-xl">
      {/* Master toggle */}
      <div className="flex items-center justify-between py-3 border-b border-slate-100">
        <div>
          <p className="font-semibold text-slate-800">Email Alerts</p>
          <p className="text-xs text-slate-500 mt-0.5">Receive email notifications for all alert types</p>
        </div>
        <Toggle checked={state.emailAlertsEnabled} onChange={(v) => set('emailAlertsEnabled', v)} />
      </div>

      {/* Alert type settings */}
      <div className="space-y-4">
        <p className="text-sm font-bold text-slate-600 uppercase tracking-wider">Alert Lead Times</p>

        {[
          { key: 'hostingExpiryDays', emailKey: 'hostingExpiryEmailEnabled', label: 'Hosting Expiry', opts: LEAD_TIME_OPTS },
          { key: 'domainExpiryDays', emailKey: 'domainExpiryEmailEnabled', label: 'Domain Expiry', opts: LEAD_TIME_OPTS },
          { key: 'sslExpiryDays', emailKey: 'sslExpiryEmailEnabled', label: 'SSL Expiry', opts: LEAD_TIME_OPTS },
          { key: 'subscriptionDueDays', emailKey: 'subscriptionDueEmailEnabled', label: 'Subscription Due', opts: SUB_DUE_OPTS },
        ].map(({ key, emailKey, label, opts }) => (
          <div key={key} className="flex items-center justify-between py-3 border-b border-slate-100">
            <div className="flex-1">
              <p className="text-sm font-semibold text-slate-700">{label}</p>
              {state.emailAlertsEnabled && (
                <div className="flex items-center gap-2 mt-1">
                  <Toggle
                    checked={(state as any)[emailKey]}
                    onChange={(v) => set(emailKey, v)}
                  />
                  <span className="text-xs text-slate-400">Email</span>
                </div>
              )}
            </div>
            <Select
              value={String((state as any)[key])}
              onValueChange={(v) => set(key, parseInt(v))}
            >
              <SelectTrigger className="w-36 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {opts.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        ))}

        {/* Payment overdue — toggle only */}
        <div className="flex items-center justify-between py-3 border-b border-slate-100">
          <div>
            <p className="text-sm font-semibold text-slate-700">Payment Overdue</p>
            <p className="text-xs text-slate-500 mt-0.5">Triggered immediately when payment becomes overdue</p>
            {state.emailAlertsEnabled && (
              <div className="flex items-center gap-2 mt-1">
                <Toggle
                  checked={state.paymentOverdueEmailEnabled}
                  onChange={(v) => set('paymentOverdueEmailEnabled', v)}
                />
                <span className="text-xs text-slate-400">Email</span>
              </div>
            )}
          </div>
          <Toggle checked={state.paymentOverdueEnabled} onChange={(v) => set('paymentOverdueEnabled', v)} />
        </div>
      </div>

      <Button
        onClick={() => mutation.mutate()}
        disabled={mutation.isPending}
        className="gap-2 bg-indigo-600 hover:bg-indigo-700"
      >
        {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
        Save Preferences
      </Button>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const { data: profile, isLoading } = useProfile();

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="p-8 max-w-3xl mx-auto">
          <div className="h-10 w-40 bg-slate-100 animate-pulse rounded-lg mb-8" />
          <div className="h-96 bg-slate-100 animate-pulse rounded-2xl" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-slate-500 mt-1 text-sm">Manage your profile, business, and security preferences.</p>
        </div>

        <Tabs defaultValue="profile">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-1 mb-6 overflow-x-auto">
            <TabsList className="bg-transparent border-none w-full justify-start h-10">
              {[
                { value: 'profile', label: 'Profile', icon: User },
                { value: 'business', label: 'Business', icon: Building2 },
                { value: 'security', label: 'Security', icon: Shield },
                { value: 'notifications', label: 'Notifications', icon: Bell },
              ].map(({ value, label, icon: Icon }) => (
                <TabsTrigger
                  key={value}
                  value={value}
                  className="data-[state=active]:bg-slate-100 data-[state=active]:text-indigo-600 gap-2"
                >
                  <Icon className="w-4 h-4" /> {label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <Card className="border-slate-200 shadow-sm">
            <CardContent className="p-7">
              <TabsContent value="profile" className="mt-0">
                <ProfileTab profile={profile} />
              </TabsContent>
              <TabsContent value="business" className="mt-0">
                <BusinessTab profile={profile} />
              </TabsContent>
              <TabsContent value="security" className="mt-0">
                <SecurityTab profile={profile} />
              </TabsContent>
              <TabsContent value="notifications" className="mt-0">
                <NotificationsTab profile={profile} />
              </TabsContent>
            </CardContent>
          </Card>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
