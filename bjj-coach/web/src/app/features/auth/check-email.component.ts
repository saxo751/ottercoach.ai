import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-check-email',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="window-container">
      <div class="retro-window check-window">
        <div class="retro-window__titlebar">
          <div class="retro-window__controls">
            <a routerLink="/" class="retro-window__dot retro-window__dot--close"></a>
            <span class="retro-window__dot retro-window__dot--minimize"></span>
            <span class="retro-window__dot retro-window__dot--maximize"></span>
          </div>
          <span class="retro-window__title">check-email</span>
        </div>

        <div class="retro-window__body check-body">
          <!-- Envelope icon -->
          <div class="icon">
            <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="6" y="16" width="52" height="36" rx="4" fill="#e8e2d6" stroke="#1a1a1a" stroke-width="2"/>
              <path d="M6 20 L32 38 L58 20" stroke="#1a1a1a" stroke-width="2" fill="none" stroke-linejoin="round"/>
              <circle cx="32" cy="30" r="6" fill="#f5a623" stroke="#1a1a1a" stroke-width="1.5"/>
              <path d="M30 30 L31.5 31.5 L34 28.5" stroke="#1a1a1a" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>

          <h2 class="title">Check your email</h2>
          <p class="desc">
            We sent a magic link to
            <strong *ngIf="email">{{ email }}</strong><span *ngIf="!email">your email</span>.
            Click the link to sign in.
          </p>
          <p class="hint">The link expires in 15 minutes.</p>

          <div class="actions">
            <button class="btn-resend" (click)="resend()" [disabled]="resending">
              {{ resending ? 'Sending...' : 'Resend link' }}
            </button>
            <span class="resent-msg" *ngIf="resent">Sent!</span>
          </div>

          <p class="alt-link">
            Wrong email? <a routerLink="/auth/signup">Start over</a>
          </p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .window-container {
      display: flex;
      justify-content: center;
      align-items: flex-start;
      padding: 24px 16px;
      min-height: calc(100vh - 52px);
    }
    .check-window {
      width: 100%;
      max-width: 420px;
    }
    .check-body {
      padding: 32px 24px;
      background: var(--color-surface-muted);
      text-align: center;
    }
    .icon {
      width: 64px;
      height: 64px;
      margin: 0 auto 16px;
    }
    .icon svg {
      width: 100%;
      height: 100%;
    }
    .title {
      font-family: var(--font-display);
      font-size: var(--text-xl);
      font-weight: 800;
      margin: 0 0 8px;
    }
    .desc {
      font-size: var(--text-base);
      color: var(--color-text-secondary);
      margin: 0 0 4px;
    }
    .hint {
      font-size: var(--text-xs);
      color: var(--color-text-muted);
      margin: 0 0 20px;
    }
    .actions {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      margin-bottom: 16px;
    }
    .btn-resend {
      background: transparent;
      border: var(--border-subtle);
      border-radius: 6px;
      padding: 8px 16px;
      font-family: var(--font-body);
      font-size: var(--text-sm);
      font-weight: 500;
      color: var(--color-text-secondary);
      cursor: pointer;
      transition: all 0.15s;
    }
    .btn-resend:hover:not(:disabled) {
      border-color: var(--color-accent);
      color: var(--color-text);
    }
    .btn-resend:disabled {
      opacity: 0.5;
      cursor: default;
    }
    .resent-msg {
      font-size: var(--text-sm);
      color: var(--color-success);
      font-weight: 600;
    }
    .alt-link {
      font-size: var(--text-sm);
      color: var(--color-text-muted);
    }
    .alt-link a {
      color: var(--color-accent-hover);
      text-decoration: none;
      font-weight: 600;
    }
    .alt-link a:hover {
      text-decoration: underline;
    }
  `],
})
export class CheckEmailComponent implements OnInit {
  email = '';
  resending = false;
  resent = false;

  constructor(private route: ActivatedRoute, private auth: AuthService) {}

  ngOnInit(): void {
    this.email = this.route.snapshot.queryParams['email'] || '';
  }

  resend(): void {
    if (!this.email) return;
    this.resending = true;
    this.resent = false;

    this.auth.login(this.email).subscribe({
      next: () => {
        this.resending = false;
        this.resent = true;
      },
      error: () => {
        this.resending = false;
      },
    });
  }
}
