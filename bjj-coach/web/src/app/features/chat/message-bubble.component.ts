import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import type { ChatMessage } from '../../shared/models';

@Component({
  selector: 'app-message-bubble',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div
      class="bubble-row"
      [class.bubble-row--user]="message.role === 'user'"
      [class.bubble-row--coach]="message.role === 'assistant'"
    >
      <div
        class="bubble"
        [class.user]="message.role === 'user'"
        [class.coach]="message.role === 'assistant'"
        [class.system]="message.role === 'system'"
      >
        <div class="label" *ngIf="message.role === 'assistant'">
          <img
            src="assets/otters/Otter-relaxed-with-arms-crossed-no-belt.svg"
            alt=""
            class="coach-avatar"
          />
          Coach
        </div>
        <ng-container *ngIf="message.role === 'system' && message.link; else plainText">
          <a class="system-link" [routerLink]="message.link">{{ message.content }}</a>
        </ng-container>
        <ng-template #plainText>
          <div class="text" [innerHTML]="linkify(message.content)"></div>
        </ng-template>
      </div>
    </div>
  `,
  styles: [`
    .bubble-row {
      display: flex;
      margin-bottom: 8px;
    }
    .bubble-row--user {
      justify-content: flex-end;
    }
    .bubble-row--coach {
      justify-content: flex-start;
    }
    .coach-avatar {
      width: 50px;
      height: 50px;
      transform: scaleX(-1);
      vertical-align: middle;
      margin-right: 4px;
    }
    .bubble {
      max-width: 80%;
      padding: 10px 14px;
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
      font-size: var(--text-base);
      font-weight: 700;
      color: var(--color-text-muted);
      margin-bottom: 4px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      display: flex;
      align-items: center;
    }
    .system {
      max-width: 100%;
      background: none;
      border: none;
      padding: 4px 0;
      margin: 4px auto 8px;
      text-align: center;
      font-size: var(--text-xs);
      color: var(--color-text-muted);
      font-style: italic;
    }
    .system-link {
      color: var(--color-accent);
      text-decoration: none;
      cursor: pointer;
    }
    .system-link:hover {
      text-decoration: underline;
    }
    :host ::ng-deep .msg-link {
      color: var(--color-accent);
      text-decoration: underline;
      word-break: break-all;
    }
    :host .user ::ng-deep .msg-link {
      color: var(--color-accent-text);
    }
  `],
})
export class MessageBubbleComponent {
  @Input() message!: ChatMessage;

  linkify(text: string): string {
    const escaped = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    return escaped.replace(
      /https?:\/\/[^\s<]+/g,
      (url) => `<a href="${url}" target="_blank" rel="noopener noreferrer" class="msg-link">${url}</a>`
    );
  }
}
