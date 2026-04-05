import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import type { TrainingSession, SessionStats } from '../types';

export function useSessions(limit = 10) {
  return useQuery({ queryKey: ['sessions', limit], queryFn: async () => { const { data } = await api.get<TrainingSession[]>('/dashboard/sessions', { params: { limit } }); return data; } });
}

export function useSessionStats() {
  return useQuery({ queryKey: ['session-stats'], queryFn: async () => { const { data } = await api.get<SessionStats>('/dashboard/stats'); return data; } });
}
