import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export interface ApiKey {
  id: string; // The hashed ID
  name: string;
  hint: string;
  createdAt: string;
  lastUsedAt: string | null;
}

export function useApiKeys() {
  return useQuery<ApiKey[]>({
    queryKey: ['api-keys'],
    queryFn: () => apiClient.get('/api/api-keys'),
    staleTime: 5 * 60 * 1000,
  });
}

export function useGenerateApiKey() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (name: string) =>
      apiClient.post<ApiKey & { rawToken: string }>(
        '/api/api-keys',
        { name },
        { toastMessage: 'API Key generated successfully' }
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
    },
  });
}

export function useRevokeApiKey() {
  const queryClient = useQueryClient();

  return useMutation({
    // Using URLSearchParams safely if needed, but simple string interpolation is fine
    // as id is a hex string hash from our backend.
    mutationFn: (id: string) =>
      apiClient.delete(`/api/api-keys?id=${id}`, {
        toastMessage: 'API Key revoked permanently',
      }),
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: ['api-keys'] });
      const previousKeys = queryClient.getQueryData<ApiKey[]>(['api-keys']);

      // Optimistically remove the key from the list
      if (previousKeys) {
        queryClient.setQueryData<ApiKey[]>(
          ['api-keys'],
          previousKeys.filter((key) => key.id !== id)
        );
      }

      return { previousKeys };
    },
    onError: (err, id, context) => {
      if (context?.previousKeys) {
        queryClient.setQueryData(['api-keys'], context.previousKeys);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'], refetchType: 'none' });
    },
  });
}
