import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export function useProjects(filters: any = {}) {
  const queryParams = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value) queryParams.append(key, String(value));
  });

  return useQuery({
    queryKey: ['projects', filters],
    queryFn: async () => {
      const res = await fetch(`/api/projects?${queryParams.toString()}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      return json;
    },
  });
}

export function useProjectDetail(id: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['project', id],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${id}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      return json.data;
    },
    enabled: !!id,
  });

  const updateOnboarding = useMutation({
    mutationFn: async ({ key, completed }: { key: string; completed: boolean }) => {
      const res = await fetch(`/api/projects/${id}/onboarding`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, completed }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', id] });
    },
    onError: (err: any) => {
      toast.error(err.message);
    },
  });

  const updateProject = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(`/api/projects/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', id] });
      toast.success('Project updated');
    },
    onError: (err: any) => {
      toast.error(err.message);
    },
  });

  return {
    ...query,
    updateOnboarding,
    updateProject,
  };
}
