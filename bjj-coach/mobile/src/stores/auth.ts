import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { api } from '../services/api';
import type { AuthUser } from '../types';

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  initialized: boolean;
  loading: boolean;
  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  signup: (data: { email: string; password: string; name: string; belt_rank: string; experience_months: number; training_days: string; goals: string }) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  initialized: false,
  loading: false,

  initialize: async () => {
    const token = await SecureStore.getItemAsync('bjj_coach_jwt');
    if (!token) { set({ initialized: true }); return; }
    set({ token });
    try {
      const { data: user } = await api.get<AuthUser>('/auth/me');
      set({ user, initialized: true });
    } catch {
      await SecureStore.deleteItemAsync('bjj_coach_jwt');
      set({ token: null, initialized: true });
    }
  },

  login: async (email, password) => {
    set({ loading: true });
    try {
      const { data } = await api.post<{ token: string; user: AuthUser }>('/auth/login', { email, password });
      await SecureStore.setItemAsync('bjj_coach_jwt', data.token);
      set({ token: data.token, user: data.user, loading: false });
    } catch (error) { set({ loading: false }); throw error; }
  },

  signup: async (signupData) => {
    set({ loading: true });
    try {
      const { data } = await api.post<{ token: string; user: AuthUser }>('/auth/signup', signupData);
      await SecureStore.setItemAsync('bjj_coach_jwt', data.token);
      set({ token: data.token, user: data.user, loading: false });
    } catch (error) { set({ loading: false }); throw error; }
  },

  logout: async () => {
    await SecureStore.deleteItemAsync('bjj_coach_jwt');
    set({ token: null, user: null });
  },
}));
