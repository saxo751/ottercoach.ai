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

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, loading } = useAuthStore();
  const router = useRouter();

  async function handleLogin() {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter your email and password.');
      return;
    }
    try {
      await login(email.trim(), password);
    } catch (error: any) {
      Alert.alert('Login Failed', error?.response?.data?.error || 'Invalid credentials. Please try again.');
    }
  }

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.mascot}>🥋</Text>
          <Text style={styles.title}>BJJ Coach</Text>
          <Text style={styles.subtitle}>coach.chat — v1.0.0</Text>
        </View>

        <View style={styles.window}>
          <View style={styles.titleBar}>
            <View style={styles.dots}>
              <View style={[styles.dot, { backgroundColor: colors.close }]} />
              <View style={[styles.dot, { backgroundColor: colors.minimize }]} />
              <View style={[styles.dot, { backgroundColor: colors.maximize }]} />
            </View>
            <Text style={styles.windowTitle}>login.exe</Text>
          </View>
          <View style={styles.windowBody}>
            <Text style={styles.label}>EMAIL</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoCorrect={false}
              placeholder="you@example.com"
              placeholderTextColor={colors.textMuted}
            />

            <Text style={styles.label}>PASSWORD</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="••••••••"
              placeholderTextColor={colors.textMuted}
            />

            <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={handleLogin} disabled={loading}>
              <Text style={styles.buttonText}>{loading ? 'Authenticating...' : '> LOGIN'}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.link} onPress={() => router.push('/(auth)/signup')}>
              <Text style={styles.linkText}>No account? Sign up →</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.dark },
  container: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  header: { alignItems: 'center', marginBottom: 32 },
  mascot: { fontSize: 48, marginBottom: 8 },
  title: { fontFamily: fonts.mono, fontSize: 24, color: colors.accent, letterSpacing: 2 },
  subtitle: { fontFamily: fonts.mono, fontSize: 11, color: colors.textMuted, marginTop: 4 },
  window: { borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: colors.surface },
  titleBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  dots: { flexDirection: 'row', gap: 5 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  windowTitle: { fontFamily: fonts.mono, fontSize: 12, color: colors.textMuted },
  windowBody: { backgroundColor: colors.parchment, padding: 20 },
  label: { fontFamily: fonts.mono, fontSize: 10, color: colors.textMuted, marginBottom: 4, marginTop: 12 },
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
  button: {
    marginTop: 20,
    backgroundColor: colors.dark,
    paddingVertical: 12,
    borderRadius: 4,
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { fontFamily: fonts.mono, fontSize: 14, color: colors.accent, letterSpacing: 1 },
  link: { marginTop: 16, alignItems: 'center' },
  linkText: { fontFamily: fonts.mono, fontSize: 12, color: colors.textMuted },
});
