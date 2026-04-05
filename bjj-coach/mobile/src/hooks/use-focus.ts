import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import type { FocusPeriod, FocusPeriodWithDays } from '../types';

export function useActiveFocus() {
  return useQuery({ queryKey: ['active-focus'], queryFn: async () => { const { data } = await api.get<FocusPeriod | null>('/dashboard/focus'); return data; } });
}

export function useFocusHistory() {
  return useQuery({ queryKey: ['focus-history'], queryFn: async () => { const { data } = await api.get<FocusPeriodWithDays[]>('/dashboard/focus/history'); return data; } });
}

export function useCreateFocus() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: async (body: { name: string; description?: string }) => { const { data } = await api.post<FocusPeriod>('/dashboard/focus', body); return data; }, onSuccess: () => { qc.invalidateQueries({ queryKey: ['active-focus'] }); qc.invalidateQueries({ queryKey: ['focus-history'] }); } });
}
