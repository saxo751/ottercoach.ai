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
