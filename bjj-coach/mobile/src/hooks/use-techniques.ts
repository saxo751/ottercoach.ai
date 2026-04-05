import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import type { LibraryTechnique } from '../types';

export function useLibrary(opts?: { category?: string; search?: string }) {
  return useQuery({
    queryKey: ['library', opts?.category, opts?.search],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (opts?.category) params.category = opts.category;
      if (opts?.search) params.search = opts.search;
      const { data } = await api.get<LibraryTechnique[]>('/dashboard/library', { params });
      return data;
    },
  });
}
