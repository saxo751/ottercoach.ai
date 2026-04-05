import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import type { ChatMessage, ChatButton } from '../types';

const WS_URL = Constants.expoConfig?.extra?.WS_URL || 'ws://localhost:3000/ws';

type MessageHandler = (messages: ChatMessage[]) => void;
let ws: WebSocket | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let onHistory: MessageHandler | null = null;
let onMessage: ((msg: ChatMessage) => void) | null = null;
let onButtons: ((text: string, buttons: ChatButton[]) => void) | null = null;
let onStatus: ((connected: boolean) => void) | null = null;
let onAuthError: (() => void) | null = null;
let pendingMessages: string[] = [];

export function setHandlers(handlers: {
  onHistory: MessageHandler;
  onMessage: (msg: ChatMessage) => void;
  onButtons: (text: string, buttons: ChatButton[]) => void;
  onStatus: (connected: boolean) => void;
  onAuthError: () => void;
}) {
  onHistory = handlers.onHistory;
  onMessage = handlers.onMessage;
  onButtons = handlers.onButtons;
  onStatus = handlers.onStatus;
  onAuthError = handlers.onAuthError;
}

export async function connect() {
  if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) return;
  const token = await SecureStore.getItemAsync('bjj_coach_jwt');
  if (!token) return;

  ws = new WebSocket(WS_URL);
  ws.onopen = () => { ws!.send(JSON.stringify({ type: 'auth', token })); };
  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    switch (msg.type) {
      case 'auth_ok':
        onStatus?.(true);
        for (const text of pendingMessages) ws!.send(JSON.stringify({ type: 'message', text }));
        pendingMessages = [];
        break;
      case 'history':
        if (msg.messages?.length > 0) onHistory?.(msg.messages);
        else send('/start');
        break;
      case 'message':
        onMessage?.({ role: 'assistant', content: msg.text, created_at: new Date().toISOString() });
        break;
      case 'buttons':
        onMessage?.({ role: 'assistant', content: msg.text, created_at: new Date().toISOString() });
        onButtons?.(msg.text, msg.buttons);
        break;
      case 'system':
        onMessage?.({ role: 'system', content: msg.text, link: msg.link, created_at: new Date().toISOString() });
        break;
      case 'auth_error':
        onAuthError?.();
        break;
    }
  };
  ws.onclose = () => { onStatus?.(false); scheduleReconnect(); };
  ws.onerror = () => { ws?.close(); };
}

export function send(text: string) {
  if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: 'message', text }));
  else pendingMessages.push(text);
}

export function sendButton(data: string) {
  if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: 'button', data }));
}

export function disconnect() {
  if (reconnectTimer) clearTimeout(reconnectTimer);
  ws?.close();
  ws = null;
}

function scheduleReconnect() {
  if (reconnectTimer) clearTimeout(reconnectTimer);
  reconnectTimer = setTimeout(() => connect(), 3000);
}
