import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import type { TrainingSession, SessionStats } from '../types';

export function useSessions(limit = 10) {
  return useQuery({
    queryKey: ['sessions', limit],
    queryFn: async () => {
      const { data } = await api.get<TrainingSession[]>('/dashboard/sessions', { params: { limit } });
      return data;
    },
  });
}

export function useSessionStats() {
  return useQuery({
    queryKey: ['session-stats'],
    queryFn: async () => {
      const { data } = await api.get<SessionStats>('/dashboard/stats');
      return data;
    },
  });
}

function invalidateSessions(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ['sessions'] });
  qc.invalidateQueries({ queryKey: ['session-stats'] });
  qc.invalidateQueries({ queryKey: ['focus-history'] });
}

export function useCreateSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: Partial<TrainingSession>) => {
      const { data } = await api.post<TrainingSession>('/dashboard/sessions', body);
      return data;
    },
    onSuccess: () => invalidateSessions(qc),
  });
}

export function useUpdateSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, body }: { id: number; body: Partial<TrainingSession> }) => {
      const { data } = await api.put<TrainingSession>(`/dashboard/sessions/${id}`, body);
      return data;
    },
    onSuccess: () => invalidateSessions(qc),
  });
}

export function useDeleteSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/dashboard/sessions/${id}`);
    },
    onSuccess: () => invalidateSessions(qc),
  });
}
