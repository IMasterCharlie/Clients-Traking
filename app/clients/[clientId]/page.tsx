'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  Mail, 
  Phone, 
  Building2, 
  Globe, 
  Tag as TagIcon,
  Calendar,
  DollarSign,
  Clock,
  Briefcase,
  ChevronLeft,
  Copy,
  RefreshCw,
  Trash2,
  PhoneCall,
  Mail as MailIcon,
  Users,
  StickyNote,
  MessageCircle,
  Edit2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { LogInteractionDialog } from '@/components/clients/LogInteractionDialog';
import { format } from 'date-fns';
import { useProjects } from '@/hooks/use-projects';
import { ProjectCard } from '@/components/projects/ProjectCard';
import { Skeleton } from '@/components/ui/skeleton';
import DashboardLayout from '@/components/shared/DashboardLayout';

interface Client {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  country?: string;
  currency: string;
  status: 'active' | 'inactive' | 'archived';
  tags: string[];
  notes?: string;
  portalEnabled: boolean;
  portalToken: string;
  stats: {
    projectCount: number;
    lastPaymentAmount: number;
    totalPaid: number;
    outstandingBalance: number;
  };
}

interface Communication {
  _id: string;
  type: 'call' | 'email' | 'meeting' | 'note' | 'whatsapp';
  subject: string;
  body: string;
  date: string;
  followUpDate?: string;
}

const commIcons = {
  call: PhoneCall,
  email: MailIcon,
  meeting: Calendar,
  note: StickyNote,
  whatsapp: MessageCircle,
};

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [client, setClient] = useState<Client | null>(null);
  const [comms, setComms] = useState<Communication[]>([]);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState('');

  const { data: projectsRes, isLoading: projectsLoading } = useProjects({ clientId: params.clientId });
  const projects = projectsRes?.data || [];

  const fetchClient = async () => {
    try {
      const response = await fetch(`/api/clients/${params.clientId}`);
      const result = await response.json();
      if (result.success) {
        setClient(result.data);
        setNotes(result.data.notes || '');
      }
    } catch (error) {
      toast.error('Failed to fetch client');
    }
  };

  const fetchComms = async () => {
    try {
      const response = await fetch(`/api/clients/${params.clientId}/comms`);
      const result = await response.json();
      if (result.success) {
        setComms(result.data);
      }
    } catch (error) {
      toast.error('Failed to fetch communications');
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchClient(), fetchComms()]);
      setLoading(false);
    };
    init();
  }, [params.clientId]);

  const handleUpdateNotes = async () => {
    if (notes === client?.notes) return;
    try {
      const response = await fetch(`/api/clients/${params.clientId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      });
      if (response.ok) {
        toast.success('Notes saved');
      }
    } catch (error) {
      toast.error('Failed to save notes');
    }
  };

  const togglePortal = async (enabled: boolean) => {
    try {
      const response = await fetch(`/api/clients/${params.clientId}/portal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ portalEnabled: enabled }),
      });
      if (response.ok) {
        toast.success(enabled ? 'Portal enabled' : 'Portal disabled');
        fetchClient();
      }
    } catch (error) {
      toast.error('Failed to update portal status');
    }
  };

  const regenerateToken = async () => {
    if (!confirm('Are you sure? The old portal link will stop working immediately.')) return;
    try {
      const response = await fetch(`/api/clients/${params.clientId}/portal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ regenerateToken: true }),
      });
      if (response.ok) {
        toast.success('Portal token regenerated');
        fetchClient();
      }
    } catch (error) {
      toast.error('Failed to regenerate token');
    }
  };

  const deleteComm = async (commId: string) => {
    if (!confirm('Are you sure you want to delete this interaction log?')) return;
    try {
      const response = await fetch(`/api/clients/${params.clientId}/comms/${commId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        toast.success('Interaction deleted');
        fetchComms();
      }
    } catch (error) {
      toast.error('Failed to delete interaction');
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </DashboardLayout>
    );
  }

  if (!client) {
    return (
      <DashboardLayout>
        <div className="text-center py-20 max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold">Client not found</h2>
          <Button className="mt-4" onClick={() => router.push('/clients')}>
            Back to Clients
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const portalUrl = `${window.location.origin}/portal/${client.portalToken}`;

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="relative overflow-hidden rounded-2xl border bg-card p-6 md:p-8 shadow-sm">
        <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none text-primary">
          <Building2 className="w-64 h-64 -mt-16 -mr-16" />
        </div>
        <div className="flex flex-col md:flex-row md:items-start gap-6 relative z-10">
          <Button variant="outline" size="icon" className="h-10 w-10 shrink-0 rounded-full" onClick={() => router.push('/clients')}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          
          <div className="h-20 w-20 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center justify-center text-3xl font-bold tracking-tighter shrink-0 ring-4 ring-background">
            {client.name.charAt(0).toUpperCase()}
          </div>
          
          <div className="space-y-4 flex-1">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">{client.name}</h1>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <Badge variant={client.status === 'active' ? 'default' : client.status === 'archived' ? 'destructive' : 'secondary'} className="px-3 rounded-full">
                    {client.status.toUpperCase()}
                  </Badge>
                  {client.company && (
                    <span className="text-muted-foreground text-sm font-medium flex items-center gap-1.5 px-2 py-1 rounded-md bg-accent/50">
                      <Building2 className="w-4 h-4" /> {client.company}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Button variant="outline" onClick={() => router.push(`/clients/${client._id}/edit`)}>
                  <Edit2 className="w-4 h-4 mr-2" /> Edit Client
                </Button>
                <LogInteractionDialog clientId={client._id} onSuccess={fetchComms} />
              </div>
            </div>

            <div className="flex flex-wrap gap-x-6 gap-y-2 pt-4 mt-2 border-t border-border/50">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4 shrink-0 text-primary/60" />
                <span className="truncate">{client.email}</span>
              </div>
              {client.phone && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4 shrink-0 text-primary/60" />
                  <span>{client.phone}</span>
                </div>
              )}
              {client.country && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Globe className="h-4 w-4 shrink-0 text-primary/60" />
                  <span>{client.country} ({client.currency})</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card className="shadow-sm border-border/50 hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-muted-foreground">Projects</p>
              <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                <Briefcase className="h-5 w-5" />
              </div>
            </div>
            <div>
              <p className="text-3xl font-bold">{client.stats.projectCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-border/50 hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-muted-foreground">Total Paid</p>
              <div className="h-10 w-10 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                <DollarSign className="h-5 w-5" />
              </div>
            </div>
            <div>
              <p className="text-3xl font-bold">${client.stats.totalPaid}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-border/50 hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-muted-foreground">Outstanding</p>
              <div className="h-10 w-10 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center">
                <Clock className="h-5 w-5" />
              </div>
            </div>
            <div>
              <p className="text-3xl font-bold">${client.stats.outstandingBalance}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-border/50 hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-muted-foreground">Last Activity</p>
              <div className="h-10 w-10 rounded-full bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                <Calendar className="h-5 w-5" />
              </div>
            </div>
            <div>
              <p className="text-lg font-bold">
                {comms[0] ? format(new Date(comms[0].date), 'MMM d, yyyy') : 'No activity'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5 lg:w-[600px]">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="comms">Comms</TabsTrigger>
          <TabsTrigger value="portal">Portal</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6 space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="border-none shadow-md overflow-hidden ring-1 ring-border/50">
              <CardHeader className="bg-accent/30 border-b pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary/70" /> Client Details
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground flex items-center gap-2"><Mail className="w-4 h-4" /> Email Address</p>
                    <p className="font-medium">{client.email}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground flex items-center gap-2"><Phone className="w-4 h-4" /> Phone Number</p>
                    <p className="font-medium">{client.phone || 'Not provided'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground flex items-center gap-2"><Building2 className="w-4 h-4" /> Company</p>
                    <p className="font-medium">{client.company || 'Not provided'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground flex items-center gap-2"><Globe className="w-4 h-4" /> Location</p>
                    <p className="font-medium">{client.country ? `${client.country} (${client.currency})` : 'Not provided'}</p>
                  </div>
                </div>
                {client.tags.length > 0 && (
                  <div className="mt-8 pt-6 border-t">
                    <p className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2"><TagIcon className="w-4 h-4" /> Tags</p>
                    <div className="flex flex-wrap gap-2">
                      {client.tags.map(tag => (
                        <Badge key={tag} variant="secondary" className="px-2.5 py-0.5 rounded-full font-medium shadow-sm border border-border/50">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-none shadow-md overflow-hidden ring-1 ring-border/50 flex flex-col">
              <CardHeader className="bg-accent/30 border-b pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <StickyNote className="h-5 w-5 text-primary/70" /> Internal Notes
                </CardTitle>
                <CardDescription>Private notes only visible to your team.</CardDescription>
              </CardHeader>
              <CardContent className="p-0 flex-1 flex">
                <textarea
                  className="w-full h-full min-h-[220px] resize-none border-0 bg-accent/10 px-6 py-4 text-sm focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all font-medium leading-relaxed"
                  placeholder="Add private notes about this client..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  onBlur={handleUpdateNotes}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="projects" className="mt-6">
          {projectsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-48 rounded-xl" />
              ))}
            </div>
          ) : projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed rounded-xl bg-accent/30">
              <Briefcase className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
              <h3 className="text-lg font-semibold">No projects found</h3>
              <p className="text-sm text-muted-foreground mt-1 mb-4">This client doesn't have any active projects yet.</p>
              <Button onClick={() => router.push('/projects')}>Create Project</Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project: any) => (
                <ProjectCard key={project._id} project={project} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="payments" className="mt-6">
          <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed rounded-xl">
            <DollarSign className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">No payments recorded</h3>
            <p className="text-sm text-muted-foreground">Payments module will be available in Phase 4.</p>
          </div>
        </TabsContent>

        <TabsContent value="comms" className="mt-6 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Communication History</h3>
            <LogInteractionDialog clientId={client._id} onSuccess={fetchComms} />
          </div>

          <div className="space-y-4">
            {comms.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No interactions logged yet.
              </div>
            ) : (
              comms.map((comm) => {
                const Icon = commIcons[comm.type];
                return (
                  <Card key={comm._id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex gap-4">
                          <div className="h-10 w-10 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
                            <Icon className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold">{comm.subject}</h4>
                              <Badge variant="outline" className="capitalize text-[10px] h-4">
                                {comm.type}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">{comm.body}</p>
                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" /> {format(new Date(comm.date), 'MMM d, yyyy')}
                              </span>
                              {comm.followUpDate && (
                                <span className="flex items-center gap-1 text-orange-600 font-medium">
                                  <Clock className="h-3 w-3" /> Follow-up: {format(new Date(comm.followUpDate), 'MMM d, yyyy')}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => deleteComm(comm._id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>

        <TabsContent value="portal" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Client Portal Settings</CardTitle>
              <CardDescription>
                Enable a private dashboard for your client to view projects, invoices, and files.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 border rounded-lg bg-accent/30">
                <div className="space-y-0.5">
                  <p className="font-medium">Portal Access</p>
                  <p className="text-sm text-muted-foreground">
                    {client.portalEnabled ? 'The portal is currently active and accessible via the link below.' : 'The portal is currently disabled.'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant={client.portalEnabled ? 'destructive' : 'default'}
                    onClick={() => togglePortal(!client.portalEnabled)}
                  >
                    {client.portalEnabled ? 'Disable Portal' : 'Enable Portal'}
                  </Button>
                </div>
              </div>

              {client.portalEnabled && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Portal URL</label>
                    <div className="flex gap-2">
                      <input
                        readOnly
                        value={portalUrl}
                        className="flex-1 h-10 rounded-md border border-input bg-muted px-3 py-2 text-sm"
                      />
                      <Button variant="outline" size="icon" onClick={() => {
                        navigator.clipboard.writeText(portalUrl);
                        toast.success('URL copied');
                      }}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <h4 className="text-sm font-semibold text-destructive mb-2">Danger Zone</h4>
                    <p className="text-xs text-muted-foreground mb-4">
                      Regenerating the token will immediately invalidate the current link. Your client will need the new link to access their portal.
                    </p>
                    <Button variant="outline" className="text-destructive border-destructive hover:bg-destructive/10" onClick={regenerateToken}>
                      <RefreshCw className="mr-2 h-4 w-4" /> Regenerate Portal Token
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </DashboardLayout>
  );
}
