import { Tabs } from 'expo-router';
import { colors } from '../../src/theme/colors';
import { fonts } from '../../src/theme/fonts';
import { Icon, type IconName } from '../../src/components/icon';

function TabIcon({ name, color }: { name: IconName; color: string }) {
  return <Icon name={name} size={22} color={color} />;
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.dark,
          borderTopColor: colors.lightGray,
          borderTopWidth: 1,
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { fontFamily: fonts.mono, fontSize: 10 },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'home', tabBarIcon: ({ color }) => <TabIcon name="home-01" color={color} /> }} />
      <Tabs.Screen name="dashboard" options={{ title: 'stats', tabBarIcon: ({ color }) => <TabIcon name="dashboard-speed-01" color={color} /> }} />
      <Tabs.Screen name="chat" options={{ title: 'coach', tabBarIcon: ({ color }) => <TabIcon name="message-02" color={color} /> }} />
      <Tabs.Screen name="techniques" options={{ title: 'library', tabBarIcon: ({ color }) => <TabIcon name="award-01" color={color} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'profile', tabBarIcon: ({ color }) => <TabIcon name="user-circle" color={color} /> }} />
    </Tabs>
  );
}
