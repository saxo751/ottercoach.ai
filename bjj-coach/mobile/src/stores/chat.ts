import { create } from 'zustand';
import * as ws from '../services/websocket';
import type { ChatMessage, ChatButton } from '../types';

interface ChatState {
  messages: ChatMessage[];
  buttons: ChatButton[];
  connected: boolean;
  typing: boolean;
  connect: () => void;
  disconnect: () => void;
  sendMessage: (text: string) => void;
  sendButton: (data: string) => void;
}

export const useChatStore = create<ChatState>((set) => {
  ws.setHandlers({
    onHistory: (messages) => set({ messages }),
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
  };
});
