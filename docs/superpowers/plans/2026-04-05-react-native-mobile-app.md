# React Native Mobile App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a React Native mobile app for the BJJ coaching project with full feature parity to the web app — chat, dashboard, focus, techniques, ideas, profile — plus push notifications.

**Architecture:** Expo managed workflow with Expo Router (file-based navigation). Bottom tab bar with 5 tabs (Home, Dashboard, Coach, Techniques, Profile). TanStack Query for server state, Zustand for auth and chat. WebSocket for real-time chat, REST fallback when disconnected. Retro desktop OS aesthetic with window chrome, parchment backgrounds, otter mascots.

**Tech Stack:** Expo 52+, Expo Router, TypeScript, TanStack Query, Zustand, expo-notifications, expo-secure-store, react-native-svg, expo-av

**Spec:** `docs/superpowers/specs/2026-03-22-react-native-mobile-app-design.md`

---

## File Map

```
bjj-coach/mobile/
  app/
    _layout.tsx                 # Root layout (providers, auth check)
    (auth)/
      _layout.tsx               # Auth stack layout (no tabs)
      login.tsx                 # Login screen
      signup.tsx                # 4-step signup wizard
    (tabs)/
      _layout.tsx               # Tab bar layout
      index.tsx                 # Home (retro grid)
      dashboard.tsx             # Dashboard
      chat.tsx                  # Coach chat
      techniques.tsx            # Technique library
      profile.tsx               # Profile
  src/
    types.ts                    # Shared TypeScript interfaces
    stores/
      auth.ts                   # Zustand: token, user, login/logout
      chat.ts                   # Zustand: messages, connection, typing
    services/
      api.ts                    # Axios instance + auth interceptor
      websocket.ts              # WebSocket manager
    hooks/
      use-profile.ts            # TanStack Query: profile
      use-sessions.ts           # TanStack Query: sessions + stats
      use-focus.ts              # TanStack Query: focus periods
      use-techniques.ts         # TanStack Query: technique library
      use-ideas.ts              # TanStack Query: feature ideas
    components/
      RetroWindow.tsx            # Window chrome wrapper
      MessageBubble.tsx          # Chat message bubble
      QuickButtons.tsx           # Interactive button row
  assets/
    otters/                     # Otter SVGs
  app.config.ts                 # Expo config
  package.json
  tsconfig.json
```

---

## Phase 1: Scaffold + Auth + Chat (MVP)

After this phase: user can install, sign up, log in, and chat with the coach on a simulator.

---

### Task 1: Scaffold Expo project

**Files:**
- Create: `bjj-coach/mobile/` (entire scaffold)

- [ ] **Step 1: Create Expo project**

```bash
cd bjj-coach
npx create-expo-app mobile --template tabs
cd mobile
```

- [ ] **Step 2: Install core dependencies**

```bash
npx expo install expo-secure-store expo-notifications expo-av react-native-svg
npm install zustand @tanstack/react-query axios
npm install -D @types/react
```

- [ ] **Step 3: Create app.config.ts**

Replace `app.json` with `app.config.ts`:
```typescript
import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'BJJ Coach',
  slug: 'bjj-coach',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'bjj-coach',
  userInterfaceStyle: 'dark',
  newArchEnabled: true,
  ios: {
    supportsTablet: false,
    bundleIdentifier: 'com.bjjcoach.app',
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/images/adaptive-icon.png',
      backgroundColor: '#1a1a2e',
    },
    package: 'com.bjjcoach.app',
  },
  plugins: ['expo-secure-store', 'expo-notifications', 'expo-router'],
  extra: {
    API_URL: process.env.API_URL || 'http://localhost:3000/api',
    WS_URL: process.env.WS_URL || 'ws://localhost:3000/ws',
  },
});
```

Delete `app.json` after creating this.

- [ ] **Step 4: Create src/types.ts**

```typescript
export interface User {
  id: string;
  email: string | null;
  name: string | null;
  belt_rank: string | null;
  experience_months: number | null;
  training_start_month: string | null;
  preferred_game_style: string | null;
  training_days: string | null;
  typical_training_time: string | null;
  injuries_limitations: string | null;
  current_focus_area: string | null;
  goals: string | null;
  timezone: string;
  conversation_mode: string;
  onboarding_complete: number;
  profile_picture?: string | null;
  is_admin?: number;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  link?: string;
  created_at?: string;
}

export interface ChatButton {
  label: string;
  data: string;
}

export interface TrainingSession {
  id: number;
  user_id: string;
  date: string;
  duration_minutes: number | null;
  session_type: string | null;
  positions_worked: string | null;
  techniques_worked: string | null;
  rolling_notes: string | null;
  wins: string | null;
  struggles: string | null;
  new_techniques_learned: string | null;
  energy_level: number | null;
  focus_period_id: number | null;
  focus_name: string | null;
  created_at: string;
}

export interface SessionStats {
  this_week: number;
  this_month: number;
  all_time: number;
}

export interface FocusPeriod {
  id: number;
  user_id: string;
  name: string;
  description: string | null;
  focus_positions: string | null;
  focus_techniques: string | null;
  start_date: string;
  end_date: string | null;
  status: string;
}

export interface FocusPeriodWithDays extends FocusPeriod {
  days_active: number;
  session_count: number;
}

export interface Position {
  id: number;
  user_id: string;
  name: string;
  category: string;
  confidence_level: number;
  last_trained_at: string | null;
  notes: string | null;
}

export interface Technique {
  id: number;
  user_id: string;
  name: string;
  position_from: number | null;
  position_to: number | null;
  technique_type: string;
  confidence_level: number;
  times_drilled: number;
  times_hit_in_rolling: number;
  last_trained_at: string | null;
  video_url: string | null;
  notes: string | null;
}

export interface LibraryTechnique {
  id: number;
  name: string;
  category: string;
  subcategory: string;
  starting_position: string;
  youtube_url: string | null;
  youtube_search_url: string;
  description: string | null;
}

export interface Goal {
  id: number;
  user_id: string;
  description: string;
  status: string;
  progress_notes: string | null;
  created_at: string;
  completed_at: string | null;
}

export interface FeatureIdea {
  id: number;
  user_id: string;
  title: string;
  description: string;
  status: string;
  author_name: string | null;
  vote_count: number;
  comment_count: number;
  user_has_voted: number;
  created_at: string;
  updated_at: string;
}

export interface FeatureIdeaComment {
  id: number;
  idea_id: number;
  user_id: string;
  author_name: string | null;
  content: string;
  created_at: string;
}

export interface AuthUser {
  id: string;
  name: string | null;
  email: string;
  belt_rank: string | null;
  onboarding_complete: number;
  profile_picture?: string | null;
}
```

- [ ] **Step 5: Verify it runs on simulator**

```bash
npx expo start
# Press 'i' for iOS simulator
```

Expected: Default Expo tabs template launches.

- [ ] **Step 6: Commit**

```bash
git add bjj-coach/mobile
git commit -m "feat: scaffold Expo project with dependencies and types"
```

---

### Task 2: Theme and RetroWindow component

**Files:**
- Create: `src/theme/colors.ts`
- Create: `src/theme/fonts.ts`
- Create: `src/components/RetroWindow.tsx`

- [ ] **Step 1: Create color tokens**

Create `bjj-coach/mobile/src/theme/colors.ts`:
```typescript
export const colors = {
  parchment: '#f5f0e8',
  dark: '#1a1a2e',
  surface: '#2a2a4a',
  accent: '#e8a87c',
  text: '#1a1a2e',
  textLight: '#f5f0e8',
  textMuted: '#888',
  close: '#ff5f57',
  minimize: '#febc2e',
  maximize: '#28c840',
  border: '#ddd',
  white: '#fff',
  error: '#ff5f57',
};
```

- [ ] **Step 2: Create font config**

Create `bjj-coach/mobile/src/theme/fonts.ts`:
```typescript
import { Platform } from 'react-native';

export const fonts = {
  mono: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
  body: Platform.select({ ios: 'System', android: 'Roboto', default: 'System' }),
};
```

- [ ] **Step 3: Create RetroWindow component**

Create `bjj-coach/mobile/src/components/RetroWindow.tsx`:
```tsx
import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { colors } from '../theme/colors';
import { fonts } from '../theme/fonts';

interface RetroWindowProps {
  title: string;
  statusLeft?: string;
  statusRight?: string;
  children: React.ReactNode;
  scrollable?: boolean;
}

export function RetroWindow({ title, statusLeft, statusRight, children, scrollable = true }: RetroWindowProps) {
  const Content = scrollable ? ScrollView : View;

  return (
    <View style={styles.container}>
      {/* Title bar */}
      <View style={styles.titleBar}>
        <View style={styles.dots}>
          <View style={[styles.dot, { backgroundColor: colors.close }]} />
          <View style={[styles.dot, { backgroundColor: colors.minimize }]} />
          <View style={[styles.dot, { backgroundColor: colors.maximize }]} />
        </View>
        <Text style={styles.title}>{title}</Text>
      </View>

      {/* Content */}
      <Content style={styles.content} contentContainerStyle={scrollable ? styles.contentContainer : undefined}>
        {children}
      </Content>

      {/* Status bar */}
      {(statusLeft || statusRight) && (
        <View style={styles.statusBar}>
          <Text style={styles.statusText}>{statusLeft}</Text>
          <Text style={styles.statusText}>{statusRight}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dark,
  },
  titleBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  dots: {
    flexDirection: 'row',
    gap: 5,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  title: {
    fontFamily: fonts.mono,
    fontSize: 13,
    color: colors.textMuted,
  },
  content: {
    flex: 1,
    backgroundColor: colors.parchment,
  },
  contentContainer: {
    padding: 16,
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.dark,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  statusText: {
    fontFamily: fonts.mono,
    fontSize: 10,
    color: '#666',
  },
});
```

- [ ] **Step 4: Commit**

```bash
git add bjj-coach/mobile/src/theme bjj-coach/mobile/src/components/RetroWindow.tsx
git commit -m "feat: add retro theme tokens and RetroWindow component"
```

---

### Task 3: Auth store and API service

**Files:**
- Create: `src/services/api.ts`
- Create: `src/stores/auth.ts`

- [ ] **Step 1: Create API service**

Create `bjj-coach/mobile/src/services/api.ts`:
```typescript
import axios from 'axios';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';

const API_URL = Constants.expoConfig?.extra?.API_URL || 'http://localhost:3000/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Auth interceptor
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('bjj_coach_jwt');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Logout on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await SecureStore.deleteItemAsync('bjj_coach_jwt');
    }
    return Promise.reject(error);
  },
);

export { API_URL };
```

- [ ] **Step 2: Create auth store**

Create `bjj-coach/mobile/src/stores/auth.ts`:
```typescript
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
  signup: (data: {
    email: string;
    password: string;
    name: string;
    belt_rank: string;
    experience_months: number;
    training_days: string;
    goals: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  initialized: false,
  loading: false,

  initialize: async () => {
    const token = await SecureStore.getItemAsync('bjj_coach_jwt');
    if (!token) {
      set({ initialized: true });
      return;
    }
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
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  signup: async (signupData) => {
    set({ loading: true });
    try {
      const { data } = await api.post<{ token: string; user: AuthUser }>('/auth/signup', signupData);
      await SecureStore.setItemAsync('bjj_coach_jwt', data.token);
      set({ token: data.token, user: data.user, loading: false });
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  logout: async () => {
    await SecureStore.deleteItemAsync('bjj_coach_jwt');
    set({ token: null, user: null });
  },

  refreshUser: async () => {
    try {
      const { data: user } = await api.get<AuthUser>('/auth/me');
      set({ user });
    } catch {
      // ignore
    }
  },
}));
```

- [ ] **Step 3: Commit**

```bash
git add bjj-coach/mobile/src/services/api.ts bjj-coach/mobile/src/stores/auth.ts
git commit -m "feat: add API service with auth interceptor and Zustand auth store"
```

---

### Task 4: Root layout with providers and auth routing

**Files:**
- Create: `app/_layout.tsx`
- Create: `app/(auth)/_layout.tsx`
- Create: `app/(auth)/login.tsx`
- Create: `app/(auth)/signup.tsx`
- Create: `app/(tabs)/_layout.tsx`

- [ ] **Step 1: Create root layout**

Replace `bjj-coach/mobile/app/_layout.tsx`:
```tsx
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Slot, useRouter, useSegments } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '../src/stores/auth';
import { colors } from '../src/theme/colors';

const queryClient = new QueryClient();

function AuthGate() {
  const { user, initialized } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!initialized) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!user && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (user && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [user, initialized, segments]);

  if (!initialized) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.dark }}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return <Slot />;
}

export default function RootLayout() {
  const initialize = useAuthStore((s) => s.initialize);

  useEffect(() => {
    initialize();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthGate />
    </QueryClientProvider>
  );
}
```

- [ ] **Step 2: Create auth layout**

Create `bjj-coach/mobile/app/(auth)/_layout.tsx`:
```tsx
import { Stack } from 'expo-router';
import { colors } from '../../src/theme/colors';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.dark },
      }}
    />
  );
}
```

- [ ] **Step 3: Create login screen**

Create `bjj-coach/mobile/app/(auth)/login.tsx`:
```tsx
import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Link } from 'expo-router';
import { useAuthStore } from '../../src/stores/auth';
import { colors } from '../../src/theme/colors';
import { fonts } from '../../src/theme/fonts';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, loading } = useAuthStore();

  const handleLogin = async () => {
    if (!email || !password) return;
    try {
      await login(email.trim().toLowerCase(), password);
    } catch (err: any) {
      Alert.alert('Login failed', err.response?.data?.error || 'Check your credentials');
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.window}>
        <View style={styles.titleBar}>
          <View style={styles.dots}>
            <View style={[styles.dot, { backgroundColor: colors.close }]} />
            <View style={[styles.dot, { backgroundColor: colors.minimize }]} />
            <View style={[styles.dot, { backgroundColor: colors.maximize }]} />
          </View>
          <Text style={styles.titleText}>login.exe</Text>
        </View>

        <View style={styles.body}>
          <Text style={styles.heading}>Welcome back</Text>

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="you@email.com"
            placeholderTextColor={colors.textMuted}
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="Password"
            placeholderTextColor={colors.textMuted}
          />

          <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
            <Text style={styles.buttonText}>{loading ? 'Logging in...' : 'Log in'}</Text>
          </TouchableOpacity>

          <Link href="/(auth)/signup" style={styles.link}>
            <Text style={styles.linkText}>New here? Sign up</Text>
          </Link>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: colors.dark },
  window: { borderRadius: 8, overflow: 'hidden' },
  titleBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, padding: 10, gap: 8 },
  dots: { flexDirection: 'row', gap: 5 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  titleText: { fontFamily: fonts.mono, fontSize: 13, color: colors.textMuted },
  body: { backgroundColor: colors.parchment, padding: 24 },
  heading: { fontSize: 22, fontWeight: '700', color: colors.text, marginBottom: 24 },
  label: { fontFamily: fonts.mono, fontSize: 12, color: colors.textMuted, marginBottom: 4, textTransform: 'uppercase' },
  input: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 12, fontSize: 16, marginBottom: 16, color: colors.text },
  button: { backgroundColor: colors.accent, borderRadius: 8, padding: 14, alignItems: 'center', marginTop: 8 },
  buttonText: { color: colors.dark, fontSize: 16, fontWeight: '600' },
  link: { marginTop: 16, alignSelf: 'center' },
  linkText: { color: colors.accent, fontSize: 14 },
});
```

- [ ] **Step 4: Create signup screen (4-step wizard)**

Create `bjj-coach/mobile/app/(auth)/signup.tsx`:
```tsx
import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Link } from 'expo-router';
import { useAuthStore } from '../../src/stores/auth';
import { colors } from '../../src/theme/colors';
import { fonts } from '../../src/theme/fonts';

const BELT_RANKS = ['white', 'blue', 'purple', 'brown', 'black', 'none'];
const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export default function SignupScreen() {
  const [step, setStep] = useState(1);
  const { signup, loading } = useAuthStore();

  // Step 1
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Step 2
  const [beltRank, setBeltRank] = useState('white');
  const [experienceMonths, setExperienceMonths] = useState('');

  // Step 3
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [trainingTime, setTrainingTime] = useState('');

  // Step 4
  const [goals, setGoals] = useState('');

  const toggleDay = (day: string) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleSignup = async () => {
    try {
      const trainingDays: Record<string, string> = {};
      for (const day of selectedDays) {
        trainingDays[day] = trainingTime || '19:00';
      }
      await signup({
        email: email.trim().toLowerCase(),
        password,
        name: name.trim(),
        belt_rank: beltRank,
        experience_months: parseInt(experienceMonths) || 0,
        training_days: JSON.stringify(trainingDays),
        goals: goals.trim(),
      });
    } catch (err: any) {
      Alert.alert('Signup failed', err.response?.data?.error || 'Something went wrong');
    }
  };

  const canAdvance = () => {
    if (step === 1) return name && email && password.length >= 6;
    if (step === 2) return beltRank;
    if (step === 3) return selectedDays.length > 0;
    return true;
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.window}>
        <View style={styles.titleBar}>
          <View style={styles.dots}>
            <View style={[styles.dot, { backgroundColor: colors.close }]} />
            <View style={[styles.dot, { backgroundColor: colors.minimize }]} />
            <View style={[styles.dot, { backgroundColor: colors.maximize }]} />
          </View>
          <Text style={styles.titleText}>signup.exe — step {step}/4</Text>
        </View>

        <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
          {step === 1 && (
            <>
              <Text style={styles.heading}>Create your account</Text>
              <Text style={styles.label}>Name</Text>
              <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Your name" placeholderTextColor={colors.textMuted} />
              <Text style={styles.label}>Email</Text>
              <TextInput style={styles.input} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholder="you@email.com" placeholderTextColor={colors.textMuted} />
              <Text style={styles.label}>Password</Text>
              <TextInput style={styles.input} value={password} onChangeText={setPassword} secureTextEntry placeholder="Min 6 characters" placeholderTextColor={colors.textMuted} />
            </>
          )}

          {step === 2 && (
            <>
              <Text style={styles.heading}>Your BJJ background</Text>
              <Text style={styles.label}>Belt rank</Text>
              <View style={styles.chips}>
                {BELT_RANKS.map((rank) => (
                  <TouchableOpacity
                    key={rank}
                    style={[styles.chip, beltRank === rank && styles.chipSelected]}
                    onPress={() => setBeltRank(rank)}
                  >
                    <Text style={[styles.chipText, beltRank === rank && styles.chipTextSelected]}>{rank}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.label}>Months of experience</Text>
              <TextInput style={styles.input} value={experienceMonths} onChangeText={setExperienceMonths} keyboardType="number-pad" placeholder="e.g. 18" placeholderTextColor={colors.textMuted} />
            </>
          )}

          {step === 3 && (
            <>
              <Text style={styles.heading}>Training schedule</Text>
              <Text style={styles.label}>Training days</Text>
              <View style={styles.chips}>
                {DAYS.map((day) => (
                  <TouchableOpacity
                    key={day}
                    style={[styles.chip, selectedDays.includes(day) && styles.chipSelected]}
                    onPress={() => toggleDay(day)}
                  >
                    <Text style={[styles.chipText, selectedDays.includes(day) && styles.chipTextSelected]}>
                      {day.slice(0, 3)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.label}>Typical training time</Text>
              <TextInput style={styles.input} value={trainingTime} onChangeText={setTrainingTime} placeholder="e.g. 19:00" placeholderTextColor={colors.textMuted} />
            </>
          )}

          {step === 4 && (
            <>
              <Text style={styles.heading}>Goals</Text>
              <Text style={styles.label}>What do you want to improve?</Text>
              <TextInput style={[styles.input, { height: 100, textAlignVertical: 'top' }]} value={goals} onChangeText={setGoals} multiline placeholder="e.g. Better guard retention, submission chains..." placeholderTextColor={colors.textMuted} />
            </>
          )}

          <View style={styles.nav}>
            {step > 1 && (
              <TouchableOpacity style={styles.backButton} onPress={() => setStep(step - 1)}>
                <Text style={styles.backButtonText}>Back</Text>
              </TouchableOpacity>
            )}
            {step < 4 ? (
              <TouchableOpacity
                style={[styles.button, !canAdvance() && styles.buttonDisabled]}
                onPress={() => setStep(step + 1)}
                disabled={!canAdvance()}
              >
                <Text style={styles.buttonText}>Next</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.button} onPress={handleSignup} disabled={loading}>
                <Text style={styles.buttonText}>{loading ? 'Creating...' : 'Start training'}</Text>
              </TouchableOpacity>
            )}
          </View>

          <Link href="/(auth)/login" style={styles.link}>
            <Text style={styles.linkText}>Already have an account? Log in</Text>
          </Link>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: colors.dark },
  window: { borderRadius: 8, overflow: 'hidden', maxHeight: '90%' },
  titleBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, padding: 10, gap: 8 },
  dots: { flexDirection: 'row', gap: 5 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  titleText: { fontFamily: fonts.mono, fontSize: 13, color: colors.textMuted },
  body: { backgroundColor: colors.parchment },
  bodyContent: { padding: 24 },
  heading: { fontSize: 22, fontWeight: '700', color: colors.text, marginBottom: 24 },
  label: { fontFamily: fonts.mono, fontSize: 12, color: colors.textMuted, marginBottom: 4, textTransform: 'uppercase' },
  input: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 12, fontSize: 16, marginBottom: 16, color: colors.text },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white },
  chipSelected: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipText: { fontSize: 14, color: colors.text },
  chipTextSelected: { color: colors.dark, fontWeight: '600' },
  nav: { flexDirection: 'row', gap: 12, marginTop: 8 },
  backButton: { flex: 1, padding: 14, alignItems: 'center', borderRadius: 8, borderWidth: 1, borderColor: colors.border },
  backButtonText: { color: colors.text, fontSize: 16 },
  button: { flex: 1, backgroundColor: colors.accent, borderRadius: 8, padding: 14, alignItems: 'center' },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: colors.dark, fontSize: 16, fontWeight: '600' },
  link: { marginTop: 16, alignSelf: 'center' },
  linkText: { color: colors.accent, fontSize: 14 },
});
```

- [ ] **Step 5: Create tab layout**

Create `bjj-coach/mobile/app/(tabs)/_layout.tsx`:
```tsx
import { Tabs } from 'expo-router';
import { colors } from '../../src/theme/colors';
import { fonts } from '../../src/theme/fonts';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: colors.dark, borderTopColor: colors.surface },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { fontFamily: fonts.mono, fontSize: 10 },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarLabel: 'Home' }} />
      <Tabs.Screen name="dashboard" options={{ title: 'Dashboard', tabBarLabel: 'Stats' }} />
      <Tabs.Screen name="chat" options={{ title: 'Coach', tabBarLabel: 'Coach' }} />
      <Tabs.Screen name="techniques" options={{ title: 'Techniques', tabBarLabel: 'Library' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarLabel: 'Profile' }} />
    </Tabs>
  );
}
```

- [ ] **Step 6: Create placeholder tab screens**

Create each of these as minimal placeholder screens. Example for `bjj-coach/mobile/app/(tabs)/index.tsx`:
```tsx
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RetroWindow } from '../../src/components/RetroWindow';

export default function HomeScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#1a1a2e' }} edges={['top']}>
      <RetroWindow title="home" statusLeft="v1.0.0" statusRight="6 items">
        <Text style={{ fontSize: 16, textAlign: 'center', marginTop: 40 }}>Home screen coming soon</Text>
      </RetroWindow>
    </SafeAreaView>
  );
}
```

Create identical placeholders for `dashboard.tsx`, `chat.tsx`, `techniques.tsx`, and `profile.tsx`, each with their appropriate title (`stats.dashboard`, `coach.chat`, `techniques/`, `profile.cfg`).

- [ ] **Step 7: Test auth flow on simulator**

```bash
cd bjj-coach/mobile && npx expo start
```

Expected: App launches, redirects to login screen. Can navigate to signup. After login/signup with a running server, redirects to tabs.

- [ ] **Step 8: Commit**

```bash
git add bjj-coach/mobile/app
git commit -m "feat: add auth screens, tab navigation, and root layout with auth gate"
```

---

### Task 5: Chat store with WebSocket

**Files:**
- Create: `src/services/websocket.ts`
- Create: `src/stores/chat.ts`

- [ ] **Step 1: Create WebSocket service**

Create `bjj-coach/mobile/src/services/websocket.ts`:
```typescript
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import type { ChatMessage, ChatButton } from '../types';

const WS_URL = Constants.expoConfig?.extra?.WS_URL || 'ws://localhost:3000/ws';

type MessageHandler = (messages: ChatMessage[]) => void;
type ButtonHandler = (text: string, buttons: ChatButton[]) => void;
type StatusHandler = (connected: boolean) => void;

let ws: WebSocket | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let onHistory: MessageHandler | null = null;
let onMessage: ((msg: ChatMessage) => void) | null = null;
let onButtons: ButtonHandler | null = null;
let onStatus: StatusHandler | null = null;
let onAuthError: (() => void) | null = null;
let pendingMessages: string[] = [];

export function setHandlers(handlers: {
  onHistory: MessageHandler;
  onMessage: (msg: ChatMessage) => void;
  onButtons: ButtonHandler;
  onStatus: StatusHandler;
  onAuthError: () => void;
}) {
  onHistory = handlers.onHistory;
  onMessage = handlers.onMessage;
  onButtons = handlers.onButtons;
  onStatus = handlers.onStatus;
  onAuthError = handlers.onAuthError;
}

export async function connect() {
  if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) return;

  const token = await SecureStore.getItemAsync('bjj_coach_jwt');
  if (!token) return;

  ws = new WebSocket(WS_URL);

  ws.onopen = () => {
    ws!.send(JSON.stringify({ type: 'auth', token }));
  };

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);

    switch (msg.type) {
      case 'auth_ok':
        onStatus?.(true);
        for (const text of pendingMessages) {
          ws!.send(JSON.stringify({ type: 'message', text }));
        }
        pendingMessages = [];
        break;

      case 'history':
        if (msg.messages?.length > 0) {
          onHistory?.(msg.messages);
        } else {
          send('/start');
        }
        break;

      case 'message':
        onMessage?.({ role: 'assistant', content: msg.text, created_at: new Date().toISOString() });
        break;

      case 'buttons':
        onMessage?.({ role: 'assistant', content: msg.text, created_at: new Date().toISOString() });
        onButtons?.(msg.text, msg.buttons);
        break;

      case 'system':
        onMessage?.({ role: 'system', content: msg.text, link: msg.link, created_at: new Date().toISOString() });
        break;

      case 'auth_error':
        onAuthError?.();
        break;
    }
  };

  ws.onclose = () => {
    onStatus?.(false);
    scheduleReconnect();
  };

  ws.onerror = () => {
    ws?.close();
  };
}

export function send(text: string) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: 'message', text }));
  } else {
    pendingMessages.push(text);
  }
}

export function sendButton(data: string) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: 'button', data }));
  }
}

export function disconnect() {
  if (reconnectTimer) clearTimeout(reconnectTimer);
  ws?.close();
  ws = null;
}

function scheduleReconnect() {
  if (reconnectTimer) clearTimeout(reconnectTimer);
  reconnectTimer = setTimeout(() => connect(), 3000);
}
```

- [ ] **Step 2: Create chat store**

Create `bjj-coach/mobile/src/stores/chat.ts`:
```typescript
import { create } from 'zustand';
import * as ws from '../services/websocket';
import type { ChatMessage, ChatButton } from '../types';

interface ChatState {
  messages: ChatMessage[];
  buttons: ChatButton[];
  connected: boolean;
  typing: boolean;

  connect: () => void;
  disconnect: () => void;
  sendMessage: (text: string) => void;
  sendButton: (data: string) => void;
}

export const useChatStore = create<ChatState>((set, get) => {
  ws.setHandlers({
    onHistory: (messages) => set({ messages }),
    onMessage: (msg) => {
      set((s) => ({
        messages: [...s.messages, msg],
        typing: false,
        buttons: [],
      }));
    },
    onButtons: (_text, buttons) => set({ buttons }),
    onStatus: (connected) => set({ connected }),
    onAuthError: () => set({ connected: false }),
  });

  return {
    messages: [],
    buttons: [],
    connected: false,
    typing: false,

    connect: () => ws.connect(),
    disconnect: () => ws.disconnect(),

    sendMessage: (text) => {
      if (text !== '/start') {
        set((s) => ({
          messages: [...s.messages, { role: 'user', content: text, created_at: new Date().toISOString() }],
          typing: true,
          buttons: [],
        }));
      } else {
        set({ typing: true });
      }
      ws.send(text);
    },

    sendButton: (data) => {
      set((s) => ({
        messages: [...s.messages, { role: 'user', content: data, created_at: new Date().toISOString() }],
        typing: true,
        buttons: [],
      }));
      ws.sendButton(data);
    },
  };
});
```

- [ ] **Step 3: Commit**

```bash
git add bjj-coach/mobile/src/services/websocket.ts bjj-coach/mobile/src/stores/chat.ts
git commit -m "feat: add WebSocket service and Zustand chat store"
```

---

### Task 6: Chat screen UI

**Files:**
- Create: `src/components/MessageBubble.tsx`
- Create: `src/components/QuickButtons.tsx`
- Modify: `app/(tabs)/chat.tsx`

- [ ] **Step 1: Create MessageBubble component**

Create `bjj-coach/mobile/src/components/MessageBubble.tsx`:
```tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import type { ChatMessage } from '../types';

export function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  if (isSystem) {
    return (
      <View style={styles.systemContainer}>
        <Text style={styles.systemText}>{message.content}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, isUser ? styles.userContainer : styles.coachContainer]}>
      <View style={[styles.bubble, isUser ? styles.userBubble : styles.coachBubble]}>
        <Text style={[styles.text, isUser ? styles.userText : styles.coachText]}>{message.content}</Text>
      </View>
      {message.created_at && (
        <Text style={[styles.time, isUser && styles.timeRight]}>
          {isUser ? '' : 'Coach - '}
          {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 12 },
  userContainer: { alignItems: 'flex-end' },
  coachContainer: { alignItems: 'flex-start' },
  bubble: { maxWidth: '80%', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14 },
  coachBubble: { backgroundColor: colors.surface, borderBottomLeftRadius: 4 },
  userBubble: { backgroundColor: colors.accent, borderBottomRightRadius: 4 },
  text: { fontSize: 15, lineHeight: 20 },
  coachText: { color: colors.textLight },
  userText: { color: colors.dark },
  time: { fontSize: 10, color: colors.textMuted, marginTop: 2 },
  timeRight: { textAlign: 'right' },
  systemContainer: { alignItems: 'center', marginVertical: 8 },
  systemText: { fontSize: 12, color: colors.textMuted, fontStyle: 'italic' },
});
```

- [ ] **Step 2: Create QuickButtons component**

Create `bjj-coach/mobile/src/components/QuickButtons.tsx`:
```tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import type { ChatButton } from '../types';

interface Props {
  buttons: ChatButton[];
  onPress: (data: string) => void;
}

export function QuickButtons({ buttons, onPress }: Props) {
  if (buttons.length === 0) return null;

  return (
    <View style={styles.container}>
      {buttons.map((btn) => (
        <TouchableOpacity key={btn.data} style={styles.button} onPress={() => onPress(btn.data)}>
          <Text style={styles.text}>{btn.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingHorizontal: 12, paddingBottom: 8 },
  button: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: colors.accent, backgroundColor: 'transparent' },
  text: { fontSize: 13, color: colors.accent },
});
```

- [ ] **Step 3: Build chat screen**

Replace `bjj-coach/mobile/app/(tabs)/chat.tsx`:
```tsx
import { useEffect, useRef } from 'react';
import { View, TextInput, TouchableOpacity, FlatList, Text, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useChatStore } from '../../src/stores/chat';
import { MessageBubble } from '../../src/components/MessageBubble';
import { QuickButtons } from '../../src/components/QuickButtons';
import { colors } from '../../src/theme/colors';
import { fonts } from '../../src/theme/fonts';
import { useState } from 'react';

export default function ChatScreen() {
  const { messages, buttons, connected, typing, connect, disconnect, sendMessage, sendButton } = useChatStore();
  const [input, setInput] = useState('');
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    connect();
    return () => disconnect();
  }, []);

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    sendMessage(text);
    setInput('');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={0}>
        {/* Title bar */}
        <View style={styles.titleBar}>
          <View style={styles.dots}>
            <View style={[styles.dot, { backgroundColor: colors.close }]} />
            <View style={[styles.dot, { backgroundColor: colors.minimize }]} />
            <View style={[styles.dot, { backgroundColor: colors.maximize }]} />
          </View>
          <Text style={styles.titleText}>coach.chat</Text>
          <View style={[styles.statusDot, { backgroundColor: connected ? colors.maximize : colors.close }]} />
        </View>

        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(_, i) => i.toString()}
          renderItem={({ item }) => <MessageBubble message={item} />}
          style={styles.messages}
          contentContainerStyle={styles.messagesContent}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />

        {/* Typing indicator */}
        {typing && (
          <View style={styles.typingContainer}>
            <Text style={styles.typingText}>Coach is typing...</Text>
          </View>
        )}

        {/* Quick buttons */}
        <QuickButtons buttons={buttons} onPress={sendButton} />

        {/* Input bar */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Message your coach..."
            placeholderTextColor={colors.textMuted}
            onSubmitEditing={handleSend}
            returnKeyType="send"
          />
          <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
            <Text style={styles.sendText}>Send</Text>
          </TouchableOpacity>
        </View>

        {/* Status bar */}
        <View style={styles.statusBar}>
          <Text style={styles.statusText}>free_chat</Text>
          <Text style={styles.statusText}>{messages.length} msgs</Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  container: { flex: 1, backgroundColor: colors.dark },
  titleBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  dots: { flexDirection: 'row', gap: 5 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  titleText: { fontFamily: fonts.mono, fontSize: 13, color: colors.textMuted, flex: 1 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  messages: { flex: 1, backgroundColor: colors.parchment },
  messagesContent: { padding: 12 },
  typingContainer: { backgroundColor: colors.parchment, paddingHorizontal: 12, paddingBottom: 4 },
  typingText: { fontSize: 12, color: colors.textMuted, fontStyle: 'italic' },
  inputBar: { flexDirection: 'row', backgroundColor: colors.surface, padding: 8, gap: 8, alignItems: 'center' },
  input: { flex: 1, backgroundColor: colors.dark, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 15, color: colors.textLight },
  sendButton: { backgroundColor: colors.accent, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10 },
  sendText: { color: colors.dark, fontWeight: '600', fontSize: 14 },
  statusBar: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: colors.dark, paddingHorizontal: 12, paddingVertical: 4 },
  statusText: { fontFamily: fonts.mono, fontSize: 10, color: '#666' },
});
```

- [ ] **Step 4: Test chat on simulator**

Start the server (`cd bjj-coach/server && npm run dev`), then:
```bash
cd bjj-coach/mobile && npx expo start
```

Log in, navigate to Coach tab. Expected: WebSocket connects, history loads, can send messages and receive coach responses.

- [ ] **Step 5: Commit**

```bash
git add bjj-coach/mobile/src/components/MessageBubble.tsx bjj-coach/mobile/src/components/QuickButtons.tsx bjj-coach/mobile/app/\(tabs\)/chat.tsx
git commit -m "feat: add chat screen with WebSocket messaging and retro UI"
```

---

## Phase 2: Dashboard + Focus + Profile

After this phase: user can view training stats, manage focus periods, and edit their profile.

---

### Task 7: TanStack Query hooks

**Files:**
- Create: `src/hooks/use-profile.ts`
- Create: `src/hooks/use-sessions.ts`
- Create: `src/hooks/use-focus.ts`

- [ ] **Step 1: Create profile hook**

Create `bjj-coach/mobile/src/hooks/use-profile.ts`:
```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import type { User } from '../types';

export function useProfile() {
  return useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const { data } = await api.get<User>('/dashboard/profile');
      return data;
    },
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (updates: Partial<User>) => {
      const { data } = await api.put<User>('/dashboard/profile', updates);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}
```

- [ ] **Step 2: Create sessions hook**

Create `bjj-coach/mobile/src/hooks/use-sessions.ts`:
```typescript
import { useQuery } from '@tanstack/react-query';
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
```

- [ ] **Step 3: Create focus hook**

Create `bjj-coach/mobile/src/hooks/use-focus.ts`:
```typescript
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

export function useCreateFocus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: { name: string; description?: string; focus_techniques?: string; focus_positions?: string }) => {
      const { data } = await api.post<FocusPeriod>('/dashboard/focus', body);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-focus'] });
      queryClient.invalidateQueries({ queryKey: ['focus-history'] });
    },
  });
}
```

- [ ] **Step 4: Commit**

```bash
git add bjj-coach/mobile/src/hooks
git commit -m "feat: add TanStack Query hooks for profile, sessions, and focus"
```

---

### Task 8: Dashboard screen

**Files:**
- Modify: `app/(tabs)/dashboard.tsx`

- [ ] **Step 1: Build dashboard screen**

Replace `bjj-coach/mobile/app/(tabs)/dashboard.tsx`:
```tsx
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RetroWindow } from '../../src/components/RetroWindow';
import { useProfile } from '../../src/hooks/use-profile';
import { useSessionStats } from '../../src/hooks/use-sessions';
import { useActiveFocus } from '../../src/hooks/use-focus';
import { colors } from '../../src/theme/colors';
import { fonts } from '../../src/theme/fonts';

export default function DashboardScreen() {
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: stats } = useSessionStats();
  const { data: focus } = useActiveFocus();

  if (profileLoading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.loading}><ActivityIndicator size="large" color={colors.accent} /></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <RetroWindow title="stats.dashboard" statusLeft={profile?.belt_rank || ''} statusRight={`${stats?.all_time || 0} sessions`}>
        {/* Profile card */}
        <View style={styles.card}>
          <Text style={styles.name}>{profile?.name || 'Coach me'}</Text>
          {profile?.belt_rank && <View style={styles.badge}><Text style={styles.badgeText}>{profile.belt_rank} belt</Text></View>}
          {profile?.preferred_game_style && <Text style={styles.meta}>{profile.preferred_game_style}</Text>}
          {profile?.goals && <Text style={styles.meta}>{profile.goals}</Text>}
        </View>

        {/* Stats row */}
        {stats && (
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{stats.this_week}</Text>
              <Text style={styles.statLabel}>This week</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{stats.this_month}</Text>
              <Text style={styles.statLabel}>This month</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{stats.all_time}</Text>
              <Text style={styles.statLabel}>All time</Text>
            </View>
          </View>
        )}

        {/* Active focus */}
        {focus && (
          <View style={styles.focusCard}>
            <Text style={styles.focusLabel}>ACTIVE FOCUS</Text>
            <Text style={styles.focusName}>{focus.name}</Text>
            {focus.description && <Text style={styles.focusDesc}>{focus.description}</Text>}
          </View>
        )}
      </RetroWindow>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.dark },
  card: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 16, marginBottom: 16 },
  name: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 4 },
  badge: { alignSelf: 'flex-start', backgroundColor: '#3b82f6', paddingHorizontal: 10, paddingVertical: 2, borderRadius: 12, marginBottom: 8 },
  badgeText: { color: colors.white, fontSize: 12, fontWeight: '600' },
  meta: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  statBox: { flex: 1, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 12, alignItems: 'center' },
  statNumber: { fontSize: 22, fontWeight: '700', color: colors.text },
  statLabel: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  focusCard: { backgroundColor: 'rgba(232, 168, 124, 0.15)', borderWidth: 1, borderColor: colors.accent, borderRadius: 8, padding: 12 },
  focusLabel: { fontFamily: fonts.mono, fontSize: 10, color: colors.accent, letterSpacing: 1, fontWeight: '600' },
  focusName: { fontSize: 16, fontWeight: '600', color: colors.text, marginTop: 4 },
  focusDesc: { fontSize: 13, color: colors.textMuted, marginTop: 4 },
});
```

- [ ] **Step 2: Commit**

```bash
git add bjj-coach/mobile/app/\(tabs\)/dashboard.tsx
git commit -m "feat: add dashboard screen with profile, stats, and active focus"
```

---

### Task 9: Profile screen

**Files:**
- Modify: `app/(tabs)/profile.tsx`

- [ ] **Step 1: Build profile screen**

Replace `bjj-coach/mobile/app/(tabs)/profile.tsx`:
```tsx
import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RetroWindow } from '../../src/components/RetroWindow';
import { useProfile, useUpdateProfile } from '../../src/hooks/use-profile';
import { useAuthStore } from '../../src/stores/auth';
import { colors } from '../../src/theme/colors';
import { fonts } from '../../src/theme/fonts';

const BELT_RANKS = ['white', 'blue', 'purple', 'brown', 'black', 'none'];

export default function ProfileScreen() {
  const { data: profile } = useProfile();
  const updateProfile = useUpdateProfile();
  const logout = useAuthStore((s) => s.logout);

  const [name, setName] = useState('');
  const [beltRank, setBeltRank] = useState('');
  const [goals, setGoals] = useState('');
  const [gameStyle, setGameStyle] = useState('');
  const [injuries, setInjuries] = useState('');

  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setBeltRank(profile.belt_rank || '');
      setGoals(profile.goals || '');
      setGameStyle(profile.preferred_game_style || '');
      setInjuries(profile.injuries_limitations || '');
    }
  }, [profile]);

  const handleSave = async () => {
    try {
      await updateProfile.mutateAsync({
        name: name.trim(),
        belt_rank: beltRank,
        goals: goals.trim(),
        preferred_game_style: gameStyle.trim(),
        injuries_limitations: injuries.trim(),
      });
      Alert.alert('Saved', 'Profile updated');
    } catch {
      Alert.alert('Error', 'Failed to update profile');
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <RetroWindow title="profile.cfg" statusLeft={profile?.email || ''}>
        <Text style={styles.label}>Name</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} />

        <Text style={styles.label}>Belt rank</Text>
        <View style={styles.chips}>
          {BELT_RANKS.map((rank) => (
            <TouchableOpacity key={rank} style={[styles.chip, beltRank === rank && styles.chipSelected]} onPress={() => setBeltRank(rank)}>
              <Text style={[styles.chipText, beltRank === rank && styles.chipTextSelected]}>{rank}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Goals</Text>
        <TextInput style={[styles.input, { height: 80 }]} value={goals} onChangeText={setGoals} multiline />

        <Text style={styles.label}>Game style</Text>
        <TextInput style={styles.input} value={gameStyle} onChangeText={setGameStyle} />

        <Text style={styles.label}>Injuries / limitations</Text>
        <TextInput style={[styles.input, { height: 60 }]} value={injuries} onChangeText={setInjuries} multiline />

        <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={updateProfile.isPending}>
          <Text style={styles.saveText}>{updateProfile.isPending ? 'Saving...' : 'Save profile'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <Text style={styles.logoutText}>Log out</Text>
        </TouchableOpacity>
      </RetroWindow>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  label: { fontFamily: fonts.mono, fontSize: 12, color: colors.textMuted, marginBottom: 4, textTransform: 'uppercase', marginTop: 12 },
  input: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 12, fontSize: 16, color: colors.text, textAlignVertical: 'top' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white },
  chipSelected: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipText: { fontSize: 14, color: colors.text },
  chipTextSelected: { color: colors.dark, fontWeight: '600' },
  saveButton: { backgroundColor: colors.accent, borderRadius: 8, padding: 14, alignItems: 'center', marginTop: 24 },
  saveText: { color: colors.dark, fontSize: 16, fontWeight: '600' },
  logoutButton: { borderRadius: 8, padding: 14, alignItems: 'center', marginTop: 12, borderWidth: 1, borderColor: colors.error },
  logoutText: { color: colors.error, fontSize: 16 },
});
```

- [ ] **Step 2: Commit**

```bash
git add bjj-coach/mobile/app/\(tabs\)/profile.tsx
git commit -m "feat: add profile editing screen with logout"
```

---

## Phase 3: Techniques + Ideas + Home

---

### Task 10: Techniques library screen

**Files:**
- Create: `src/hooks/use-techniques.ts`
- Modify: `app/(tabs)/techniques.tsx`

- [ ] **Step 1: Create techniques hook**

Create `bjj-coach/mobile/src/hooks/use-techniques.ts`:
```typescript
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
```

- [ ] **Step 2: Build techniques screen**

Replace `bjj-coach/mobile/app/(tabs)/techniques.tsx`:
```tsx
import { useState, useMemo } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RetroWindow } from '../../src/components/RetroWindow';
import { useLibrary } from '../../src/hooks/use-techniques';
import { colors } from '../../src/theme/colors';
import { fonts } from '../../src/theme/fonts';
import type { LibraryTechnique } from '../../src/types';

export default function TechniquesScreen() {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const { data: techniques } = useLibrary({ search: search || undefined, category: selectedCategory });

  const categories = useMemo(() => {
    if (!techniques) return [];
    return [...new Set(techniques.map((t) => t.category))].sort();
  }, [techniques]);

  const openVideo = (t: LibraryTechnique) => {
    const url = t.youtube_url || t.youtube_search_url;
    if (url) Linking.openURL(url);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <RetroWindow title="techniques/" statusLeft={`${techniques?.length || 0} techniques`} scrollable={false}>
        <View style={styles.searchBar}>
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Search techniques..."
            placeholderTextColor={colors.textMuted}
          />
        </View>

        <FlatList
          data={techniques}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.techniqueCard} onPress={() => openVideo(item)}>
              <View style={styles.techniqueHeader}>
                <Text style={styles.techniqueName}>{item.name}</Text>
                <Text style={styles.techniqueCategory}>{item.category}</Text>
              </View>
              {item.subcategory && <Text style={styles.techniqueSub}>{item.subcategory}</Text>}
              {item.description && <Text style={styles.techniqueDesc} numberOfLines={2}>{item.description}</Text>}
            </TouchableOpacity>
          )}
        />
      </RetroWindow>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  searchBar: { padding: 12, backgroundColor: colors.parchment },
  searchInput: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 10, fontSize: 15, color: colors.text },
  list: { padding: 12 },
  techniqueCard: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 12, marginBottom: 8 },
  techniqueHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  techniqueName: { fontSize: 15, fontWeight: '600', color: colors.text, flex: 1 },
  techniqueCategory: { fontFamily: fonts.mono, fontSize: 10, color: colors.textMuted, backgroundColor: colors.parchment, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  techniqueSub: { fontSize: 12, color: colors.accent, marginTop: 2 },
  techniqueDesc: { fontSize: 13, color: colors.textMuted, marginTop: 4 },
});
```

- [ ] **Step 3: Commit**

```bash
git add bjj-coach/mobile/src/hooks/use-techniques.ts bjj-coach/mobile/app/\(tabs\)/techniques.tsx
git commit -m "feat: add technique library screen with search"
```

---

### Task 11: Home screen (retro icon grid)

**Files:**
- Modify: `app/(tabs)/index.tsx`

- [ ] **Step 1: Build home screen**

Replace `bjj-coach/mobile/app/(tabs)/index.tsx`:
```tsx
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { RetroWindow } from '../../src/components/RetroWindow';
import { colors } from '../../src/theme/colors';
import { fonts } from '../../src/theme/fonts';

const icons = [
  { label: 'coach.chat', emoji: '\u{1F4AC}', route: '/(tabs)/chat' },
  { label: 'stats.dash', emoji: '\u{1F4CA}', route: '/(tabs)/dashboard' },
  { label: 'techniques/', emoji: '\u{1F94B}', route: '/(tabs)/techniques' },
  { label: 'profile.cfg', emoji: '\u{1F464}', route: '/(tabs)/profile' },
];

export default function HomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <RetroWindow title="home" statusLeft="v1.0.0" statusRight={`${icons.length} items`}>
        <View style={styles.grid}>
          {icons.map((item) => (
            <TouchableOpacity key={item.label} style={styles.iconWrapper} onPress={() => router.push(item.route as any)}>
              <View style={styles.iconBox}>
                <Text style={styles.emoji}>{item.emoji}</Text>
              </View>
              <Text style={styles.iconLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.mascot}>
          <Text style={styles.mascotEmoji}>{'\u{1F9A6}'}</Text>
          <Text style={styles.mascotText}>Your pocket coach is ready</Text>
        </View>
      </RetroWindow>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 20, marginTop: 20 },
  iconWrapper: { alignItems: 'center', width: 80 },
  iconBox: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 16, width: 64, height: 64, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  emoji: { fontSize: 28 },
  iconLabel: { fontFamily: fonts.mono, fontSize: 10, color: colors.text, textAlign: 'center' },
  mascot: { alignItems: 'center', marginTop: 40 },
  mascotEmoji: { fontSize: 48 },
  mascotText: { fontSize: 13, color: colors.textMuted, fontStyle: 'italic', marginTop: 8 },
});
```

- [ ] **Step 2: Commit**

```bash
git add bjj-coach/mobile/app/\(tabs\)/index.tsx
git commit -m "feat: add retro home screen with icon grid"
```

---

## Phase 4: Push Notifications

---

### Task 12: Push notification registration

**Files:**
- Create: `src/services/push.ts`
- Modify: `app/_layout.tsx`

- [ ] **Step 1: Create push service**

Create `bjj-coach/mobile/src/services/push.ts`:
```typescript
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { api } from './api';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) {
    console.log('[push] Must use physical device for push notifications');
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('[push] Permission not granted');
    return null;
  }

  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
  const token = tokenData.data;

  // Register with server
  try {
    await api.post('/push/register', { token });
    console.log('[push] Registered token:', token);
  } catch (err) {
    console.error('[push] Failed to register token:', err);
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
    });
  }

  return token;
}

export async function unregisterPushToken(token: string): Promise<void> {
  try {
    await api.post('/push/unregister', { token });
  } catch {
    // ignore
  }
}
```

- [ ] **Step 2: Install expo-device**

```bash
cd bjj-coach/mobile && npx expo install expo-device
```

- [ ] **Step 3: Add push registration to root layout**

In `bjj-coach/mobile/app/_layout.tsx`, add after the `initialize()` call in the `useEffect`:

Add import:
```typescript
import { registerForPushNotifications } from '../src/services/push';
```

Update the `RootLayout` component's `useEffect`:
```typescript
useEffect(() => {
  initialize().then(() => {
    registerForPushNotifications();
  });
}, []);
```

- [ ] **Step 4: Add notification tap handler to navigate to chat**

In `bjj-coach/mobile/app/_layout.tsx`, add inside `RootLayout`:
```typescript
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';

// Inside RootLayout, after the existing useEffect:
useEffect(() => {
  const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
    // Navigate to chat when user taps a notification
    router.push('/(tabs)/chat');
  });
  return () => subscription.remove();
}, []);
```

- [ ] **Step 5: Commit**

```bash
git add bjj-coach/mobile/src/services/push.ts bjj-coach/mobile/app/_layout.tsx
git commit -m "feat: add push notification registration and tap-to-chat handler"
```

---

### Task 13: Final verification

- [ ] **Step 1: Start server and app**

```bash
# Terminal 1
cd bjj-coach/server && npm run dev

# Terminal 2
cd bjj-coach/mobile && npx expo start
```

- [ ] **Step 2: Test on iOS simulator**

Press 'i' in Expo CLI. Verify:
- App launches, shows login screen
- Can sign up (4-step wizard)
- After signup, redirects to tabs
- Chat tab: WebSocket connects, can message coach
- Dashboard: shows profile, stats, focus
- Techniques: library loads, search works
- Profile: can edit and save, logout works
- Home: icon grid navigates to correct tabs

- [ ] **Step 3: Test on Android emulator**

Press 'a' in Expo CLI. Verify same flows.

- [ ] **Step 4: Commit any fixes**

```bash
git add -A
git commit -m "chore: final fixes from end-to-end testing"
```
