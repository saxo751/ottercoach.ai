import { WebSocketServer, WebSocket } from 'ws';
import type { Server } from 'http';
import type Database from 'better-sqlite3';
import type { ChannelAdapter, Button, MessageCallback, ButtonCallback } from './adapter.js';
import { findOrCreateUser } from '../db/queries/channels.js';
import { getRecentMessages, getMessagesBefore } from '../db/queries/conversations.js';
import { verifyToken } from '../utils/jwt.js';
import { getUserById } from '../db/queries/users.js';

interface WsClient {
  ws: WebSocket;
  userId: string | null;   // internal user ID (set after auth)
  sessionId: string;        // browser session ID (= platformUserId)
}

export class WebAdapter implements ChannelAdapter {
  private wss!: WebSocketServer;
  private clients = new Map<string, WsClient>();  // sessionId -> client
  private messageCallbacks: MessageCallback[] = [];
  private buttonCallbacks: ButtonCallback[] = [];
  private db: Database.Database;

  constructor(private httpServer: Server, db: Database.Database) {
    this.db = db;
  }

  onMessage(callback: MessageCallback): void {
    this.messageCallbacks.push(callback);
  }

  onButtonPress(callback: ButtonCallback): void {
    this.buttonCallbacks.push(callback);
  }

  async sendMessage(sessionId: string, text: string): Promise<void> {
    console.log(`[web] sendMessage to ${sessionId}: "${text.substring(0, 80)}..."`);
    const client = this.clients.get(sessionId);
    if (!client || client.ws.readyState !== WebSocket.OPEN) {
      console.log(`[web] ❌ Client not found or not open. clients=${this.clients.size}, readyState=${client?.ws.readyState}`);
      return;
    }
    client.ws.send(JSON.stringify({ type: 'message', text }));
    console.log(`[web] ✓ Message sent`);
  }

  async sendSystemMessage(sessionId: string, text: string, link?: string): Promise<void> {
    const client = this.clients.get(sessionId);
    if (!client || client.ws.readyState !== WebSocket.OPEN) return;
    client.ws.send(JSON.stringify({ type: 'system', text, link }));
  }

  async sendButtons(sessionId: string, text: string, buttons: Button[]): Promise<void> {
    console.log(`[web] sendButtons to ${sessionId}: "${text.substring(0, 80)}..."`);
    const client = this.clients.get(sessionId);
    if (!client || client.ws.readyState !== WebSocket.OPEN) return;
    client.ws.send(JSON.stringify({ type: 'buttons', text, buttons }));
  }

  /** Check if a user has an active, open WebSocket connection. */
  isClientConnected(sessionId: string): boolean {
    const client = this.clients.get(sessionId);
    return !!client && client.ws.readyState === WebSocket.OPEN;
  }

  async start(): Promise<void> {
    this.wss = new WebSocketServer({ server: this.httpServer, path: '/ws' });

    this.wss.on('connection', (ws, req) => {
      console.log(`[web] 🔌 New WebSocket connection from ${req.socket.remoteAddress}`);
      let client: WsClient | null = null;

      ws.on('message', (raw) => {
        const rawStr = raw.toString();
        console.log(`[web] 📩 Received: ${rawStr.substring(0, 200)}`);

        let msg: any;
        try {
          msg = JSON.parse(rawStr);
        } catch (e) {
          console.log(`[web] ❌ Failed to parse JSON`);
          return;
        }

        if (msg.type === 'auth') {
          let userId: string;
          let sessionKey: string;

          if (msg.token) {
            // JWT-based auth (new web signup flow)
            console.log(`[web] 🔑 JWT auth request`);
            const payload = verifyToken(msg.token);
            if (!payload) {
              ws.send(JSON.stringify({ type: 'auth_error', message: 'Invalid or expired token' }));
              ws.close();
              return;
            }
            const user = getUserById(this.db, payload.userId);
            if (!user) {
              ws.send(JSON.stringify({ type: 'auth_error', message: 'User not found' }));
              ws.close();
              return;
            }
            userId = user.id;
            sessionKey = user.id;
            console.log(`[web] User: ${user.id} (jwt, mode=${user.conversation_mode})`);
          } else if (msg.sessionId) {
            // Legacy session-based auth
            console.log(`[web] 🔑 Legacy auth request for session: ${msg.sessionId}`);
            const { user, isNew } = findOrCreateUser(this.db, 'web', msg.sessionId);
            userId = user.id;
            sessionKey = msg.sessionId;
            console.log(`[web] User: ${user.id} (new=${isNew}, mode=${user.conversation_mode})`);
          } else {
            ws.send(JSON.stringify({ type: 'error', message: 'Invalid auth message' }));
            return;
          }

          client = { ws, userId, sessionId: sessionKey };

          const prev = this.clients.get(sessionKey);
          if (prev && prev.ws !== ws && prev.ws.readyState === WebSocket.OPEN) {
            prev.ws.close();
          }
          this.clients.set(sessionKey, client);

          ws.send(JSON.stringify({ type: 'auth_ok' }));

          const PAGE_SIZE = 30;
          const history = getRecentMessages(this.db, userId, PAGE_SIZE + 1);
          const hasMore = history.length > PAGE_SIZE;
          const page = hasMore ? history.slice(1) : history; // drop oldest if there's more
          console.log(`[web] Sending ${page.length} history messages (hasMore=${hasMore})`);
          ws.send(JSON.stringify({
            type: 'history',
            hasMore,
            messages: page.map((m) => ({
              id: m.id,
              role: m.role,
              content: m.content,
              created_at: m.created_at,
            })),
          }));
          return;
        }

        if (!client) {
          console.log(`[web] ❌ Message before auth`);
          ws.send(JSON.stringify({ type: 'error', message: 'Not authenticated. Send auth first.' }));
          return;
        }

        if (msg.type === 'message' && typeof msg.text === 'string') {
          console.log(`[web] 💬 Message from ${client.sessionId}: "${msg.text}"`);
          console.log(`[web] Firing ${this.messageCallbacks.length} message callbacks`);
          for (const cb of this.messageCallbacks) {
            cb(client.sessionId, msg.text, 'web');
          }
        }

        if (msg.type === 'button' && typeof msg.data === 'string') {
          console.log(`[web] 🔘 Button from ${client.sessionId}: "${msg.data}"`);
          for (const cb of this.buttonCallbacks) {
            cb(client.sessionId, msg.data, 'web');
          }
          for (const cb of this.messageCallbacks) {
            cb(client.sessionId, msg.data, 'web');
          }
        }

        if (msg.type === 'load_more' && typeof msg.beforeId === 'number' && client.userId) {
          const PAGE_SIZE = 30;
          const older = getMessagesBefore(this.db, client.userId, msg.beforeId, PAGE_SIZE + 1);
          const hasMore = older.length > PAGE_SIZE;
          const page = hasMore ? older.slice(1) : older;
          ws.send(JSON.stringify({
            type: 'history_page',
            hasMore,
            messages: page.map((m) => ({
              id: m.id,
              role: m.role,
              content: m.content,
              created_at: m.created_at,
            })),
          }));
        }
      });

      ws.on('close', (code, reason) => {
        console.log(`[web] 🔌 Connection closed (code=${code}, reason=${reason.toString()})`);
        if (client) {
          const current = this.clients.get(client.sessionId);
          if (current && current.ws === ws) {
            this.clients.delete(client.sessionId);
          }
        }
      });

      ws.on('error', (err) => {
        console.error(`[web] ❌ WebSocket error:`, err.message);
      });
    });

    this.wss.on('error', (err) => {
      console.error(`[web] ❌ WebSocketServer error:`, err.message);
    });

    console.log('[web] WebSocket adapter started on /ws');
  }

  async stop(): Promise<void> {
    for (const client of this.clients.values()) {
      client.ws.close();
    }
    this.clients.clear();
    this.wss?.close();
  }
}
