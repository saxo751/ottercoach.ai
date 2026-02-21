import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="window-container">
      <div class="retro-window login-window">
        <div class="retro-window__titlebar">
          <div class="retro-window__controls">
            <a routerLink="/" class="retro-window__dot retro-window__dot--close"></a>
            <span class="retro-window__dot retro-window__dot--minimize"></span>
            <span class="retro-window__dot retro-window__dot--maximize"></span>
          </div>
          <span class="retro-window__title">login</span>
        </div>

        <div class="retro-window__body login-body">
          <h2 class="title">Welcome back</h2>
          <p class="desc">Sign in with your email and password.</p>

          <div class="field">
            <label class="field-label">Email</label>
            <input type="email" class="field-input" [(ngModel)]="email"
                   placeholder="you@example.com" autocomplete="email" />
          </div>

          <div class="field">
            <label class="field-label">Password</label>
            <input type="password" class="field-input" [(ngModel)]="password"
                   placeholder="Your password" autocomplete="current-password"
                   (keydown.enter)="submit()" />
          </div>

          <p class="error-msg" *ngIf="errorMsg">{{ errorMsg }}</p>

          <button class="btn-submit" (click)="submit()" [disabled]="submitting || !email.includes('@') || !password">
            {{ submitting ? 'Signing in...' : 'Sign in' }}
          </button>

          <p class="signup-link">
            Don't have an account? <a routerLink="/auth/signup">Sign up</a>
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
    .login-window {
      width: 100%;
      max-width: 420px;
    }
    .login-body {
      padding: 28px 24px;
      background: var(--color-surface-muted);
    }
    .title {
      font-family: var(--font-display);
      font-size: var(--text-xl);
      font-weight: 800;
      margin: 0 0 6px;
    }
    .desc {
      font-size: var(--text-sm);
      color: var(--color-text-secondary);
      margin: 0 0 20px;
    }
    .field {
      margin-bottom: 16px;
    }
    .field-label {
      display: block;
      font-family: var(--font-body);
      font-size: var(--text-sm);
      font-weight: 600;
      margin-bottom: 6px;
    }
    .field-input {
      width: 100%;
      padding: 10px 14px;
      border: var(--border-subtle);
      border-radius: 6px;
      font-family: var(--font-body);
      font-size: var(--text-base);
      background: var(--color-surface);
      color: var(--color-text);
      outline: none;
      transition: border-color 0.15s;
    }
    .field-input:focus {
      border-color: var(--color-accent);
    }
    .error-msg {
      color: var(--color-danger);
      font-size: var(--text-sm);
      margin-bottom: 12px;
      padding: 8px 12px;
      background: #fef2f2;
      border-radius: 6px;
      border: 1px solid #fecaca;
    }
    .btn-submit {
      width: 100%;
      background: var(--color-accent);
      color: var(--color-accent-text);
      border: 2px solid var(--color-text);
      border-radius: 6px;
      padding: 10px 20px;
      font-family: var(--font-body);
      font-size: var(--text-base);
      font-weight: 600;
      cursor: pointer;
      transition: background 0.15s;
    }
    .btn-submit:hover:not(:disabled) {
      background: var(--color-accent-hover);
    }
    .btn-submit:disabled {
      opacity: 0.4;
      cursor: default;
    }
    .signup-link {
      text-align: center;
      margin-top: 16px;
      font-size: var(--text-sm);
      color: var(--color-text-muted);
    }
    .signup-link a {
      color: var(--color-accent-hover);
      text-decoration: none;
      font-weight: 600;
    }
    .signup-link a:hover {
      text-decoration: underline;
    }
  `],
})
export class LoginComponent {
  email = '';
  password = '';
  submitting = false;
  errorMsg = '';

  constructor(private auth: AuthService, private router: Router) {}

  submit(): void {
    if (!this.email.includes('@') || !this.password) return;

    this.errorMsg = '';
    this.submitting = true;

    this.auth.login({ email: this.email.trim().toLowerCase(), password: this.password }).subscribe({
      next: () => {
        this.router.navigate(['/chat']);
      },
      error: (err) => {
        this.submitting = false;
        this.errorMsg = err.error?.error || 'Something went wrong. Please try again.';
      },
    });
  }
}
