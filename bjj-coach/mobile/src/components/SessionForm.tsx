import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { colors } from '../theme/colors';
import { fonts } from '../theme/fonts';
import { Icon } from './icon';
import type { TrainingSession } from '../types';

interface SessionFormProps {
  visible: boolean;
  session: TrainingSession | null;
  onSave: (data: Partial<TrainingSession>) => void;
  onCancel: () => void;
  saving?: boolean;
}

interface ParsedTechniques {
  drilled: string[];
  sparring: string[];
}

function parseTechniquesWorked(raw: string | null): ParsedTechniques {
  if (!raw) return { drilled: [], sparring: [] };
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && (parsed.drilled || parsed.sparring)) {
      return {
        drilled: Array.isArray(parsed.drilled) ? parsed.drilled : [],
        sparring: Array.isArray(parsed.sparring) ? parsed.sparring : [],
      };
    }
  } catch {
    /* legacy free text */
  }
  return raw.trim() ? { drilled: [raw.trim()], sparring: [] } : { drilled: [], sparring: [] };
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

const SESSION_TYPES = ['gi', 'nogi', 'open_mat', 'competition', 'private'];

const TYPE_LABELS: Record<string, string> = {
  gi: 'Gi',
  nogi: 'No-Gi',
  open_mat: 'Open Mat',
  competition: 'Competition',
  private: 'Private',
};

export function SessionForm({ visible, session, onSave, onCancel, saving }: SessionFormProps) {
  const [date, setDate] = useState(todayIso());
  const [sessionType, setSessionType] = useState<string | null>(null);
  const [duration, setDuration] = useState('');
  const [energy, setEnergy] = useState<number | null>(null);
  const [drilled, setDrilled] = useState('');
  const [sparring, setSparring] = useState('');
  const [wins, setWins] = useState('');
  const [struggles, setStruggles] = useState('');
  const [rollingNotes, setRollingNotes] = useState('');

  useEffect(() => {
    if (!visible) return;
    if (session) {
      setDate(session.date);
      setSessionType(session.session_type ?? null);
      setDuration(session.duration_minutes != null ? String(session.duration_minutes) : '');
      setEnergy(session.energy_level ?? null);
      const techs = parseTechniquesWorked(session.techniques_worked);
      setDrilled(techs.drilled.join(', '));
      setSparring(techs.sparring.join(', '));
      setWins(session.wins ?? '');
      setStruggles(session.struggles ?? '');
      setRollingNotes(session.rolling_notes ?? '');
    } else {
      setDate(todayIso());
      setSessionType(null);
      setDuration('');
      setEnergy(null);
      setDrilled('');
      setSparring('');
      setWins('');
      setStruggles('');
      setRollingNotes('');
    }
  }, [visible, session]);

  function handleSave() {
    if (!date) return;
    const drilledList = drilled.split(',').map((s) => s.trim()).filter(Boolean);
    const sparringList = sparring.split(',').map((s) => s.trim()).filter(Boolean);
    const techniques_worked =
      drilledList.length || sparringList.length
        ? JSON.stringify({ drilled: drilledList, sparring: sparringList })
        : null;
    const durationNum = duration.trim() ? parseInt(duration, 10) : null;

    onSave({
      date,
      session_type: sessionType || null,
      duration_minutes: durationNum && !isNaN(durationNum) ? durationNum : null,
      energy_level: energy,
      wins: wins.trim() || null,
      struggles: struggles.trim() || null,
      rolling_notes: rollingNotes.trim() || null,
      techniques_worked,
    });
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>{session ? 'Edit Session' : 'Add Session'}</Text>
            <Pressable onPress={onCancel} hitSlop={8}>
              <Icon name="cancel-01" size={20} color={colors.textMuted} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
            <Text style={styles.label}>Date *</Text>
            <TextInput
              style={styles.input}
              value={date}
              onChangeText={setDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Text style={styles.label}>Type</Text>
            <View style={styles.chipRow}>
              {SESSION_TYPES.map((t) => (
                <Pressable
                  key={t}
                  style={[styles.chip, sessionType === t && styles.chipActive]}
                  onPress={() => setSessionType(sessionType === t ? null : t)}
                >
                  <Text style={[styles.chipText, sessionType === t && styles.chipTextActive]}>
                    {TYPE_LABELS[t]}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.label}>Duration (min)</Text>
            <TextInput
              style={styles.input}
              value={duration}
              onChangeText={setDuration}
              placeholder="e.g. 90"
              placeholderTextColor={colors.textMuted}
              keyboardType="number-pad"
            />

            <Text style={styles.label}>Energy Level</Text>
            <View style={styles.energyRow}>
              {[1, 2, 3, 4, 5].map((n) => (
                <Pressable
                  key={n}
                  onPress={() => setEnergy(energy === n ? null : n)}
                  hitSlop={6}
                >
                  <Text style={[styles.energyDot, energy != null && n <= energy && styles.energyDotActive]}>
                    ●
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.label}>Techniques drilled (comma-separated)</Text>
            <TextInput
              style={styles.input}
              value={drilled}
              onChangeText={setDrilled}
              placeholder="e.g. Triangle, Hip escape"
              placeholderTextColor={colors.textMuted}
            />

            <Text style={styles.label}>Techniques used in sparring (comma-separated)</Text>
            <TextInput
              style={styles.input}
              value={sparring}
              onChangeText={setSparring}
              placeholder="e.g. Armbar, De la Riva sweep"
              placeholderTextColor={colors.textMuted}
            />

            <Text style={styles.label}>Wins</Text>
            <TextInput
              style={[styles.input, styles.multiline]}
              value={wins}
              onChangeText={setWins}
              placeholder="What went well?"
              placeholderTextColor={colors.textMuted}
              multiline
            />

            <Text style={styles.label}>Struggles</Text>
            <TextInput
              style={[styles.input, styles.multiline]}
              value={struggles}
              onChangeText={setStruggles}
              placeholder="What was tough?"
              placeholderTextColor={colors.textMuted}
              multiline
            />

            <Text style={styles.label}>Rolling notes</Text>
            <TextInput
              style={[styles.input, styles.multiline]}
              value={rollingNotes}
              onChangeText={setRollingNotes}
              placeholder="Observations, details…"
              placeholderTextColor={colors.textMuted}
              multiline
            />
          </ScrollView>

          <View style={styles.footer}>
            <Pressable style={[styles.btn, styles.btnSecondary]} onPress={onCancel}>
              <Text style={styles.btnSecondaryText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[styles.btn, styles.btnPrimary, (!date || saving) && styles.btnDisabled]}
              onPress={handleSave}
              disabled={!date || saving}
            >
              <Text style={styles.btnPrimaryText}>{saving ? 'Saving…' : 'Save'}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(20,20,19,0.5)', justifyContent: 'center', padding: 16 },
  modal: { backgroundColor: colors.white, borderRadius: 8, maxHeight: '90%', overflow: 'hidden' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.lightGray, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  headerTitle: { fontFamily: fonts.heading, fontSize: 16, fontWeight: '600', color: colors.text },
  body: { padding: 16, gap: 4 },
  label: { fontFamily: fonts.heading, fontSize: 11, fontWeight: '600', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 10, marginBottom: 4 },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 8, fontFamily: fonts.body, fontSize: 14, color: colors.text, backgroundColor: colors.light },
  multiline: { minHeight: 60, textAlignVertical: 'top' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14, borderWidth: 1, borderColor: colors.borderMedium, backgroundColor: colors.white },
  chipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipText: { fontFamily: fonts.heading, fontSize: 12, color: colors.textSecondary, fontWeight: '500' },
  chipTextActive: { color: colors.white, fontWeight: '600' },
  energyRow: { flexDirection: 'row', gap: 12, paddingVertical: 4 },
  energyDot: { fontSize: 22, color: colors.midGray },
  energyDotActive: { color: colors.accent },
  footer: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, padding: 12, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.surfaceMuted },
  btn: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 6, borderWidth: 1 },
  btnPrimary: { backgroundColor: colors.accent, borderColor: colors.accent },
  btnPrimaryText: { fontFamily: fonts.heading, fontSize: 13, fontWeight: '600', color: colors.white },
  btnSecondary: { backgroundColor: colors.white, borderColor: colors.borderMedium },
  btnSecondaryText: { fontFamily: fonts.heading, fontSize: 13, fontWeight: '500', color: colors.textSecondary },
  btnDisabled: { opacity: 0.5 },
});
