import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import type { LibraryTechnique, Position, Technique } from '../types';

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

export function usePositions() {
  return useQuery({
    queryKey: ['positions'],
    queryFn: async () => {
      const { data } = await api.get<Position[]>('/dashboard/positions');
      return data;
    },
  });
}

export function useUserTechniques() {
  return useQuery({
    queryKey: ['user-techniques'],
    queryFn: async () => {
      const { data } = await api.get<Technique[]>('/dashboard/techniques');
      return data;
    },
  });
}
