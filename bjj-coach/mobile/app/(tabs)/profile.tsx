import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RetroWindow } from '../../src/components/RetroWindow';
import { useProfile, useUpdateProfile } from '../../src/hooks/use-profile';
import { useAuthStore } from '../../src/stores/auth';
import { colors } from '../../src/theme/colors';
import { fonts } from '../../src/theme/fonts';

const BELT_RANKS = ['White', 'Blue', 'Purple', 'Brown', 'Black'];

export default function ProfileScreen() {
  const { data: profile, isLoading } = useProfile();
  const { mutateAsync: updateProfile, isPending: saving } = useUpdateProfile();
  const { logout } = useAuthStore();

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

  async function handleSave() {
    try {
      await updateProfile({
        name: name.trim() || undefined,
        belt_rank: beltRank || undefined,
        goals: goals.trim() || undefined,
        preferred_game_style: gameStyle.trim() || undefined,
        injuries_limitations: injuries.trim() || undefined,
      });
      Alert.alert('Saved', 'Profile updated successfully.');
    } catch {
      Alert.alert('Error', 'Failed to save profile. Please try again.');
    }
  }

  async function handleLogout() {
    Alert.alert('Logout', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.root} edges={['top']}>
        <View style={styles.loading}><ActivityIndicator size="large" color={colors.accent} /></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <RetroWindow title="profile.cfg" statusLeft={`id: ${profile?.id?.slice(0, 8) || '...'}`} statusRight="editable">
        <Text style={styles.label}>NAME</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Your name" placeholderTextColor={colors.textMuted} />

        <Text style={styles.label}>BELT RANK</Text>
        <View style={styles.chips}>
          {BELT_RANKS.map((belt) => (
            <TouchableOpacity
              key={belt}
              style={[styles.chip, beltRank === belt && styles.chipSelected]}
              onPress={() => setBeltRank(belt)}
            >
              <Text style={[styles.chipText, beltRank === belt && styles.chipTextSelected]}>{belt}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>GOALS</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          value={goals}
          onChangeText={setGoals}
          multiline
          numberOfLines={4}
          placeholder="What are you training for?"
          placeholderTextColor={colors.textMuted}
          textAlignVertical="top"
        />

        <Text style={styles.label}>PREFERRED GAME STYLE</Text>
        <TextInput style={styles.input} value={gameStyle} onChangeText={setGameStyle} placeholder="e.g. guard player, leg locker, wrestler" placeholderTextColor={colors.textMuted} />

        <Text style={styles.label}>INJURIES / LIMITATIONS</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          value={injuries}
          onChangeText={setInjuries}
          multiline
          numberOfLines={3}
          placeholder="Any injuries or limitations to be aware of?"
          placeholderTextColor={colors.textMuted}
          textAlignVertical="top"
        />

        <TouchableOpacity style={[styles.saveButton, saving && styles.buttonDisabled]} onPress={handleSave} disabled={saving}>
          <Text style={styles.saveButtonText}>{saving ? 'Saving...' : '> SAVE PROFILE'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </RetroWindow>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.dark },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.dark },
  label: { fontFamily: fonts.mono, fontSize: 10, color: colors.textMuted, marginBottom: 6, marginTop: 14 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: fonts.mono,
    color: colors.text,
    backgroundColor: colors.white,
  },
  textarea: { height: 100 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  chipSelected: { backgroundColor: colors.dark, borderColor: colors.dark },
  chipText: { fontFamily: fonts.mono, fontSize: 13, color: colors.text },
  chipTextSelected: { color: colors.accent },
  saveButton: { marginTop: 24, backgroundColor: colors.dark, paddingVertical: 14, borderRadius: 4, alignItems: 'center' },
  buttonDisabled: { opacity: 0.6 },
  saveButtonText: { fontFamily: fonts.mono, fontSize: 14, color: colors.accent, letterSpacing: 1 },
  logoutButton: { marginTop: 12, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: colors.error, borderRadius: 4 },
  logoutText: { fontFamily: fonts.mono, fontSize: 14, color: colors.error },
});
