import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import type { FocusPeriod, FocusPeriodWithDays } from '../types';

export function useActiveFocus() {
  return useQuery({
    queryKey: ['active-focus'],
    queryFn: async () => {
      const { data } = await api.get<FocusPeriod | null>('/dashboard/focus');
      return data;
    },
  });
}

export function useFocusHistory() {
  return useQuery({
    queryKey: ['focus-history'],
    queryFn: async () => {
      const { data } = await api.get<FocusPeriodWithDays[]>('/dashboard/focus/history');
      return data;
    },
  });
}

function invalidateFocus(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ['active-focus'] });
  qc.invalidateQueries({ queryKey: ['focus-history'] });
}

export interface CreateFocusBody {
  name: string;
  description?: string;
  focus_techniques?: string;
}

export function useCreateFocus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: CreateFocusBody) => {
      const { data } = await api.post<FocusPeriod>('/dashboard/focus', body);
      return data;
    },
    onSuccess: () => invalidateFocus(qc),
  });
}

export interface UpdateFocusBody {
  name?: string;
  description?: string | null;
  focus_techniques?: string | null;
  status?: 'active' | 'completed';
}

export function useUpdateFocus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, body }: { id: number; body: UpdateFocusBody }) => {
      const { data } = await api.put<FocusPeriod>(`/dashboard/focus/${id}`, body);
      return data;
    },
    onSuccess: () => invalidateFocus(qc),
  });
}

export function useDeleteFocus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/dashboard/focus/${id}`);
    },
    onSuccess: () => invalidateFocus(qc),
  });
}
