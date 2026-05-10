import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RetroWindow } from '../../src/components/RetroWindow';
import {
  useFocusHistory,
  useCreateFocus,
  useUpdateFocus,
  useDeleteFocus,
} from '../../src/hooks/use-focus';
import { colors } from '../../src/theme/colors';
import { fonts } from '../../src/theme/fonts';
import { Icon } from '../../src/components/icon';
import type { FocusPeriodWithDays } from '../../src/types';

function parseTechniques(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
  } catch {
    /* fall through */
  }
  return raw.split(',').map((s) => s.trim()).filter(Boolean);
}

function serializeTechniques(input: string): string | null {
  const list = input.split(',').map((s) => s.trim()).filter(Boolean);
  return list.length ? JSON.stringify(list) : null;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function FocusCard({ period, isLast }: { period: FocusPeriodWithDays; isLast: boolean }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(period.name);
  const [description, setDescription] = useState(period.description ?? '');
  const [techniques, setTechniques] = useState(parseTechniques(period.focus_techniques).join(', '));

  const updateMutation = useUpdateFocus();
  const deleteMutation = useDeleteFocus();
  const isActive = period.status === 'active';
  const techList = parseTechniques(period.focus_techniques);

  function startEdit() {
    setName(period.name);
    setDescription(period.description ?? '');
    setTechniques(techList.join(', '));
    setEditing(true);
  }

  function cancelEdit() {
    setEditing(false);
  }

  function saveEdit() {
    if (!name.trim()) return;
    updateMutation.mutate(
      {
        id: period.id,
        body: {
          name: name.trim(),
          description: description.trim() || null,
          focus_techniques: serializeTechniques(techniques),
        },
      },
      { onSuccess: () => setEditing(false) },
    );
  }

  function complete() {
    updateMutation.mutate({ id: period.id, body: { status: 'completed' } });
  }

  function confirmDelete() {
    Alert.alert(
      'Delete focus period?',
      `"${period.name}" will be removed. This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteMutation.mutate(period.id) },
      ],
    );
  }

  const saving = updateMutation.isPending || deleteMutation.isPending;

  return (
    <View style={styles.timelineRow}>
      <View style={styles.markerCol}>
        <View style={[styles.dot, isActive && styles.dotActive]} />
        {!isLast && <View style={styles.line} />}
      </View>

      <View style={[styles.card, isActive && styles.cardActive]}>
        {editing ? (
          <>
            <Text style={styles.fieldLabel}>Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Focus name"
              placeholderTextColor={colors.textMuted}
            />
            <Text style={styles.fieldLabel}>Description</Text>
            <TextInput
              style={[styles.input, styles.inputMultiline]}
              value={description}
              onChangeText={setDescription}
              placeholder="Optional description"
              placeholderTextColor={colors.textMuted}
              multiline
            />
            <Text style={styles.fieldLabel}>Techniques (comma-separated)</Text>
            <TextInput
              style={styles.input}
              value={techniques}
              onChangeText={setTechniques}
              placeholder="e.g. Triangle, Armbar, Hip escape"
              placeholderTextColor={colors.textMuted}
            />
            <View style={styles.actionRow}>
              <Pressable
                style={[styles.btn, styles.btnPrimary, (!name.trim() || saving) && styles.btnDisabled]}
                onPress={saveEdit}
                disabled={!name.trim() || saving}
              >
                <Text style={styles.btnPrimaryText}>{saving ? 'Saving…' : 'Save'}</Text>
              </Pressable>
              <Pressable style={[styles.btn, styles.btnSecondary]} onPress={cancelEdit}>
                <Text style={styles.btnSecondaryText}>Cancel</Text>
              </Pressable>
            </View>
          </>
        ) : (
          <>
            <View style={styles.cardHeader}>
              <Text style={styles.cardName}>{period.name}</Text>
              {isActive && (
                <View style={styles.activeBadge}>
                  <Text style={styles.activeBadgeText}>Active</Text>
                </View>
              )}
            </View>

            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <Text style={styles.statValue}>{period.session_count}</Text>
                <Text style={styles.statLabel}>{period.session_count === 1 ? 'session' : 'sessions'}</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statValue}>{period.days_active}</Text>
                <Text style={styles.statLabel}>{period.days_active === 1 ? 'day' : 'days'}</Text>
              </View>
            </View>

            {period.description ? <Text style={styles.cardDesc}>{period.description}</Text> : null}

            <Text style={styles.cardDates}>
              {formatDate(period.start_date)} — {period.end_date ? formatDate(period.end_date) : 'Present'}
            </Text>

            {techList.length > 0 && (
              <View style={styles.tagsRow}>
                {techList.map((t) => (
                  <View key={t} style={styles.tag}>
                    <Text style={styles.tagText}>{t}</Text>
                  </View>
                ))}
              </View>
            )}

            <View style={styles.actionRow}>
              <Pressable style={[styles.btn, styles.btnSecondary]} onPress={startEdit}>
                <Icon name="pencil-edit-01" size={14} color={colors.textSecondary} />
                <Text style={styles.btnSecondaryText}>Edit</Text>
              </Pressable>
              {isActive && (
                <Pressable
                  style={[styles.btn, styles.btnPrimary, saving && styles.btnDisabled]}
                  onPress={complete}
                  disabled={saving}
                >
                  <Icon name="tick-01" size={14} color={colors.white} />
                  <Text style={styles.btnPrimaryText}>Complete</Text>
                </Pressable>
              )}
              {period.session_count === 0 && (
                <Pressable
                  style={[styles.btn, styles.btnDanger, saving && styles.btnDisabled]}
                  onPress={confirmDelete}
                  disabled={saving}
                >
                  <Icon name="delete-03" size={14} color={colors.error} />
                  <Text style={styles.btnDangerText}>Delete</Text>
                </Pressable>
              )}
            </View>
          </>
        )}
      </View>
    </View>
  );
}

function CreateForm({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [techniques, setTechniques] = useState('');
  const createMutation = useCreateFocus();

  function submit() {
    if (!name.trim()) return;
    const body: { name: string; description?: string; focus_techniques?: string } = { name: name.trim() };
    if (description.trim()) body.description = description.trim();
    const serialized = serializeTechniques(techniques);
    if (serialized) body.focus_techniques = serialized;
    createMutation.mutate(body, { onSuccess: () => onClose() });
  }

  const saving = createMutation.isPending;

  return (
    <View style={styles.createForm}>
      <Text style={styles.fieldLabel}>Name *</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="e.g. Guard retention block"
        placeholderTextColor={colors.textMuted}
      />
      <Text style={styles.fieldLabel}>Description</Text>
      <TextInput
        style={[styles.input, styles.inputMultiline]}
        value={description}
        onChangeText={setDescription}
        placeholder="Optional description"
        placeholderTextColor={colors.textMuted}
        multiline
      />
      <Text style={styles.fieldLabel}>Focus techniques (comma-separated)</Text>
      <TextInput
        style={styles.input}
        value={techniques}
        onChangeText={setTechniques}
        placeholder="e.g. Triangle, Armbar, Hip escape"
        placeholderTextColor={colors.textMuted}
      />
      <View style={styles.actionRow}>
        <Pressable
          style={[styles.btn, styles.btnPrimary, (!name.trim() || saving) && styles.btnDisabled]}
          onPress={submit}
          disabled={!name.trim() || saving}
        >
          <Text style={styles.btnPrimaryText}>{saving ? 'Creating…' : 'Create focus period'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function FocusScreen() {
  const { data: periods, isLoading, isError } = useFocusHistory();
  const [showCreate, setShowCreate] = useState(false);

  const totalSessions = (periods ?? []).reduce((sum, p) => sum + (p.session_count || 0), 0);
  const count = periods?.length ?? 0;

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <RetroWindow
        title="focus_periods.log"
        statusLeft={`${count} focus ${count === 1 ? 'period' : 'periods'}`}
        statusRight={`${totalSessions} total sessions`}
        otterImage={require('../../assets/otters/Otter-meditating.png')}
      >
        {isLoading ? (
          <ActivityIndicator color={colors.accent} style={{ marginTop: 32 }} />
        ) : isError ? (
          <Text style={styles.errorText}>Failed to load focus periods.</Text>
        ) : (
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.headerRow}>
              <Pressable
                style={[styles.btn, showCreate ? styles.btnSecondary : styles.btnPrimary]}
                onPress={() => setShowCreate((v) => !v)}
              >
                <Icon
                  name={showCreate ? 'cancel-01' : 'plus-sign'}
                  size={14}
                  color={showCreate ? colors.textSecondary : colors.white}
                />
                <Text style={showCreate ? styles.btnSecondaryText : styles.btnPrimaryText}>
                  {showCreate ? 'Cancel' : 'New focus'}
                </Text>
              </Pressable>
            </View>

            {showCreate && <CreateForm onClose={() => setShowCreate(false)} />}

            {!showCreate && count === 0 && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>No focus periods yet</Text>
                <Text style={styles.emptyDesc}>
                  Create your first focused training block above, or chat with your coach.
                </Text>
              </View>
            )}

            {count > 0 && (
              <View style={styles.timeline}>
                {periods!.map((p, i) => (
                  <FocusCard key={p.id} period={p} isLast={i === periods!.length - 1} />
                ))}
              </View>
            )}
          </ScrollView>
        )}
      </RetroWindow>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.dark },
  scrollContent: { padding: 16, paddingBottom: 32 },

  headerRow: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 16 },

  errorText: { fontFamily: fonts.body, fontSize: 14, color: colors.error, textAlign: 'center', padding: 32 },

  emptyState: { alignItems: 'center', paddingVertical: 32 },
  emptyTitle: { fontFamily: fonts.heading, fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 8 },
  emptyDesc: { fontFamily: fonts.body, fontSize: 13, color: colors.textSecondary, textAlign: 'center', paddingHorizontal: 24, lineHeight: 18 },

  createForm: {
    backgroundColor: colors.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginBottom: 16,
    gap: 4,
  },

  timeline: { gap: 0 },
  timelineRow: { flexDirection: 'row', gap: 12 },
  markerCol: { alignItems: 'center', width: 14 },
  dot: {
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: colors.midGray,
    borderWidth: 2, borderColor: colors.light,
    marginTop: 6,
  },
  dotActive: { backgroundColor: colors.accent },
  line: { width: 2, flex: 1, backgroundColor: colors.border, marginTop: 4 },

  card: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginBottom: 16,
  },
  cardActive: { borderLeftWidth: 3, borderLeftColor: colors.accent },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' },
  cardName: { fontFamily: fonts.heading, fontSize: 15, fontWeight: '700', color: colors.text, flexShrink: 1 },
  activeBadge: { backgroundColor: colors.accent, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  activeBadgeText: { fontFamily: fonts.heading, fontSize: 10, fontWeight: '600', color: colors.white, textTransform: 'uppercase', letterSpacing: 0.5 },

  statsRow: { flexDirection: 'row', gap: 24, marginBottom: 10 },
  stat: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  statValue: { fontFamily: fonts.heading, fontSize: 22, fontWeight: '800', color: colors.text },
  statLabel: { fontFamily: fonts.body, fontSize: 11, color: colors.textMuted },

  cardDesc: { fontFamily: fonts.body, fontSize: 13, color: colors.textSecondary, lineHeight: 18, marginBottom: 8 },
  cardDates: { fontFamily: fonts.mono, fontSize: 11, color: colors.textMuted, marginBottom: 8 },

  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  tag: { backgroundColor: colors.lightGray, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 3 },
  tagText: { fontFamily: fonts.body, fontSize: 11, color: colors.textSecondary },

  actionRow: { flexDirection: 'row', gap: 8, marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.border, flexWrap: 'wrap' },
  btn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 6, borderWidth: 1 },
  btnPrimary: { backgroundColor: colors.accent, borderColor: colors.accent },
  btnPrimaryText: { fontFamily: fonts.heading, fontSize: 13, fontWeight: '600', color: colors.white },
  btnSecondary: { backgroundColor: colors.white, borderColor: colors.borderMedium },
  btnSecondaryText: { fontFamily: fonts.heading, fontSize: 13, fontWeight: '500', color: colors.textSecondary },
  btnDanger: { backgroundColor: colors.white, borderColor: colors.error },
  btnDangerText: { fontFamily: fonts.heading, fontSize: 13, fontWeight: '500', color: colors.error },
  btnDisabled: { opacity: 0.5 },

  fieldLabel: { fontFamily: fonts.heading, fontSize: 11, fontWeight: '600', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 8, marginBottom: 4 },
  input: {
    borderWidth: 1, borderColor: colors.border, borderRadius: 6,
    paddingHorizontal: 10, paddingVertical: 8,
    fontFamily: fonts.body, fontSize: 14, color: colors.text,
    backgroundColor: colors.light,
  },
  inputMultiline: { minHeight: 60, textAlignVertical: 'top' },
});
