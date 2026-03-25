'use client';

import { use, useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useProjectDetail } from '@/hooks/use-projects';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { OnboardingChecklist } from '@/components/projects/OnboardingChecklist';
const KanbanBoard = dynamic(() => import('@/components/projects/KanbanBoard').then(m => ({ default: m.KanbanBoard })), { ssr: false, loading: () => <div className="h-64 bg-slate-100 animate-pulse rounded-xl" /> });
import { TimeLogTable } from '@/components/projects/TimeLogTable';
import { ActivityList } from '@/components/projects/ActivityList';
const AssetsTab = dynamic(() => import('@/components/assets/AssetsTab').then(m => ({ default: m.AssetsTab })), { ssr: false });
const CredentialsTab = dynamic(() => import('@/components/credentials/CredentialsTab').then(m => ({ default: m.CredentialsTab })), { ssr: false });
import { 
  ExternalLink, 
  Globe, 
  LayoutDashboard, 
  CheckSquare, 
  Clock, 
  FileText, 
  Key, 
  History,
  ArrowLeft,
  Settings,
  MoreVertical,
  ChevronRight
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { useDebounce } from '@/hooks/use-debounce';

export default function ProjectDetailPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = use(params);
  const { data: project, isLoading, updateProject } = useProjectDetail(projectId);
  const [notes, setNotes] = useState('');
  const debouncedNotes = useDebounce(notes, 1000);

  useEffect(() => {
    if (project?.notes) {
      setNotes(project.notes);
    }
  }, [project?.notes]);

  useEffect(() => {
    if (debouncedNotes !== project?.notes && project) {
      updateProject.mutate({ notes: debouncedNotes });
    }
  }, [debouncedNotes]);

  if (isLoading) {
    return (
      <div className="p-8 max-w-7xl mx-auto space-y-8">
        <div className="h-12 w-1/3 bg-slate-100 animate-pulse rounded-lg" />
        <div className="h-64 w-full bg-slate-100 animate-pulse rounded-xl" />
      </div>
    );
  }

  if (!project) return <div>Project not found</div>;

  const statusColors: any = {
    active: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    maintenance: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    completed: 'bg-slate-500/10 text-slate-500 border-slate-500/20',
    pending_payment: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    paused: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Breadcrumbs & Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2 text-sm text-slate-400 font-medium">
          <Link href="/projects" className="hover:text-indigo-600 transition-colors">Projects</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-slate-600">{project.title}</span>
        </div>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg" style={{ backgroundColor: project.color || '#4f46e5' }}>
              {project.title.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-3xl font-bold text-slate-900">{project.title}</h1>
                <Badge variant="outline" className={`text-xs uppercase font-bold ${statusColors[project.status]}`}>
                  {project.status.replace('_', ' ')}
                </Badge>
              </div>
              <p className="text-slate-500 font-medium">
                Client: <Link href={`/clients/${project.clientId?._id}`} className="text-indigo-600 hover:underline">{project.clientId?.name}</Link>
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {project.liveUrl && (
              <Button variant="outline" size="sm" asChild>
                <a href={project.liveUrl} target="_blank" rel="noopener noreferrer">
                  <Globe className="w-4 h-4 mr-2" /> Live Site
                </a>
              </Button>
            )}
            {project.stagingUrl && (
              <Button variant="outline" size="sm" asChild>
                <a href={project.stagingUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4 mr-2" /> Staging
                </a>
              </Button>
            )}
            <Button variant="ghost" size="icon">
              <Settings className="w-4 h-4 text-slate-400" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <div className="bg-white p-1 rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
          <TabsList className="bg-transparent border-none w-full justify-start h-10">
            <TabsTrigger value="overview" className="data-[state=active]:bg-slate-100 data-[state=active]:text-indigo-600 gap-2">
              <LayoutDashboard className="w-4 h-4" /> Overview
            </TabsTrigger>
            <TabsTrigger value="tasks" className="data-[state=active]:bg-slate-100 data-[state=active]:text-indigo-600 gap-2">
              <CheckSquare className="w-4 h-4" /> Tasks
            </TabsTrigger>
            <TabsTrigger value="timelog" className="data-[state=active]:bg-slate-100 data-[state=active]:text-indigo-600 gap-2">
              <Clock className="w-4 h-4" /> Time Log
            </TabsTrigger>
            <TabsTrigger value="assets" className="data-[state=active]:bg-slate-100 data-[state=active]:text-indigo-600 gap-2">
              <FileText className="w-4 h-4" /> Assets
            </TabsTrigger>
            <TabsTrigger value="credentials" className="data-[state=active]:bg-slate-100 data-[state=active]:text-indigo-600 gap-2">
              <Key className="w-4 h-4" /> Credentials
            </TabsTrigger>
            <TabsTrigger value="activity" className="data-[state=active]:bg-slate-100 data-[state=active]:text-indigo-600 gap-2">
              <History className="w-4 h-4" /> Activity
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview" className="space-y-6 animate-in fade-in duration-300">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card className="border-slate-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg font-bold">Project Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600 leading-relaxed">
                    {project.description || 'No description provided for this project.'}
                  </p>
                  <div className="mt-6 flex flex-wrap gap-2">
                    {project.techStack?.map((tech: string) => (
                      <Badge key={tech} variant="secondary" className="bg-slate-100 text-slate-600 border-slate-200">
                        {tech}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-200 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-lg font-bold">Internal Notes</CardTitle>
                  <Badge variant="outline" className="text-[10px] font-bold text-slate-400 uppercase">Auto-saving</Badge>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder="Add private notes, project requirements, or ideas..."
                    className="min-h-[200px] border-none bg-slate-50/50 focus-visible:ring-1 focus-visible:ring-indigo-100 resize-none p-4"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <OnboardingChecklist project={project} />
              
              <Card className="border-slate-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-sm font-semibold uppercase tracking-wider text-slate-500">Project Info</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b border-slate-100">
                    <span className="text-sm text-slate-500">Type</span>
                    <span className="text-sm font-bold text-slate-700 capitalize">{project.type.replace('_', ' ')}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-slate-100">
                    <span className="text-sm text-slate-500">Start Date</span>
                    <span className="text-sm font-bold text-slate-700">
                      {project.startDate ? format(new Date(project.startDate), 'MMM d, yyyy') : 'Not set'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-slate-100">
                    <span className="text-sm text-slate-500">Deadline</span>
                    <span className="text-sm font-bold text-slate-700">
                      {project.deadline ? format(new Date(project.deadline), 'MMM d, yyyy') : 'Not set'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm text-slate-500">Created</span>
                    <span className="text-sm font-bold text-slate-700">{format(new Date(project.createdAt), 'MMM d, yyyy')}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="tasks" className="animate-in fade-in duration-300">
          <KanbanBoard projectId={projectId} initialTasks={project.tasks_grouped || { todo: [], in_progress: [], done: [] }} />
        </TabsContent>

        <TabsContent value="timelog" className="animate-in fade-in duration-300">
          <TimeLogTable projectId={projectId} timelogs={project.timelogs || []} summary={project.timelogsSummary || { totalHours: 0, billableHours: 0, unbilledBillableHours: 0 }} />
        </TabsContent>

        <TabsContent value="assets" className="animate-in fade-in duration-300">
          <AssetsTab projectId={projectId} />
        </TabsContent>

        <TabsContent value="credentials" className="animate-in fade-in duration-300">
          <CredentialsTab projectId={projectId} />
        </TabsContent>

        <TabsContent value="activity" className="animate-in fade-in duration-300">
          <ActivityList activities={project.activityLogs || []} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
