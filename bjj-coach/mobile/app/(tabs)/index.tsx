import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '../../src/theme/colors';
import { fonts } from '../../src/theme/fonts';

const ICONS = [
  { label: 'coach.chat', subtitle: 'Talk to your coach', tab: '/chat', emoji: '💬' },
  { label: 'stats.dash', subtitle: 'Training stats', tab: '/dashboard', emoji: '📊' },
  { label: 'techniques/', subtitle: 'Technique library', tab: '/techniques', emoji: '📚' },
  { label: 'profile.cfg', subtitle: 'Your settings', tab: '/profile', emoji: '⚙️' },
];

export default function HomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>BJJ Coach</Text>
          <Text style={styles.subtitle}>pocket-coach v1.0.0</Text>
        </View>

        <View style={styles.grid}>
          {ICONS.map((icon) => (
            <TouchableOpacity
              key={icon.tab}
              style={styles.iconItem}
              onPress={() => router.push(icon.tab as any)}
              activeOpacity={0.7}
            >
              <View style={styles.iconBox}>
                <Text style={styles.iconEmoji}>{icon.emoji}</Text>
              </View>
              <Text style={styles.iconLabel}>{icon.label}</Text>
              <Text style={styles.iconSubtitle}>{icon.subtitle}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.footer}>
          <Text style={styles.mascot}>🦦</Text>
          <Text style={styles.footerText}>Your mat companion</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.dark },
  container: { flex: 1, padding: 24 },
  header: { alignItems: 'center', marginBottom: 32, marginTop: 16 },
  title: { fontFamily: fonts.mono, fontSize: 28, color: colors.accent, letterSpacing: 3 },
  subtitle: { fontFamily: fonts.mono, fontSize: 11, color: colors.textMuted, marginTop: 4 },
  grid: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 16, alignContent: 'flex-start' },
  iconItem: { width: '46%', alignItems: 'center', padding: 16 },
  iconBox: {
    width: 72,
    height: 72,
    borderRadius: 12,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#3a3a5a',
  },
  iconEmoji: { fontSize: 32 },
  iconLabel: { fontFamily: fonts.mono, fontSize: 12, color: colors.accent, textAlign: 'center' },
  iconSubtitle: { fontFamily: fonts.mono, fontSize: 10, color: colors.textMuted, textAlign: 'center', marginTop: 2 },
  footer: { alignItems: 'center', paddingBottom: 16 },
  mascot: { fontSize: 36, marginBottom: 4 },
  footerText: { fontFamily: fonts.mono, fontSize: 11, color: colors.textMuted },
});
