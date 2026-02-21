import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { ChatService } from '../../core/services/chat.service';
import { MessageBubbleComponent } from './message-bubble.component';
import type { ChatMessage, Button } from '../../shared/models';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MessageBubbleComponent],
  template: `
    <div class="window-container">
      <div class="retro-window chat-window">
        <!-- Title bar -->
        <div class="retro-window__titlebar">
          <div class="retro-window__controls">
            <a routerLink="/" class="retro-window__dot retro-window__dot--close"></a>
            <span class="retro-window__dot retro-window__dot--minimize"></span>
            <span class="retro-window__dot retro-window__dot--maximize"></span>
          </div>
          <span class="retro-window__title">coach.chat</span>
          <span class="connection-status" [class.online]="connected">
            {{ connected ? 'connected' : 'connecting...' }}
          </span>
        </div>

        <!-- Messages -->
        <div class="retro-window__body messages" #messagesContainer>
          <div class="messages-inner">
            <app-message-bubble
              *ngFor="let msg of messages"
              [message]="msg"
            ></app-message-bubble>

            <div class="typing" *ngIf="typing">
              <span class="dot"></span>
              <span class="dot"></span>
              <span class="dot"></span>
            </div>
          </div>
        </div>

        <!-- Quick reply buttons -->
        <div class="quick-buttons" *ngIf="activeButtons.length > 0">
          <button
            *ngFor="let btn of activeButtons"
            class="quick-btn"
            (click)="onButtonClick(btn)"
          >
            {{ btn.label }}
          </button>
        </div>

        <!-- Input bar -->
        <div class="input-bar">
          <input
            type="text"
            [(ngModel)]="inputText"
            (keydown.enter)="send()"
            placeholder="Message your coach..."
          />
          <button class="send-btn" (click)="send()" [disabled]="!inputText.trim()">
            Send
          </button>
        </div>

        <!-- Status bar -->
        <div class="retro-window__statusbar">
          {{ messages.length }} messages
        </div>
      </div>
    </div>
  `,
  styles: [`
    .window-container {
      display: flex;
      justify-content: center;
      padding: 24px 16px;
      min-height: 100vh;
    }
    .chat-window {
      width: 100%;
      max-width: 680px;
      height: calc(100vh - 48px);
    }
    .messages {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      background: var(--color-surface-muted);
    }
    .messages-inner {
      display: flex;
      flex-direction: column;
    }
    .connection-status {
      font-family: var(--font-mono);
      font-size: var(--text-xs);
      color: var(--color-danger);
      transition: color 0.3s;
    }
    .connection-status.online {
      color: var(--color-success);
    }
    .typing {
      display: flex;
      gap: 4px;
      padding: 10px 14px;
      background: var(--color-desktop);
      border: var(--border-subtle);
      border-radius: 2px 12px 12px 12px;
      width: fit-content;
      margin-bottom: 8px;
    }
    .dot {
      width: 8px;
      height: 8px;
      background: var(--color-text-muted);
      border-radius: 50%;
      animation: bounce 1.4s ease-in-out infinite;
    }
    .dot:nth-child(2) { animation-delay: 0.2s; }
    .dot:nth-child(3) { animation-delay: 0.4s; }
    @keyframes bounce {
      0%, 60%, 100% { transform: translateY(0); }
      30% { transform: translateY(-6px); }
    }
    .quick-buttons {
      display: flex;
      gap: 8px;
      padding: 8px 16px;
      flex-wrap: wrap;
      background: var(--color-surface);
      border-top: var(--border-subtle);
    }
    .quick-btn {
      padding: 6px 14px;
      border: var(--border-subtle);
      background: transparent;
      color: var(--color-text);
      border-radius: 20px;
      cursor: pointer;
      font-family: var(--font-body);
      font-size: var(--text-sm);
      font-weight: 500;
      transition: all 0.15s;
    }
    .quick-btn:hover {
      background: var(--color-accent);
      color: var(--color-accent-text);
      border-color: var(--color-accent);
    }
    .input-bar {
      display: flex;
      gap: 8px;
      padding: 10px 12px;
      background: var(--color-surface);
      border-top: var(--border-subtle);
    }
    input {
      flex: 1;
      padding: 10px 14px;
      border: var(--border-subtle);
      border-radius: 6px;
      font-family: var(--font-body);
      font-size: var(--text-base);
      background: var(--color-surface-muted);
      color: var(--color-text);
      outline: none;
      transition: border-color 0.15s;
    }
    input:focus {
      border-color: var(--color-accent);
    }
    .send-btn {
      padding: 10px 20px;
      background: var(--color-accent);
      color: var(--color-accent-text);
      border: 2px solid var(--color-text);
      border-radius: 6px;
      font-family: var(--font-body);
      font-size: var(--text-sm);
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s;
    }
    .send-btn:disabled {
      opacity: 0.4;
      cursor: default;
    }
    .send-btn:not(:disabled):hover {
      background: var(--color-accent-hover);
    }
  `],
})
export class ChatComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('messagesContainer') messagesContainer!: ElementRef;

  messages: ChatMessage[] = [];
  activeButtons: Button[] = [];
  inputText = '';
  connected = false;
  typing = false;

  private subs: Subscription[] = [];
  private shouldScroll = false;

  constructor(private chatService: ChatService) {}

  ngOnInit(): void {
    this.chatService.connect();

    this.subs.push(
      this.chatService.messages$.subscribe((msgs) => {
        this.messages = msgs;
        this.shouldScroll = true;
      }),
      this.chatService.buttons$.subscribe((bm) => {
        this.activeButtons = bm.buttons;
      }),
      this.chatService.connected$.subscribe((c) => {
        this.connected = c;
      }),
      this.chatService.typing$.subscribe((t) => {
        this.typing = t;
        if (t) this.shouldScroll = true;
      })
    );
  }

  ngAfterViewChecked(): void {
    if (this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

  send(): void {
    const text = this.inputText.trim();
    if (!text) return;
    this.inputText = '';
    this.activeButtons = [];
    this.chatService.sendMessage(text);
  }

  onButtonClick(btn: Button): void {
    this.activeButtons = [];
    this.chatService.sendButton(btn.data);
  }

  private scrollToBottom(): void {
    const el = this.messagesContainer?.nativeElement;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }

  ngOnDestroy(): void {
    this.subs.forEach((s) => s.unsubscribe());
  }
}
