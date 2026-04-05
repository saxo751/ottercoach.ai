import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import type { User } from '../types';

export function useProfile() {
  return useQuery({ queryKey: ['profile'], queryFn: async () => { const { data } = await api.get<User>('/dashboard/profile'); return data; } });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: async (updates: Partial<User>) => { const { data } = await api.put<User>('/dashboard/profile', updates); return data; }, onSuccess: () => { qc.invalidateQueries({ queryKey: ['profile'] }); } });
}
