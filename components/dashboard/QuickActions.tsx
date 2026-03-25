'use client';

import Link from 'next/link';
import { UserPlus, FolderPlus, FileText, ArrowRight } from 'lucide-react';

const ACTIONS = [
  {
    label: 'Add Client',
    description: 'Onboard a new client',
    icon: UserPlus,
    href: '/clients',
    color: 'bg-blue-500',
    hoverColor: 'hover:bg-blue-600',
  },
  {
    label: 'New Project',
    description: 'Start a new project',
    icon: FolderPlus,
    href: '/projects',
    color: 'bg-violet-500',
    hoverColor: 'hover:bg-violet-600',
  },
  {
    label: 'Create Invoice',
    description: 'Bill a client',
    icon: FileText,
    href: '/payments',
    color: 'bg-emerald-500',
    hoverColor: 'hover:bg-emerald-600',
  },
];

export function QuickActions() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {ACTIONS.map(({ label, description, icon: Icon, href, color, hoverColor }) => (
        <Link
          key={label}
          href={href}
          className={`group flex items-center gap-4 rounded-xl px-5 py-4 text-white transition-all shadow-sm ${color} ${hoverColor}`}
        >
          <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
            <Icon className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm">{label}</p>
            <p className="text-xs text-white/75">{description}</p>
          </div>
          <ArrowRight className="w-4 h-4 text-white/60 group-hover:translate-x-0.5 transition-transform shrink-0" />
        </Link>
      ))}
    </div>
  );
}
