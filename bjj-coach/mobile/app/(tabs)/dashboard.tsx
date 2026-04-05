import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RetroWindow } from '../../src/components/RetroWindow';
import { useProfile } from '../../src/hooks/use-profile';
import { useSessionStats } from '../../src/hooks/use-sessions';
import { useActiveFocus } from '../../src/hooks/use-focus';
import { colors } from '../../src/theme/colors';
import { fonts } from '../../src/theme/fonts';

function BeltBadge({ rank }: { rank: string | null }) {
  if (!rank) return null;
  const beltColors: Record<string, string> = {
    White: '#f0f0f0',
    Blue: '#4a90d9',
    Purple: '#9b59b6',
    Brown: '#8b4513',
    Black: '#1a1a1a',
  };
  return (
    <View style={[styles.beltBadge, { backgroundColor: beltColors[rank] || '#888' }]}>
      <Text style={[styles.beltText, rank === 'White' ? { color: '#333' } : { color: '#fff' }]}>{rank}</Text>
    </View>
  );
}

function StatCard({ label, value }: { label: string; value: number | undefined }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value ?? '-'}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function DashboardScreen() {
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: stats, isLoading: statsLoading } = useSessionStats();
  const { data: focus } = useActiveFocus();

  if (profileLoading) {
    return (
      <SafeAreaView style={styles.root} edges={['top']}>
        <View style={styles.loading}><ActivityIndicator size="large" color={colors.accent} /></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <RetroWindow
        title="stats.dash"
        statusLeft={`user: ${profile?.name || 'unknown'}`}
        statusRight={`mode: ${profile?.conversation_mode || 'idle'}`}
      >
        <View style={styles.profileCard}>
          <View style={styles.profileRow}>
            <Text style={styles.profileName}>{profile?.name || 'Unknown'}</Text>
            <BeltBadge rank={profile?.belt_rank ?? null} />
          </View>
          {profile?.goals && (
            <Text style={styles.profileGoals} numberOfLines={2}>{profile.goals}</Text>
          )}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>TRAINING SESSIONS</Text>
        </View>

        {statsLoading ? (
          <ActivityIndicator color={colors.accent} style={{ marginVertical: 16 }} />
        ) : (
          <View style={styles.statsRow}>
            <StatCard label="This Week" value={stats?.this_week} />
            <StatCard label="This Month" value={stats?.this_month} />
            <StatCard label="All Time" value={stats?.all_time} />
          </View>
        )}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>CURRENT FOCUS</Text>
        </View>

        {focus ? (
          <View style={styles.focusCard}>
            <Text style={styles.focusName}>{focus.name}</Text>
            {focus.description && <Text style={styles.focusDesc}>{focus.description}</Text>}
            <Text style={styles.focusMeta}>Started {new Date(focus.start_date).toLocaleDateString()}</Text>
          </View>
        ) : (
          <Text style={styles.emptyText}>No active focus period. Chat with your coach to set one.</Text>
        )}
      </RetroWindow>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.dark },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.dark },
  profileCard: { backgroundColor: colors.white, borderRadius: 8, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: colors.border },
  profileRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  profileName: { fontFamily: fonts.mono, fontSize: 18, color: colors.text, fontWeight: '600' },
  beltBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4 },
  beltText: { fontFamily: fonts.mono, fontSize: 11, fontWeight: '600' },
  profileGoals: { fontFamily: fonts.body, fontSize: 13, color: colors.textMuted, lineHeight: 18 },
  sectionHeader: { marginBottom: 8, marginTop: 4 },
  sectionTitle: { fontFamily: fonts.mono, fontSize: 10, color: colors.textMuted, letterSpacing: 1 },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  statCard: { flex: 1, backgroundColor: colors.dark, borderRadius: 8, padding: 14, alignItems: 'center' },
  statValue: { fontFamily: fonts.mono, fontSize: 28, color: colors.accent },
  statLabel: { fontFamily: fonts.mono, fontSize: 9, color: colors.textMuted, marginTop: 2 },
  focusCard: { backgroundColor: colors.white, borderRadius: 8, padding: 16, borderWidth: 1, borderColor: colors.border, borderLeftWidth: 4, borderLeftColor: colors.accent },
  focusName: { fontFamily: fonts.mono, fontSize: 15, color: colors.text, marginBottom: 4 },
  focusDesc: { fontFamily: fonts.body, fontSize: 13, color: colors.textMuted, lineHeight: 18, marginBottom: 8 },
  focusMeta: { fontFamily: fonts.mono, fontSize: 10, color: colors.textMuted },
  emptyText: { fontFamily: fonts.mono, fontSize: 12, color: colors.textMuted, fontStyle: 'italic', textAlign: 'center', padding: 16 },
});
