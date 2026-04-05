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
    if (!user && !inAuthGroup) router.replace('/(auth)/login');
    else if (user && inAuthGroup) router.replace('/(tabs)');
  }, [user, initialized, segments]);

  if (!initialized) {
    return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.dark }}><ActivityIndicator size="large" color={colors.accent} /></View>;
  }
  return <Slot />;
}

export default function RootLayout() {
  const initialize = useAuthStore((s) => s.initialize);
  useEffect(() => { initialize(); }, []);
  return <QueryClientProvider client={queryClient}><AuthGate /></QueryClientProvider>;
}
