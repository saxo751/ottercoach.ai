import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from 'react-native';
import { useChatStore } from '../../src/stores/chat';
import { MessageBubble } from '../../src/components/MessageBubble';
import { QuickButtons } from '../../src/components/QuickButtons';
import { Icon } from '../../src/components/icon';
import { colors } from '../../src/theme/colors';
import { fonts } from '../../src/theme/fonts';

function TypingIndicator() {
  return (
    <View style={styles.typingContainer}>
      <View style={styles.typingBubble}>
        <Text style={styles.typingText}>Coach is typing...</Text>
      </View>
    </View>
  );
}

export default function ChatScreen() {
  const { messages, buttons, connected, typing, connect, disconnect, sendMessage, sendButton } = useChatStore();
  const [inputText, setInputText] = useState('');
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    connect();
    return () => { disconnect(); };
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages]);

  function handleSend() {
    const text = inputText.trim();
    if (!text) return;
    setInputText('');
    sendMessage(text);
  }

  const statusDotColor = connected ? colors.maximize : colors.error;

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.titleBar}>
        <View style={styles.dots}>
          <View style={[styles.dot, { backgroundColor: colors.close }]} />
          <View style={[styles.dot, { backgroundColor: colors.minimize }]} />
          <View style={[styles.dot, { backgroundColor: colors.maximize }]} />
        </View>
        <Text style={styles.windowTitle}>coach.chat</Text>
        <View style={styles.statusDot}>
          <View style={[styles.connectionDot, { backgroundColor: statusDotColor }]} />
          <Text style={styles.statusText}>{connected ? 'connected' : 'offline'}</Text>
        </View>
      </View>

      <KeyboardAvoidingView style={styles.body} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={0}>
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(_, i) => String(i)}
          renderItem={({ item }) => <MessageBubble message={item} />}
          contentContainerStyle={styles.messageList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
        />

        {typing && <TypingIndicator />}

        <QuickButtons buttons={buttons} onPress={sendButton} />

        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Message your coach..."
            placeholderTextColor={colors.textMuted}
            onSubmitEditing={handleSend}
            returnKeyType="send"
            multiline
          />
          <TouchableOpacity style={[styles.sendButton, !inputText.trim() && styles.sendDisabled]} onPress={handleSend} disabled={!inputText.trim()}>
            <Icon name="sent" size={20} color={colors.accent} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <View style={styles.statusBar}>
        <Text style={styles.statusBarText}>{messages.length} messages</Text>
        <Text style={styles.statusBarText}>{typing ? 'coach typing...' : 'ready'}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.dark },
  titleBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.lightGray, paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  dots: { flexDirection: 'row', gap: 5 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  windowTitle: { fontFamily: fonts.mono, fontSize: 13, color: colors.textMuted, flex: 1 },
  statusDot: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  connectionDot: { width: 7, height: 7, borderRadius: 4 },
  statusText: { fontFamily: fonts.mono, fontSize: 10, color: colors.textMuted },
  body: { flex: 1, backgroundColor: colors.light },
  messageList: { padding: 16, paddingBottom: 8 },
  typingContainer: { paddingHorizontal: 16, paddingBottom: 4 },
  typingBubble: { backgroundColor: colors.surface, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 14, borderBottomLeftRadius: 4, alignSelf: 'flex-start' },
  typingText: { fontFamily: fonts.mono, fontSize: 12, color: colors.textMuted, fontStyle: 'italic' },
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 12, paddingVertical: 8, backgroundColor: colors.light, borderTopWidth: 1, borderTopColor: colors.border, gap: 8 },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.text,
    backgroundColor: colors.white,
    maxHeight: 100,
  },
  sendButton: { backgroundColor: colors.dark, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20 },
  sendDisabled: { opacity: 0.4 },
  sendText: { fontFamily: fonts.mono, fontSize: 13, color: colors.accent },
  statusBar: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: colors.dark, paddingHorizontal: 12, paddingVertical: 4 },
  statusBarText: { fontFamily: fonts.mono, fontSize: 10, color: colors.textMuted },
});
