'use client';

import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useProjectDetail } from '@/hooks/use-projects';

const ONBOARDING_KEYS = [
  { key: 'domain_registered', label: 'Domain Registered' },
  { key: 'hosting_setup', label: 'Hosting Setup' },
  { key: 'ssl_installed', label: 'SSL Installed' },
  { key: 'repo_created', label: 'Repository Created' },
  { key: 'staging_deployed', label: 'Staging Deployed' },
  { key: 'client_credentials_shared', label: 'Client Credentials Shared' },
  { key: 'project_brief_signed', label: 'Project Brief Signed' },
  { key: 'first_payment_received', label: 'First Payment Received' },
  { key: 'db_setup', label: 'Database Setup' },
  { key: 'admin_credentials_noted', label: 'Admin Credentials Noted' },
  { key: 'analytics_installed', label: 'Analytics Installed' },
  { key: 'handoff_done', label: 'Handoff Done' },
];

export function OnboardingChecklist({ project }: { project: any }) {
  const { updateOnboarding } = useProjectDetail(project._id);
  const completedCount = project.onboardingDone?.length || 0;
  const progress = Math.round((completedCount / ONBOARDING_KEYS.length) * 100);

  const handleToggle = (key: string, checked: boolean) => {
    updateOnboarding.mutate({ key, completed: checked });
  };

  return (
    <Card className="border-slate-200">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center mb-2">
          <CardTitle className="text-sm font-semibold uppercase tracking-wider text-slate-500">Onboarding Checklist</CardTitle>
          <span className="text-xs font-bold text-indigo-600">{progress}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-3 mt-2">
          {ONBOARDING_KEYS.map(({ key, label }) => {
            const isDone = project.onboardingDone?.includes(key);
            return (
              <div key={key} className="flex items-center space-x-3 group">
                <Checkbox
                  id={key}
                  checked={isDone}
                  onCheckedChange={(checked) => handleToggle(key, !!checked)}
                  className="w-5 h-5 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
                />
                <label
                  htmlFor={key}
                  className={`text-sm font-medium leading-none cursor-pointer transition-colors ${
                    isDone ? 'text-slate-400 line-through' : 'text-slate-700 group-hover:text-indigo-600'
                  }`}
                >
                  {label}
                </label>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
