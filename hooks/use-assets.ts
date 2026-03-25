'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

async function fetchAsset(projectId: string) {
  const res = await fetch(`/api/assets/${projectId}`);
  const json = await res.json();
  if (!json.success) throw new Error(json.message);
  return json.data;
}

async function patchSection(projectId: string, section: string, data: Record<string, unknown>) {
  const res = await fetch(`/api/assets/${projectId}/${section}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.message);
  return json.data;
}

async function ensureAssetExists(projectId: string) {
  // Try to create (idempotent – server returns 400 if already exists, that's fine)
  await fetch(`/api/assets/${projectId}`, { method: 'POST' });
}

export function useAssets(projectId: string) {
  const queryClient = useQueryClient();
  const key = ['assets', projectId];

  const { data, isLoading, error } = useQuery({
    queryKey: key,
    queryFn: () => fetchAsset(projectId),
  });

  const updateSection = useMutation({
    mutationFn: async ({ section, data }: { section: string; data: Record<string, unknown> }) => {
      await ensureAssetExists(projectId);
      return patchSection(projectId, section, data);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key }),
  });

  return { data, isLoading, error, updateSection };
}

export function useAssetsOverview() {
  return useQuery({
    queryKey: ['assets-overview'],
    queryFn: async () => {
      const res = await fetch('/api/assets/overview');
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      return json.data as {
        rows: Array<{
          projectId: string;
          title: string;
          color: string;
          status: string;
          client: { name: string; company?: string } | null;
          hostingExpiry: string | null;
          hostingProvider: string | null;
          domainExpiry: string | null;
          domainName: string | null;
          sslExpiry: string | null;
          sslProvider: string | null;
        }>;
        summary: { hostingDue: number; domainsDue: number; sslDue: number };
      };
    },
  });
}
