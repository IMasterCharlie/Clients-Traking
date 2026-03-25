'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface Credential {
  _id: string;
  projectId: string;
  label: string;
  type: 'ftp' | 'cpanel' | 'database' | 'api_key' | 'other';
  username?: string;
  url?: string;
  notes?: string;
  lastViewed?: string;
  createdAt: string;
}

async function apiFetch(url: string, opts?: RequestInit) {
  const res = await fetch(url, opts);
  const json = await res.json();
  if (!json.success) throw new Error(json.message);
  return json.data;
}

export function useCredentials(projectId: string) {
  const queryClient = useQueryClient();
  const key = ['credentials', projectId];

  const { data, isLoading } = useQuery<Credential[]>({
    queryKey: key,
    queryFn: () => apiFetch(`/api/credentials/${projectId}`),
  });

  const create = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      apiFetch(`/api/credentials/${projectId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key }),
  });

  const update = useMutation({
    mutationFn: ({ credId, body }: { credId: string; body: Record<string, unknown> }) =>
      apiFetch(`/api/credentials/${projectId}/${credId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key }),
  });

  const remove = useMutation({
    mutationFn: (credId: string) =>
      apiFetch(`/api/credentials/${projectId}/${credId}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key }),
  });

  const reveal = async (credId: string): Promise<string> => {
    const data = await apiFetch(`/api/credentials/${projectId}/${credId}/reveal`);
    return data.password;
  };

  return { data: data || [], isLoading, create, update, remove, reveal };
}
