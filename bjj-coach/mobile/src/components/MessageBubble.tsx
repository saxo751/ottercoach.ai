import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import type { ChatMessage } from '../types';

export function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  if (isSystem) {
    return <View style={styles.systemContainer}><Text style={styles.systemText}>{message.content}</Text></View>;
  }

  return (
    <View style={[styles.container, isUser ? styles.userContainer : styles.coachContainer]}>
      <View style={[styles.bubble, isUser ? styles.userBubble : styles.coachBubble]}>
        <Text style={[styles.text, isUser ? styles.userText : styles.coachText]}>{message.content}</Text>
      </View>
      {message.created_at && (
        <Text style={[styles.time, isUser && styles.timeRight]}>
          {isUser ? '' : 'Coach - '}{new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 12 },
  userContainer: { alignItems: 'flex-end' },
  coachContainer: { alignItems: 'flex-start' },
  bubble: { maxWidth: '80%', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14 },
  coachBubble: { backgroundColor: colors.surface, borderBottomLeftRadius: 4 },
  userBubble: { backgroundColor: colors.accent, borderBottomRightRadius: 4 },
  text: { fontSize: 15, lineHeight: 20 },
  coachText: { color: colors.textLight },
  userText: { color: colors.dark },
  time: { fontSize: 10, color: colors.textMuted, marginTop: 2 },
  timeRight: { textAlign: 'right' },
  systemContainer: { alignItems: 'center', marginVertical: 8 },
  systemText: { fontSize: 12, color: colors.textMuted, fontStyle: 'italic' },
});
