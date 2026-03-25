'use client';

import { useState } from 'react';
import { useProjects } from '@/hooks/use-projects';
import DashboardLayout from '@/components/shared/DashboardLayout';
import { useDebounce } from '@/hooks/use-debounce';
import { ProjectCard } from '@/components/projects/ProjectCard';
import { NewProjectDialog } from '@/components/projects/NewProjectDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
  LayoutGrid, 
  List, 
  Search, 
  Plus, 
  Filter, 
  FolderKanban,
  ExternalLink,
  MoreHorizontal
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { useQuery } from '@tanstack/react-query';

export default function ProjectsPage() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [clientId, setClientId] = useState('all');
  const debouncedSearch = useDebounce(search, 500);

  const { data: projectsRes, isLoading } = useProjects({
    search: debouncedSearch,
    status: status === 'all' ? '' : status,
    clientId: clientId === 'all' ? '' : clientId,
  });

  const { data: clientsRaw } = useQuery({
    queryKey: ['clients-list'],
    queryFn: async () => {
      const res = await fetch('/api/clients');
      const json = await res.json();
      const clients = json.data?.clients;
      return Array.isArray(clients) ? clients : [];
    },
    initialData: [],
  });
  const clientsRes = Array.isArray(clientsRaw) ? clientsRaw : [];


  const statusColors: any = {
    active: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    maintenance: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    completed: 'bg-slate-500/10 text-slate-500 border-slate-500/20',
    pending_payment: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    paused: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
  };

  return (
    <DashboardLayout>
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Projects</h1>
          <p className="text-muted-foreground">Manage your active projects and client deliverables.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-8 w-8"
              onClick={() => setViewMode('grid')}
            >
              <LayoutGrid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-8 w-8"
              onClick={() => setViewMode('list')}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
          <NewProjectDialog>
            <Button className="bg-indigo-600 hover:bg-indigo-700">
              <Plus className="w-4 h-4 mr-2" /> New Project
            </Button>
          </NewProjectDialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-card p-4 rounded-xl border shadow-sm">
        <div className="relative md:col-span-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search projects by title..."
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger>
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="maintenance">Maintenance</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="pending_payment">Pending Payment</SelectItem>
            <SelectItem value="paused">Paused</SelectItem>
          </SelectContent>
        </Select>
        <Select value={clientId} onValueChange={setClientId}>
          <SelectTrigger>
            <SelectValue placeholder="Client" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Clients</SelectItem>
            {clientsRes?.map((client: any) => (
              <SelectItem key={client._id} value={client._id}>
                {client.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-48 rounded-xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      ) : projectsRes?.data?.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-200">
          <FolderKanban className="w-16 h-16 mb-4 opacity-20" />
          <p className="text-xl font-bold">No projects found</p>
          <p className="mb-6">Try adjusting your filters or create a new project.</p>
          <NewProjectDialog>
            <Button variant="outline">Create Your First Project</Button>
          </NewProjectDialog>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projectsRes?.data?.map((project: any) => (
            <ProjectCard key={project._id} project={project} />
          ))}
        </div>
      ) : (
        <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow>
                <TableHead className="font-bold">Project Title</TableHead>
                <TableHead className="font-bold">Client</TableHead>
                <TableHead className="font-bold">Status</TableHead>
                <TableHead className="font-bold">Type</TableHead>
                <TableHead className="font-bold">Deadline</TableHead>
                <TableHead className="text-right font-bold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projectsRes?.data?.map((project: any) => (
                <TableRow key={project._id}>
                  <TableCell className="font-bold text-slate-900">
                    <Link href={`/projects/${project._id}`} className="hover:text-indigo-600 transition-colors">
                      {project.title}
                    </Link>
                  </TableCell>
                  <TableCell className="font-medium text-slate-600">{project.clientId?.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={statusColors[project.status]}>
                      {project.status.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-slate-500 capitalize">{project.type.replace('_', ' ')}</TableCell>
                  <TableCell className="text-slate-500">
                    {project.deadline ? format(new Date(project.deadline), 'MMM d, yyyy') : 'No deadline'}
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/projects/${project._id}`}>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
    </DashboardLayout>
  );
}
