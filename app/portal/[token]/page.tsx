'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { 
  Briefcase, 
  FileText, 
  Clock, 
  CheckCircle2, 
  ExternalLink,
  Building2,
  Mail,
  Phone,
  Globe
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

import { formatDistanceToNow } from 'date-fns';

interface PortalData {
  client: {
    name: string;
    company?: string;
    email: string;
    phone?: string;
    country?: string;
    currency: string;
  };
  projects: any[];
  invoices: any[];
}

export default function PublicPortalPage() {
  const params = useParams();
  const [data, setData] = useState<PortalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPortalData = async () => {
      try {
        const response = await fetch(`/api/portal/${params.token}`);
        const result = await response.json();
        if (result.success) {
          setData(result.data);
        } else {
          setError(result.message);
        }
      } catch (err) {
        setError('Failed to load portal');
      } finally {
        setLoading(false);
      }
    };
    fetchPortalData();
  }, [params.token]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-background p-4 text-center">
        <div className="h-16 w-16 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mb-4">
          <ExternalLink className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-bold">Access Denied</h1>
        <p className="text-muted-foreground mt-2 max-w-md">
          {error || 'This portal link is invalid or has been disabled by the administrator.'}
        </p>
        <Button className="mt-6" variant="outline" onClick={() => window.location.reload()}>
          Try Again
        </Button>
      </div>
    );
  }

  const activeProjects = data?.projects.filter(p => !['completed', 'paused'].includes(p.status)).length || 0;
  const completedProjects = data?.projects.filter(p => p.status === 'completed').length || 0;
  const unpaidInvoicesList = data?.invoices.filter(i => !['paid', 'cancelled'].includes(i.status)) || [];
  const unpaidInvoicesCount = unpaidInvoicesList.length;
  const totalBalance = unpaidInvoicesList.reduce((sum, inv) => sum + (inv.total || 0), 0);
  
  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount);
  };

  return (
    <div className="min-h-screen bg-accent/30">
      {/* Portal Header */}
      <header className="bg-background border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded bg-primary flex items-center justify-center text-primary-foreground font-bold">
              D
            </div>
            <span className="font-bold text-lg hidden sm:inline-block">DevManager Pro Portal</span>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="bg-background">
              Client: {data.client.name}
            </Badge>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row gap-6 items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Welcome, {data.client.name}</h1>
            <p className="text-muted-foreground mt-1">Here is an overview of your projects and billing status.</p>
          </div>
          <Card className="w-full md:w-80">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{data.client.company || 'Individual'}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{data.client.email}</span>
              </div>
              {data.client.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{data.client.phone}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Stats Summary */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">Active Projects</p>
                <Briefcase className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-2xl font-bold mt-2">{activeProjects}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">Completed</p>
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-2xl font-bold mt-2">{completedProjects}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">Unpaid Invoices</p>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-2xl font-bold mt-2">{unpaidInvoicesCount}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">Total Balance</p>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-2xl font-bold mt-2">{formatCurrency(totalBalance, data.client.currency || 'USD')}</p>
            </CardContent>
          </Card>
        </div>

        {/* Content Grid */}
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Recent Projects */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Recent Projects</h2>
              <Button variant="link" className="text-primary">View All</Button>
            </div>
            <div className="space-y-4">
              {data.projects.length > 0 ? (
                <div className="space-y-3">
                  {data.projects.slice(0, 5).map((project) => (
                    <Card key={project._id} className="overflow-hidden">
                      <div className="border-l-4 p-4" style={{ borderLeftColor: project.color || '#4f46e5' }}>
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-semibold text-lg">{project.title}</h3>
                          <Badge variant={project.status === 'completed' ? 'default' : 'secondary'}>
                            {project.status.replace('_', ' ')}
                          </Badge>
                        </div>
                        {project.description && (
                          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{project.description}</p>
                        )}
                        <div className="flex gap-4 text-xs text-muted-foreground mt-2">
                          {project.deadline && (
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span>Due {new Date(project.deadline).toLocaleDateString()}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center bg-background rounded-xl border border-dashed">
                  <Briefcase className="h-10 w-10 text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">No active projects to display.</p>
                </div>
              )}
            </div>
          </section>

          {/* Recent Invoices */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Recent Invoices</h2>
              <Button variant="link" className="text-primary">View All</Button>
            </div>
            <div className="space-y-4">
              {data.invoices.length > 0 ? (
                <div className="space-y-3">
                  {data.invoices.slice(0, 5).map((invoice) => (
                    <Card key={invoice._id}>
                      <CardContent className="p-4 flex items-center justify-between">
                        <div>
                          <p className="font-bold">{invoice.invoiceNumber}</p>
                          <p className="text-sm text-muted-foreground">Due {new Date(invoice.dueDate).toLocaleDateString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg">{formatCurrency(invoice.total, invoice.currency)}</p>
                          <Badge 
                            variant="outline" 
                            className={`mt-1 ${
                              invoice.status === 'paid' ? 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400' :
                              invoice.status === 'overdue' ? 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400' :
                              'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400'
                            }`}
                          >
                            {invoice.status}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center bg-background rounded-xl border border-dashed">
                  <FileText className="h-10 w-10 text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">No invoices to display.</p>
                </div>
              )}
            </div>
          </section>
        </div>
      </main>

      <footer className="bg-background border-t py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} DevManager Pro. All rights reserved.</p>
          <p className="mt-2">If you have any questions, please contact your project manager directly.</p>
        </div>
      </footer>
    </div>
  );
}
