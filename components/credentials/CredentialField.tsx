'use client';

import { useState, useEffect, useRef } from 'react';
import { Credential } from '@/hooks/use-credentials';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { Eye, EyeOff, Copy, Check, Pencil, Trash2, Loader2, ExternalLink } from 'lucide-react';

const TYPE_COLORS: Record<string, string> = {
  ftp: 'bg-blue-100 text-blue-700',
  cpanel: 'bg-purple-100 text-purple-700',
  database: 'bg-orange-100 text-orange-700',
  api_key: 'bg-indigo-100 text-indigo-700',
  other: 'bg-slate-100 text-slate-600',
};

const REVEAL_DURATION = 10_000; // 10 seconds

interface CredentialFieldProps {
  credential: Credential;
  onReveal: (credId: string) => Promise<string>;
  onDelete: (credId: string) => void;
  onEdit: (credential: Credential) => void;
}

export function CredentialField({ credential, onReveal, onDelete, onEdit }: CredentialFieldProps) {
  const [revealed, setRevealed] = useState(false);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [progress, setProgress] = useState(100);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startRef = useRef<number>(0);
  const rafRef = useRef<number | null>(null);

  const clearTimers = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  };

  const hide = () => {
    clearTimers();
    setRevealed(false);
    setPassword('');
    setProgress(100);
  };

  useEffect(() => () => clearTimers(), []);

  const handleReveal = async () => {
    if (revealed) { hide(); return; }
    setLoading(true);
    try {
      const pw = await onReveal(credential._id);
      setPassword(pw);
      setRevealed(true);
      setProgress(100);
      startRef.current = Date.now();

      const animate = () => {
        const elapsed = Date.now() - startRef.current;
        const remaining = Math.max(0, 100 - (elapsed / REVEAL_DURATION) * 100);
        setProgress(remaining);
        if (remaining > 0) {
          rafRef.current = requestAnimationFrame(animate);
        }
      };
      rafRef.current = requestAnimationFrame(animate);

      timerRef.current = setTimeout(hide, REVEAL_DURATION);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      <div className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="font-semibold text-slate-800 text-sm">{credential.label}</span>
            <Badge className={`text-[10px] font-bold uppercase px-1.5 ${TYPE_COLORS[credential.type]}`} variant="secondary">
              {credential.type.replace('_', ' ')}
            </Badge>
          </div>

          {credential.username && (
            <p className="text-xs text-slate-500 mb-1">
              <span className="font-medium text-slate-600">User:</span> {credential.username}
            </p>
          )}

          {/* Password field */}
          <div className="flex items-center gap-2 mt-1.5">
            <div className="font-mono text-sm text-slate-700 tracking-widest select-none">
              {revealed ? password : '••••••••••••'}
            </div>
            {revealed && (
              <Button size="icon" variant="ghost" className="w-6 h-6" onClick={handleCopy}>
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
              </Button>
            )}
          </div>

          {credential.url && (
            <a
              href={credential.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-indigo-500 hover:text-indigo-700 mt-1.5"
            >
              <ExternalLink className="w-3 h-3" /> {credential.url}
            </a>
          )}
          {credential.notes && <p className="text-xs text-slate-400 mt-1 italic">{credential.notes}</p>}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <Button
            size="sm"
            variant={revealed ? 'default' : 'outline'}
            className={`gap-1.5 text-xs ${revealed ? 'bg-indigo-600 hover:bg-indigo-700' : ''}`}
            onClick={handleReveal}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : revealed ? (
              <EyeOff className="w-3.5 h-3.5" />
            ) : (
              <Eye className="w-3.5 h-3.5" />
            )}
            {revealed ? 'Hide' : 'Reveal'}
          </Button>
          <Button size="icon" variant="ghost" className="w-8 h-8" onClick={() => onEdit(credential)}>
            <Pencil className="w-3.5 h-3.5 text-slate-400" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="icon" variant="ghost" className="w-8 h-8">
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Credential?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete <strong>{credential.label}</strong>. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-rose-600 hover:bg-rose-700"
                  onClick={() => onDelete(credential._id)}
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Timer progress bar */}
      {revealed && (
        <div className="h-0.5 bg-slate-100">
          <div
            className="h-full bg-indigo-500 transition-none"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}
