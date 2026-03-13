import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface Organization {
  organizationName: string;
  organizationDomain: string;
}

export function useOrganization() {
  return useQuery({
    queryKey: ['organization'],
    queryFn: async () => {
      const res = await fetch('/api/organization');
      if (!res.ok) throw new Error('Failed to fetch organization');
      return res.json() as Promise<Organization>;
    },
  });
}

export function useUpdateOrganization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (organization: Partial<Organization>) => {
      const res = await fetch('/api/organization', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(organization),
      });
      if (!res.ok) throw new Error('Failed to update organization');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization'] });
    },
  });
}
