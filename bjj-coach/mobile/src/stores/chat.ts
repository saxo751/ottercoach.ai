import { create } from 'zustand';
import * as ws from '../services/websocket';
import type { ChatMessage, ChatButton } from '../types';

interface ChatState {
  messages: ChatMessage[];
  buttons: ChatButton[];
  connected: boolean;
  typing: boolean;
  hasMore: boolean;
  loadingMore: boolean;
  connect: () => void;
  disconnect: () => void;
  sendMessage: (text: string) => void;
  sendButton: (data: string) => void;
  loadMore: () => void;
}

export const useChatStore = create<ChatState>((set, get) => {
  ws.setHandlers({
    onHistory: (messages) => set({ messages }),
    onHistoryHasMore: (hasMore) => set({ hasMore }),
    onHistoryPage: (messages, hasMore) => set((s) => ({
      messages: [...messages, ...s.messages],
      hasMore,
      loadingMore: false,
    })),
    onMessage: (msg) => set((s) => ({ messages: [...s.messages, msg], typing: false, buttons: [] })),
    onButtons: (_text, buttons) => set({ buttons }),
    onStatus: (connected) => set({ connected }),
    onAuthError: () => set({ connected: false }),
  });

  return {
    messages: [],
    buttons: [],
    connected: false,
    typing: false,
    hasMore: false,
    loadingMore: false,
    connect: () => ws.connect(),
    disconnect: () => ws.disconnect(),
    sendMessage: (text) => {
      if (text !== '/start') {
        set((s) => ({ messages: [...s.messages, { role: 'user', content: text, created_at: new Date().toISOString() }], typing: true, buttons: [] }));
      } else { set({ typing: true }); }
      ws.send(text);
    },
    sendButton: (data) => {
      set((s) => ({ messages: [...s.messages, { role: 'user', content: data, created_at: new Date().toISOString() }], typing: true, buttons: [] }));
      ws.sendButton(data);
    },
    loadMore: () => {
      const { messages, hasMore, loadingMore } = get();
      if (!hasMore || loadingMore) return;
      const oldest = messages[0];
      if (!oldest?.id) return;
      set({ loadingMore: true });
      ws.loadMore(oldest.id);
    },
  };
});
