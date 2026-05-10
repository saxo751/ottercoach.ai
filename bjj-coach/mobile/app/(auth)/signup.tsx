import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/stores/auth';
import { colors } from '../../src/theme/colors';
import { fonts } from '../../src/theme/fonts';

const BELT_RANKS = ['White', 'Blue', 'Purple', 'Brown', 'Black'];
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function SignupScreen() {
  const [step, setStep] = useState(1);

  // Step 1
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Step 2
  const [beltRank, setBeltRank] = useState('');
  const [experienceMonths, setExperienceMonths] = useState('');

  // Step 3
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [trainingTime, setTrainingTime] = useState('');

  // Step 4
  const [goals, setGoals] = useState('');

  const { signup, loading } = useAuthStore();
  const router = useRouter();

  function toggleDay(day: string) {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  }

  async function handleSubmit() {
    if (!goals.trim()) {
      Alert.alert('Error', 'Please describe your goals.');
      return;
    }
    try {
      await signup({
        email: email.trim(),
        password,
        name: name.trim(),
        belt_rank: beltRank,
        experience_months: parseInt(experienceMonths, 10) || 0,
        training_days: JSON.stringify(selectedDays),
        goals: goals.trim(),
      });
    } catch (error: any) {
      Alert.alert('Signup Failed', error?.response?.data?.error || 'Something went wrong. Please try again.');
    }
  }

  function handleNext() {
    if (step === 1) {
      if (!name.trim() || !email.trim() || !password.trim()) {
        Alert.alert('Error', 'Please fill in all fields.');
        return;
      }
      if (password.length < 6) {
        Alert.alert('Error', 'Password must be at least 6 characters.');
        return;
      }
    }
    if (step === 2 && !beltRank) {
      Alert.alert('Error', 'Please select your belt rank.');
      return;
    }
    setStep((s) => s + 1);
  }

  const stepTitles = ['', 'step1.profile', 'step2.experience', 'step3.schedule', 'step4.goals'];

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.title}>BJJ Coach</Text>
          <Text style={styles.subtitle}>New account — {step}/4</Text>
        </View>

        <View style={styles.window}>
          <View style={styles.titleBar}>
            <View style={styles.dots}>
              <View style={[styles.dot, { backgroundColor: colors.close }]} />
              <View style={[styles.dot, { backgroundColor: colors.minimize }]} />
              <View style={[styles.dot, { backgroundColor: colors.maximize }]} />
            </View>
            <Text style={styles.windowTitle}>{stepTitles[step]}</Text>
          </View>
          <View style={styles.windowBody}>
            {step === 1 && (
              <>
                <Text style={styles.label}>YOUR NAME</Text>
                <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="John Doe" placeholderTextColor={colors.textMuted} autoCapitalize="words" />

                <Text style={styles.label}>EMAIL</Text>
                <TextInput style={styles.input} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoCorrect={false} placeholder="you@example.com" placeholderTextColor={colors.textMuted} />

                <Text style={styles.label}>PASSWORD</Text>
                <TextInput style={styles.input} value={password} onChangeText={setPassword} secureTextEntry placeholder="min. 6 characters" placeholderTextColor={colors.textMuted} />
              </>
            )}

            {step === 2 && (
              <>
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

                <Text style={styles.label}>MONTHS TRAINING</Text>
                <TextInput style={styles.input} value={experienceMonths} onChangeText={setExperienceMonths} keyboardType="number-pad" placeholder="e.g. 24" placeholderTextColor={colors.textMuted} />
              </>
            )}

            {step === 3 && (
              <>
                <Text style={styles.label}>TRAINING DAYS</Text>
                <View style={styles.chips}>
                  {DAYS.map((day) => (
                    <TouchableOpacity
                      key={day}
                      style={[styles.chip, selectedDays.includes(day) && styles.chipSelected]}
                      onPress={() => toggleDay(day)}
                    >
                      <Text style={[styles.chipText, selectedDays.includes(day) && styles.chipTextSelected]}>{day}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.label}>TYPICAL TRAINING TIME (optional)</Text>
                <TextInput style={styles.input} value={trainingTime} onChangeText={setTrainingTime} placeholder="e.g. 7:00 PM" placeholderTextColor={colors.textMuted} />
              </>
            )}

            {step === 4 && (
              <>
                <Text style={styles.label}>YOUR BJJ GOALS</Text>
                <TextInput
                  style={[styles.input, styles.textarea]}
                  value={goals}
                  onChangeText={setGoals}
                  multiline
                  numberOfLines={5}
                  placeholder="What do you want to achieve with BJJ? What are you working on?"
                  placeholderTextColor={colors.textMuted}
                  textAlignVertical="top"
                />
              </>
            )}

            <View style={styles.buttonRow}>
              {step > 1 && (
                <TouchableOpacity style={styles.backButton} onPress={() => setStep((s) => s - 1)}>
                  <Text style={styles.backText}>← Back</Text>
                </TouchableOpacity>
              )}
              {step < 4 ? (
                <TouchableOpacity style={styles.button} onPress={handleNext}>
                  <Text style={styles.buttonText}>{'> NEXT'}</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={handleSubmit} disabled={loading}>
                  <Text style={styles.buttonText}>{loading ? 'Creating...' : '> CREATE ACCOUNT'}</Text>
                </TouchableOpacity>
              )}
            </View>

            {step === 1 && (
              <TouchableOpacity style={styles.link} onPress={() => router.push('/(auth)/login')}>
                <Text style={styles.linkText}>Have an account? Log in →</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.dark },
  container: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  header: { alignItems: 'center', marginBottom: 24 },
  title: { fontFamily: fonts.heading, fontSize: 22, color: colors.accent, letterSpacing: 2 },
  subtitle: { fontFamily: fonts.mono, fontSize: 11, color: colors.textMuted, marginTop: 4 },
  window: { borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: colors.lightGray },
  titleBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.lightGray, paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  dots: { flexDirection: 'row', gap: 5 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  windowTitle: { fontFamily: fonts.mono, fontSize: 12, color: colors.textMuted },
  windowBody: { backgroundColor: colors.light, padding: 20 },
  label: { fontFamily: fonts.mono, fontSize: 10, color: colors.textMuted, marginBottom: 6, marginTop: 14 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    fontFamily: fonts.mono,
    color: colors.text,
    backgroundColor: colors.white,
  },
  textarea: { height: 120 },
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
  buttonRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 20 },
  button: { backgroundColor: colors.dark, paddingVertical: 12, paddingHorizontal: 20, borderRadius: 4 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { fontFamily: fonts.mono, fontSize: 13, color: colors.accent, letterSpacing: 1 },
  backButton: { paddingVertical: 12, paddingHorizontal: 16 },
  backText: { fontFamily: fonts.mono, fontSize: 13, color: colors.textMuted },
  link: { marginTop: 16, alignItems: 'center' },
  linkText: { fontFamily: fonts.mono, fontSize: 12, color: colors.textMuted },
});
