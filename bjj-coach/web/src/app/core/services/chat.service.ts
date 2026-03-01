import { Injectable, NgZone, OnDestroy } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';
import type { ChatMessage, Button } from '../../shared/models';

export interface ButtonMessage {
  text: string;
  buttons: Button[];
}

@Injectable({ providedIn: 'root' })
export class ChatService implements OnDestroy {
  private ws: WebSocket | null = null;
  private reconnectTimer: any = null;
  private pendingMessages: string[] = [];

  messages$ = new BehaviorSubject<ChatMessage[]>([]);
  buttons$ = new Subject<ButtonMessage>();
  connected$ = new BehaviorSubject<boolean>(false);
  typing$ = new BehaviorSubject<boolean>(false);

  constructor(private auth: AuthService, private zone: NgZone) {}

  connect(): void {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      console.log('[chat] Already connected/connecting, skipping');
      return;
    }

    const token = this.auth.getToken();
    if (!token) {
      console.log('[chat] No auth token — cannot connect');
      return;
    }

    const url = environment.wsUrl;
    console.log(`[chat] Connecting to WebSocket: ${url}`);

    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      console.log('[chat] WebSocket OPEN — sending JWT auth');
      this.ws!.send(JSON.stringify({ type: 'auth', token }));
    };

    this.ws.onmessage = (event) => {
      console.log(`[chat] Received:`, event.data);
      this.zone.run(() => {
        const msg = JSON.parse(event.data);

        switch (msg.type) {
          case 'auth_ok':
            console.log('[chat] Auth OK — connected!');
            this.connected$.next(true);
            if (this.pendingMessages.length > 0) {
              console.log(`[chat] Flushing ${this.pendingMessages.length} pending messages`);
              for (const text of this.pendingMessages) {
                this.ws!.send(JSON.stringify({ type: 'message', text }));
              }
              this.pendingMessages = [];
            }
            break;

          case 'history':
            console.log(`[chat] History received: ${msg.messages?.length || 0} messages`);
            if (msg.messages && msg.messages.length > 0) {
              this.messages$.next(msg.messages.map((m: any) =>
                m.role === 'system' ? { ...m, link: this.deriveSystemLink(m.content) } : m
              ));
            } else {
              // New user with no history — trigger onboarding
              console.log('[chat] No history — sending /start');
              this.doSend('/start', false);
            }
            break;

          case 'message': {
            console.log(`[chat] Coach message: "${msg.text?.substring(0, 100)}"`);
            this.typing$.next(false);
            const current = this.messages$.value;
            this.messages$.next([...current, {
              role: 'assistant',
              content: msg.text,
              created_at: new Date().toISOString(),
            }]);
            break;
          }

          case 'buttons': {
            console.log(`[chat] Buttons message: "${msg.text?.substring(0, 100)}" with ${msg.buttons?.length} buttons`);
            this.typing$.next(false);
            const msgs = this.messages$.value;
            this.messages$.next([...msgs, {
              role: 'assistant',
              content: msg.text,
              created_at: new Date().toISOString(),
            }]);
            this.buttons$.next({ text: msg.text, buttons: msg.buttons });
            break;
          }

          case 'system': {
            console.log(`[chat] System message: "${msg.text}"`);
            const sysMsgs = this.messages$.value;
            this.messages$.next([...sysMsgs, {
              role: 'system',
              content: msg.text,
              link: msg.link,
              created_at: new Date().toISOString(),
            }]);
            break;
          }

          case 'auth_error':
            console.error('[chat] Auth error:', msg.message);
            this.auth.logout();
            break;

          case 'error':
            console.error('[chat] Server error:', msg.message);
            break;

          default:
            console.log('[chat] Unknown message type:', msg.type);
        }
      });
    };

    this.ws.onclose = (event) => {
      console.log(`[chat] WebSocket CLOSED (code=${event.code}, reason="${event.reason}", clean=${event.wasClean})`);
      this.zone.run(() => {
        this.connected$.next(false);
        this.scheduleReconnect();
      });
    };

    this.ws.onerror = (event) => {
      console.error('[chat] WebSocket ERROR:', event);
      this.ws?.close();
    };
  }

  sendMessage(text: string): void {
    console.log(`[chat] sendMessage: "${text}"`);
    if (text !== '/start') {
      const current = this.messages$.value;
      this.messages$.next([...current, {
        role: 'user',
        content: text,
        created_at: new Date().toISOString(),
      }]);
    }
    this.typing$.next(true);
    this.doSend(text, true);
  }

  sendButton(data: string): void {
    console.log(`[chat] sendButton: "${data}"`);
    const current = this.messages$.value;
    this.messages$.next([...current, {
      role: 'user',
      content: data,
      created_at: new Date().toISOString(),
    }]);
    this.typing$.next(true);

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'button', data }));
    }
  }

  disconnect(): void {
    clearTimeout(this.reconnectTimer);
    this.ws?.close();
    this.ws = null;
  }

  private doSend(text: string, queue: boolean): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.log(`[chat] Sending via WS: "${text}"`);
      this.ws.send(JSON.stringify({ type: 'message', text }));
    } else {
      console.log(`[chat] WS not open (readyState=${this.ws?.readyState}), queue=${queue}`);
      if (queue) {
        this.pendingMessages.push(text);
      }
    }
  }

  private deriveSystemLink(content: string): string | undefined {
    if (content.startsWith('Session logged')) return '/dashboard';
    if (content.startsWith('Profile updated')) return '/profile';
    if (content.startsWith('Onboarding complete')) return '/dashboard';
    if (content.startsWith('Check-in noted')) return '/dashboard';
    return undefined;
  }

  private scheduleReconnect(): void {
    console.log('[chat] Scheduling reconnect in 3s...');
    clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => this.connect(), 3000);
  }

  ngOnDestroy(): void {
    this.disconnect();
  }
}
