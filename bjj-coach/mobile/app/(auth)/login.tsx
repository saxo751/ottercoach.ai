import React, { useState } from 'react';
import {
  View,
  Image,
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

        {/* Hero otter */}
        <View style={styles.hero}>
          <Image
            source={require('../../assets/otters/Otter-ready-fight-stance-gi.png')}
            style={styles.otterImage}
            resizeMode="contain"
          />
        </View>

        {/* Branding */}
        <View style={styles.branding}>
          <Text style={styles.appName}>BJJ Pocket Coach</Text>
          <Text style={styles.tagline}>Your personal training companion</Text>
        </View>

        {/* Login window */}
        <View style={styles.window}>
          <View style={styles.titleBar}>
            <View style={styles.dots}>
              <View style={[styles.dot, { backgroundColor: '#d97757' }]} />
              <View style={[styles.dot, { backgroundColor: '#b0aea5' }]} />
              <View style={[styles.dot, { backgroundColor: '#788c5d' }]} />
            </View>
            <Text style={styles.windowTitle}>login</Text>
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
              placeholder="Enter password"
              placeholderTextColor={colors.textMuted}
            />

            <TouchableOpacity
              style={[styles.loginButton, loading && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.9}
            >
              <Text style={styles.loginButtonText}>{loading ? 'Signing in...' : 'Sign In'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Sign up link */}
        <TouchableOpacity style={styles.signupLink} onPress={() => router.push('/(auth)/signup')}>
          <Text style={styles.signupText}>
            Don't have an account? <Text style={styles.signupAccent}>Sign up</Text>
          </Text>
        </TouchableOpacity>

        {/* Footer version */}
        <Text style={styles.version}>coach.chat v1.0.0</Text>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.light,
  },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingVertical: 40,
  },

  // Hero otter
  hero: {
    alignItems: 'center',
    marginBottom: 8,
  },
  otterImage: {
    height: 160,
    width: 160,
  },

  // Branding
  branding: {
    alignItems: 'center',
    marginBottom: 32,
  },
  appName: {
    fontFamily: fonts.heading,
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: 0.5,
  },
  tagline: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.textMuted,
    marginTop: 4,
  },

  // Window chrome
  window: {
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.lightGray,
    shadowColor: '#141413',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
  },
  titleBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.lightGray,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  dots: {
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  windowTitle: {
    fontFamily: fonts.heading,
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  windowBody: {
    backgroundColor: colors.white,
    padding: 24,
  },

  // Form fields
  label: {
    fontFamily: fonts.heading,
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: colors.textMuted,
    marginBottom: 6,
    marginTop: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: fonts.body,
    color: colors.text,
    backgroundColor: colors.surfaceMuted,
  },

  // Primary button — Anthropic Orange
  loginButton: {
    marginTop: 24,
    backgroundColor: colors.accent,
    paddingVertical: 14,
    borderRadius: 6,
    alignItems: 'center',
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    fontFamily: fonts.heading,
    fontSize: 14,
    fontWeight: '600',
    color: colors.textLight,
  },

  // Sign up link
  signupLink: {
    marginTop: 24,
    alignItems: 'center',
  },
  signupText: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textMuted,
  },
  signupAccent: {
    color: colors.accent,
    fontWeight: '600',
  },

  // Footer
  version: {
    fontFamily: fonts.mono,
    fontSize: 11,
    color: colors.midGray,
    textAlign: 'center',
    marginTop: 32,
  },
});
