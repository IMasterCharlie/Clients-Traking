'use client';

import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ExternalLink, Clock, FolderKanban } from 'lucide-react';

interface ProjectCardProps {
  project: any;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const statusColors: any = {
    active: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    maintenance: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    completed: 'bg-slate-500/10 text-slate-500 border-slate-500/20',
    pending_payment: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    paused: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
  };

  const deadline = project.deadline ? new Date(project.deadline) : null;
  const isOverdue = deadline && deadline < new Date() && project.status !== 'completed';

  return (
    <Link href={`/projects/${project._id}`}>
      <Card className="group hover:shadow-md transition-all duration-200 border-l-4 overflow-hidden" style={{ borderLeftColor: project.color || '#4f46e5' }}>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start mb-1">
            <Badge variant="outline" className={statusColors[project.status]}>
              {project.status.replace('_', ' ')}
            </Badge>
            {project.liveUrl && (
              <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
            )}
          </div>
          <CardTitle className="text-lg font-bold group-hover:text-indigo-600 transition-colors line-clamp-1">
            {project.title}
          </CardTitle>
          <p className="text-sm text-slate-500 font-medium">{project.clientId?.name || 'Unknown Client'}</p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-1 mb-4">
            {project.techStack?.slice(0, 3).map((tech: string) => (
              <Badge key={tech} variant="secondary" className="text-[10px] px-1.5 py-0">
                {tech}
              </Badge>
            ))}
            {project.techStack?.length > 3 && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                +{project.techStack.length - 3}
              </Badge>
            )}
          </div>
          
          <div className="flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-1">
              <FolderKanban className="w-3 h-3" />
              <span>{project.type.replace('_', ' ')}</span>
            </div>
            {deadline && (
              <div className={`flex items-center gap-1 ${isOverdue ? 'text-rose-500 font-bold' : ''}`}>
                <Clock className="w-3 h-3" />
                <span>{isOverdue ? 'Overdue' : formatDistanceToNow(deadline, { addSuffix: true })}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
