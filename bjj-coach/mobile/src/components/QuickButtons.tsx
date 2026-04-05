import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import type { ChatButton } from '../types';

export function QuickButtons({ buttons, onPress }: { buttons: ChatButton[]; onPress: (data: string) => void }) {
  if (buttons.length === 0) return null;
  return (
    <View style={styles.container}>
      {buttons.map((btn) => (
        <TouchableOpacity key={btn.data} style={styles.button} onPress={() => onPress(btn.data)}>
          <Text style={styles.text}>{btn.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingHorizontal: 12, paddingBottom: 8 },
  button: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: colors.accent },
  text: { fontSize: 13, color: colors.accent },
});
