import { Tabs } from 'expo-router';
import { colors } from '../../src/theme/colors';
import { fonts } from '../../src/theme/fonts';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.dark,
          borderTopColor: colors.surface,
          borderTopWidth: 1,
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { fontFamily: fonts.mono, fontSize: 10 },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'home' }} />
      <Tabs.Screen name="dashboard" options={{ title: 'stats' }} />
      <Tabs.Screen name="chat" options={{ title: 'coach' }} />
      <Tabs.Screen name="techniques" options={{ title: 'library' }} />
      <Tabs.Screen name="profile" options={{ title: 'profile' }} />
    </Tabs>
  );
}
