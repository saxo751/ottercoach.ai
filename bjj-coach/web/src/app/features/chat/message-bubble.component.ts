import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import type { ChatMessage } from '../../shared/models';

@Component({
  selector: 'app-message-bubble',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bubble" [class.user]="message.role === 'user'" [class.coach]="message.role === 'assistant'">
      <div class="label" *ngIf="message.role === 'assistant'">Coach</div>
      <div class="text">{{ message.content }}</div>
    </div>
  `,
  styles: [`
    .bubble {
      max-width: 80%;
      padding: 10px 14px;
      margin-bottom: 8px;
      line-height: 1.45;
      word-wrap: break-word;
      white-space: pre-wrap;
      font-family: var(--font-body);
      font-size: var(--text-base);
    }
    .user {
      background: var(--color-accent);
      color: var(--color-accent-text);
      margin-left: auto;
      border-radius: 12px 2px 12px 12px;
    }
    .coach {
      background: var(--color-desktop);
      border: var(--border-subtle);
      color: var(--color-text);
      margin-right: auto;
      border-radius: 2px 12px 12px 12px;
    }
    .label {
      font-size: var(--text-xs);
      font-weight: 600;
      color: var(--color-text-muted);
      margin-bottom: 2px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
  `],
})
export class MessageBubbleComponent {
  @Input() message!: ChatMessage;
}
