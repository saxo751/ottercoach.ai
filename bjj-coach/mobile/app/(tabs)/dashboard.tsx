import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RetroWindow } from '../../src/components/RetroWindow';
import { SessionForm } from '../../src/components/SessionForm';
import { useProfile } from '../../src/hooks/use-profile';
import {
  useSessions,
  useSessionStats,
  useCreateSession,
  useUpdateSession,
  useDeleteSession,
} from '../../src/hooks/use-sessions';
import { useActiveFocus, useFocusHistory } from '../../src/hooks/use-focus';
import { usePositions, useUserTechniques } from '../../src/hooks/use-techniques';
import { colors } from '../../src/theme/colors';
import { fonts } from '../../src/theme/fonts';
import { Icon } from '../../src/components/icon';
import type {
  User,
  Position,
  Technique,
  TrainingSession,
  SessionStats,
  FocusPeriod,
  FocusPeriodWithDays,
} from '../../src/types';

function BeltBadge({ rank }: { rank: string | null }) {
  if (!rank) return null;
  const beltColors: Record<string, string> = {
    White: colors.beltWhite,
    Blue: colors.beltBlue,
    Purple: colors.beltPurple,
    Brown: colors.beltBrown,
    Black: colors.beltBlack,
  };
  return (
    <View style={[styles.beltBadge, { backgroundColor: beltColors[rank] || colors.midGray }]}>
      <Text style={[styles.beltText, rank === 'White' ? { color: '#333' } : { color: '#fff' }]}>{rank} belt</Text>
    </View>
  );
}

function formatExperience(profile: User): string {
  if (profile.training_start_month) {
    const match = profile.training_start_month.match(/^(\d{4})-(\d{2})$/);
    if (match) {
      const now = new Date();
      const totalMonths = Math.max(
        0,
        (now.getFullYear() - parseInt(match[1], 10)) * 12 +
          (now.getMonth() + 1 - parseInt(match[2], 10)),
      );
      const years = Math.floor(totalMonths / 12);
      const months = totalMonths % 12;
      return years > 0 ? `${years}y ${months}m training` : `${months}m training`;
    }
  }
  if (profile.experience_months) {
    return `${profile.experience_months} mo training`;
  }
  return '';
}

function ProfilePanel({ profile }: { profile: User }) {
  const experience = formatExperience(profile);
  const hasDetails = profile.preferred_game_style || profile.goals || profile.current_focus_area;
  return (
    <View style={styles.panel}>
      <Text style={styles.panelTitle}>{profile.name || 'BJJ Athlete'}</Text>
      <View style={styles.metaRow}>
        <BeltBadge rank={profile.belt_rank} />
        {experience ? <Text style={styles.metaItem}>{experience}</Text> : null}
      </View>
      {hasDetails && (
        <View style={styles.detailList}>
          {profile.preferred_game_style ? (
            <Text style={styles.detail}>
              <Text style={styles.detailLabel}>Style: </Text>
              {profile.preferred_game_style}
            </Text>
          ) : null}
          {profile.goals ? (
            <Text style={styles.detail}>
              <Text style={styles.detailLabel}>Goals: </Text>
              {profile.goals}
            </Text>
          ) : null}
          {profile.current_focus_area ? (
            <Text style={styles.detail}>
              <Text style={styles.detailLabel}>Current focus: </Text>
              {profile.current_focus_area}
            </Text>
          ) : null}
        </View>
      )}
    </View>
  );
}

function FocusPanel({ focus }: { focus: FocusPeriod }) {
  return (
    <View style={[styles.panel, styles.focusPanel]}>
      <Text style={styles.panelSubtitle}>Active focus: {focus.name}</Text>
      {focus.description ? <Text style={styles.focusDesc}>{focus.description}</Text> : null}
      <Text style={styles.focusDates}>
        Started {focus.start_date}
        {focus.end_date ? ` · Ends ${focus.end_date}` : ''}
      </Text>
    </View>
  );
}

function StatsPanel({ stats }: { stats: SessionStats }) {
  return (
    <View style={styles.panel}>
      <Text style={styles.panelSubtitle}>Training stats</Text>
      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.this_week}</Text>
          <Text style={styles.statLabel}>This week</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.this_month}</Text>
          <Text style={styles.statLabel}>This month</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.all_time}</Text>
          <Text style={styles.statLabel}>All time</Text>
        </View>
      </View>
    </View>
  );
}

function levelColor(level: number): string {
  switch (level) {
    case 1:
      return colors.error;
    case 2:
      return '#f97316';
    case 3:
      return colors.accent;
    case 4:
      return colors.accentGreen;
    case 5:
      return '#10b981';
    default:
      return colors.midGray;
  }
}

function SkillRow({ name, level }: { name: string; level: number }) {
  const pct = Math.max(0, Math.min(5, level)) / 5;
  return (
    <View style={styles.skillRow}>
      <Text style={styles.skillName} numberOfLines={1}>
        {name}
      </Text>
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${pct * 100}%`, backgroundColor: levelColor(level) }]} />
      </View>
      <Text style={styles.levelText}>{level}/5</Text>
    </View>
  );
}

function SkillSnapshotPanel({ positions, techniques }: { positions: Position[]; techniques: Technique[] }) {
  if (positions.length === 0 && techniques.length === 0) {
    return (
      <View style={styles.panel}>
        <Text style={styles.panelSubtitle}>Skill snapshot</Text>
        <Text style={styles.emptyText}>
          No skills tracked yet. Chat with your coach to start building your profile.
        </Text>
      </View>
    );
  }
  return (
    <View style={styles.panel}>
      <Text style={styles.panelSubtitle}>Skill snapshot</Text>
      {positions.length > 0 && (
        <>
          <Text style={styles.sectionLabel}>Positions</Text>
          {positions.map((p) => (
            <SkillRow key={p.id} name={p.name} level={p.confidence_level} />
          ))}
        </>
      )}
      {techniques.length > 0 && (
        <>
          <Text style={styles.sectionLabel}>Techniques</Text>
          {techniques.map((t) => (
            <SkillRow key={t.id} name={t.name} level={t.confidence_level} />
          ))}
        </>
      )}
    </View>
  );
}

function parseSessionTechniques(raw: string | null): { drilled: string[]; sparring: string[] } | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && (parsed.drilled || parsed.sparring)) {
      const drilled = Array.isArray(parsed.drilled) ? parsed.drilled : [];
      const sparring = Array.isArray(parsed.sparring) ? parsed.sparring : [];
      if (drilled.length === 0 && sparring.length === 0) return null;
      return { drilled, sparring };
    }
  } catch {
    /* legacy free text */
  }
  return raw.trim() ? { drilled: [raw.trim()], sparring: [] } : null;
}

function SessionRow({
  session,
  onEdit,
  onDelete,
}: {
  session: TrainingSession;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const techs = parseSessionTechniques(session.techniques_worked);
  return (
    <View style={styles.sessionCard}>
      <View style={styles.sessionHeader}>
        <Text style={styles.sessionDate}>{session.date}</Text>
        {session.session_type ? (
          <View style={styles.typeBadge}>
            <Text style={styles.typeBadgeText}>{session.session_type}</Text>
          </View>
        ) : null}
        {session.focus_name ? (
          <View style={styles.focusBadge}>
            <Text style={styles.focusBadgeText}>{session.focus_name}</Text>
          </View>
        ) : null}
        {session.duration_minutes ? (
          <Text style={styles.duration}>{session.duration_minutes} min</Text>
        ) : null}
        <View style={styles.sessionActions}>
          <Pressable onPress={onEdit} hitSlop={8} style={styles.iconBtn}>
            <Icon name="pencil-edit-01" size={14} color={colors.textMuted} />
          </Pressable>
          <Pressable onPress={onDelete} hitSlop={8} style={styles.iconBtn}>
            <Icon name="delete-03" size={14} color={colors.textMuted} />
          </Pressable>
        </View>
      </View>

      {session.wins ? (
        <Text style={styles.detail}>
          <Text style={styles.detailLabel}>Wins: </Text>
          {session.wins}
        </Text>
      ) : null}
      {session.struggles ? (
        <Text style={styles.detail}>
          <Text style={styles.detailLabel}>Struggles: </Text>
          {session.struggles}
        </Text>
      ) : null}
      {session.rolling_notes ? <Text style={styles.note}>{session.rolling_notes}</Text> : null}

      {techs && (
        <View style={styles.techWrap}>
          {techs.drilled.length > 0 && (
            <View style={styles.techRow}>
              <Text style={styles.techLabel}>Drilled:</Text>
              {techs.drilled.map((t) => (
                <View key={`d-${t}`} style={styles.techChip}>
                  <Text style={styles.techChipText}>{t}</Text>
                </View>
              ))}
            </View>
          )}
          {techs.sparring.length > 0 && (
            <View style={styles.techRow}>
              <Text style={styles.techLabel}>Sparring:</Text>
              {techs.sparring.map((t) => (
                <View key={`s-${t}`} style={[styles.techChip, styles.techChipSparring]}>
                  <Text style={[styles.techChipText, styles.techChipTextSparring]}>{t}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      {session.energy_level ? (
        <Text style={styles.energyLine}>
          Energy: {'●'.repeat(session.energy_level)}{'○'.repeat(5 - session.energy_level)}
        </Text>
      ) : null}
    </View>
  );
}

function FocusHistoryPanel({ history }: { history: FocusPeriodWithDays[] }) {
  if (history.length === 0) return null;
  return (
    <View style={styles.panel}>
      <Text style={styles.panelSubtitle}>Focus history</Text>
      {history.map((fp) => {
        const isActive = fp.status === 'active';
        return (
          <View key={fp.id} style={[styles.historyItem, isActive && styles.historyItemActive]}>
            <View style={styles.historyHeader}>
              <Text style={styles.historyName}>{fp.name}</Text>
              <Text style={styles.historyDays}>{fp.days_active}d</Text>
            </View>
            <Text style={styles.historyDates}>
              {fp.start_date}
              {fp.end_date ? ` → ${fp.end_date}` : ''}
              {!fp.end_date && isActive ? '  ' : ''}
              {!fp.end_date && isActive ? <Text style={styles.activeTag}>active</Text> : null}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

export default function DashboardScreen() {
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: stats } = useSessionStats();
  const { data: focus } = useActiveFocus();
  const { data: focusHistory } = useFocusHistory();
  const { data: positions } = usePositions();
  const { data: userTechniques } = useUserTechniques();
  const { data: sessions } = useSessions(20);

  const createMutation = useCreateSession();
  const updateMutation = useUpdateSession();
  const deleteMutation = useDeleteSession();

  const [formOpen, setFormOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<TrainingSession | null>(null);

  function openAdd() {
    setEditingSession(null);
    setFormOpen(true);
  }

  function openEdit(session: TrainingSession) {
    setEditingSession(session);
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditingSession(null);
  }

  function handleSave(data: Partial<TrainingSession>) {
    if (editingSession) {
      updateMutation.mutate(
        { id: editingSession.id, body: data },
        { onSuccess: () => closeForm() },
      );
    } else {
      createMutation.mutate(data, { onSuccess: () => closeForm() });
    }
  }

  function confirmDelete(session: TrainingSession) {
    Alert.alert(
      'Delete session?',
      `Session from ${session.date} will be removed. This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteMutation.mutate(session.id),
        },
      ],
    );
  }

  if (profileLoading) {
    return (
      <SafeAreaView style={styles.root} edges={['top']}>
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      </SafeAreaView>
    );
  }

  const positionsCount = positions?.length ?? 0;
  const techniquesCount = userTechniques?.length ?? 0;
  const sessionsCount = sessions?.length ?? 0;

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <RetroWindow
        title="stats.dashboard"
        statusLeft={`${positionsCount} positions · ${techniquesCount} techniques`}
        statusRight={`${sessionsCount} ${sessionsCount === 1 ? 'session' : 'sessions'}`}
        otterImage={require('../../assets/otters/Otter-ready-fight-stance.png')}
      >
        {profile ? (
          <ProfilePanel profile={profile} />
        ) : (
          <View style={styles.panel}>
            <Text style={styles.panelTitle}>Welcome</Text>
            <Text style={styles.emptyText}>Start chatting with your coach to build your training profile.</Text>
          </View>
        )}

        {focus ? <FocusPanel focus={focus} /> : null}

        {stats ? <StatsPanel stats={stats} /> : null}

        {focusHistory && focusHistory.length > 0 ? <FocusHistoryPanel history={focusHistory} /> : null}

        <SkillSnapshotPanel positions={positions ?? []} techniques={userTechniques ?? []} />

        <View style={styles.panel}>
          <View style={styles.panelHeader}>
            <Text style={styles.panelSubtitle}>Recent sessions</Text>
            <Pressable style={styles.addBtn} onPress={openAdd}>
              <Icon name="plus-sign" size={12} color={colors.white} />
              <Text style={styles.addBtnText}>Add session</Text>
            </Pressable>
          </View>
          {sessions && sessions.length > 0 ? (
            sessions.map((s) => (
              <SessionRow
                key={s.id}
                session={s}
                onEdit={() => openEdit(s)}
                onDelete={() => confirmDelete(s)}
              />
            ))
          ) : (
            <Text style={styles.emptyText}>
              No training sessions logged yet. Debrief with your coach after training to start tracking.
            </Text>
          )}
        </View>
      </RetroWindow>

      <SessionForm
        visible={formOpen}
        session={editingSession}
        onSave={handleSave}
        onCancel={closeForm}
        saving={createMutation.isPending || updateMutation.isPending}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.dark },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.dark },

  panel: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  panelHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  panelTitle: { fontFamily: fonts.heading, fontSize: 20, fontWeight: '800', color: colors.text, marginBottom: 8 },
  panelSubtitle: { fontFamily: fonts.heading, fontSize: 15, fontWeight: '600', color: colors.text, marginBottom: 8 },

  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' },
  metaItem: { fontFamily: fonts.mono, fontSize: 11, color: colors.textSecondary },

  beltBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 4 },
  beltText: { fontFamily: fonts.heading, fontSize: 11, fontWeight: '600' },

  detailList: { gap: 4 },
  detail: { fontFamily: fonts.body, fontSize: 13, color: colors.text, lineHeight: 18 },
  detailLabel: { fontFamily: fonts.heading, fontWeight: '600', color: colors.textSecondary },

  focusPanel: { borderLeftWidth: 3, borderLeftColor: colors.accent },
  focusDesc: { fontFamily: fonts.body, fontSize: 13, color: colors.textSecondary, marginBottom: 6, lineHeight: 18 },
  focusDates: { fontFamily: fonts.mono, fontSize: 11, color: colors.textMuted },

  statsGrid: { flexDirection: 'row', gap: 12 },
  statItem: { flex: 1, alignItems: 'center', paddingVertical: 8 },
  statValue: { fontFamily: fonts.heading, fontSize: 28, fontWeight: '800', color: colors.text },
  statLabel: { fontFamily: fonts.heading, fontSize: 10, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2 },

  sectionLabel: { fontFamily: fonts.heading, fontSize: 11, fontWeight: '600', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 12, marginBottom: 6 },
  skillRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  skillName: { width: 110, fontFamily: fonts.body, fontSize: 13, color: colors.text },
  barTrack: { flex: 1, height: 8, backgroundColor: colors.lightGray, borderRadius: 4, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 4 },
  levelText: { fontFamily: fonts.mono, fontSize: 11, color: colors.textMuted, width: 28, textAlign: 'right' },

  emptyText: { fontFamily: fonts.body, fontSize: 13, color: colors.textMuted, lineHeight: 18 },

  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.accent, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 6 },
  addBtnText: { fontFamily: fonts.heading, fontSize: 12, fontWeight: '600', color: colors.white },

  sessionCard: { backgroundColor: colors.surfaceMuted, borderWidth: 1, borderColor: colors.border, borderRadius: 6, padding: 12, marginBottom: 8 },
  sessionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' },
  sessionDate: { fontFamily: fonts.mono, fontSize: 13, color: colors.text, fontWeight: '500' },
  typeBadge: { backgroundColor: colors.accent, borderRadius: 4, paddingHorizontal: 8, paddingVertical: 2 },
  typeBadgeText: { fontFamily: fonts.heading, fontSize: 10, color: colors.white, textTransform: 'uppercase', fontWeight: '600' },
  focusBadge: { borderWidth: 1, borderColor: colors.accent, borderRadius: 4, paddingHorizontal: 8, paddingVertical: 2 },
  focusBadgeText: { fontFamily: fonts.heading, fontSize: 10, color: colors.accent, fontWeight: '600' },
  duration: { fontFamily: fonts.mono, fontSize: 11, color: colors.textMuted },
  sessionActions: { marginLeft: 'auto', flexDirection: 'row', gap: 6 },
  iconBtn: { padding: 4 },

  note: { fontFamily: fonts.body, fontSize: 13, color: colors.textSecondary, fontStyle: 'italic', marginTop: 4, lineHeight: 18 },

  techWrap: { gap: 4, marginTop: 6 },
  techRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 4 },
  techLabel: { fontFamily: fonts.heading, fontSize: 10, fontWeight: '600', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginRight: 4 },
  techChip: { backgroundColor: colors.accent, borderRadius: 3, paddingHorizontal: 6, paddingVertical: 1 },
  techChipText: { fontFamily: fonts.heading, fontSize: 10, color: colors.white, fontWeight: '600' },
  techChipSparring: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.accent },
  techChipTextSparring: { color: colors.accent },

  energyLine: { fontFamily: fonts.mono, fontSize: 11, color: colors.textMuted, marginTop: 6 },

  historyItem: { padding: 10, borderWidth: 1, borderColor: colors.border, borderRadius: 6, backgroundColor: colors.surfaceMuted, marginBottom: 8 },
  historyItemActive: { borderLeftWidth: 3, borderLeftColor: colors.accent },
  historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  historyName: { fontFamily: fonts.heading, fontSize: 13, fontWeight: '600', color: colors.text },
  historyDays: { fontFamily: fonts.mono, fontSize: 11, color: colors.textMuted },
  historyDates: { fontFamily: fonts.mono, fontSize: 11, color: colors.textMuted },
  activeTag: { fontFamily: fonts.heading, fontSize: 10, color: colors.white, backgroundColor: colors.accent, fontWeight: '600' },
});
