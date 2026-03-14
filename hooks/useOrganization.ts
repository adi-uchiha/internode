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
    staleTime: 24 * 60 * 60 * 1000, // Org info is very static
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
    onMutate: async (updatedOrg) => {
      await queryClient.cancelQueries({ queryKey: ['organization'] });
      const previousOrg = queryClient.getQueryData(['organization']);

      queryClient.setQueryData(['organization'], (old: Organization | undefined) => {
        if (!old) return old;
        return { ...old, ...updatedOrg };
      });

      return { previousOrg };
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(['organization'], context?.previousOrg);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['organization'], refetchType: 'none' });
    },
  });
}
