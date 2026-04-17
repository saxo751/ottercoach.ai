import React from 'react';
import { View, Text, Image, StyleSheet, ScrollView } from 'react-native';
import { colors } from '../theme/colors';
import { fonts } from '../theme/fonts';

interface RetroWindowProps {
  title: string;
  statusLeft?: string;
  statusRight?: string;
  otterImage?: any;
  children: React.ReactNode;
  scrollable?: boolean;
}

export function RetroWindow({ title, statusLeft, statusRight, otterImage, children, scrollable = true }: RetroWindowProps) {
  const Content = scrollable ? ScrollView : View;

  return (
    <View style={styles.container}>
      <View style={styles.titleBar}>
        <View style={styles.dots}>
          <View style={[styles.dot, { backgroundColor: colors.close }]} />
          <View style={[styles.dot, { backgroundColor: colors.minimize }]} />
          <View style={[styles.dot, { backgroundColor: colors.maximize }]} />
        </View>
        <Text style={styles.title}>{title}</Text>
        {otterImage && <Image source={otterImage} style={styles.otterImage} resizeMode="contain" />}
      </View>
      <Content style={styles.content} contentContainerStyle={scrollable ? styles.contentContainer : undefined}>
        {children}
      </Content>
      {(statusLeft || statusRight) && (
        <View style={styles.statusBar}>
          <Text style={styles.statusText}>{statusLeft}</Text>
          <Text style={styles.statusText}>{statusRight}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.dark },
  titleBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.lightGray, paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  dots: { flexDirection: 'row', gap: 5 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  title: { fontFamily: fonts.heading, fontSize: 13, fontWeight: '600', color: colors.text, flex: 1 },
  otterImage: { height: 28, width: 28, opacity: 0.7 },
  content: { flex: 1, backgroundColor: colors.light },
  contentContainer: { padding: 16 },
  statusBar: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: colors.lightGray, paddingHorizontal: 12, paddingVertical: 4, borderTopWidth: 1, borderTopColor: colors.border },
  statusText: { fontFamily: fonts.mono, fontSize: 10, color: colors.textMuted },
});
