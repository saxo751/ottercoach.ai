import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-verify',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="window-container">
      <div class="retro-window verify-window">
        <div class="retro-window__titlebar">
          <div class="retro-window__controls">
            <a routerLink="/" class="retro-window__dot retro-window__dot--close"></a>
            <span class="retro-window__dot retro-window__dot--minimize"></span>
            <span class="retro-window__dot retro-window__dot--maximize"></span>
          </div>
          <span class="retro-window__title">verify</span>
        </div>

        <div class="retro-window__body verify-body">
          <!-- Loading -->
          <div *ngIf="loading" class="state">
            <div class="spinner"></div>
            <h2 class="state-title">Signing you in...</h2>
            <p class="state-desc">Verifying your magic link.</p>
          </div>

          <!-- Error -->
          <div *ngIf="!loading && errorMsg" class="state">
            <div class="error-icon">!</div>
            <h2 class="state-title">Link expired</h2>
            <p class="state-desc">{{ errorMsg }}</p>
            <a routerLink="/auth/login" class="btn-retry">Send a new link</a>
          </div>
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
    .verify-window {
      width: 100%;
      max-width: 400px;
    }
    .verify-body {
      padding: 40px 24px;
      background: var(--color-surface-muted);
      text-align: center;
    }
    .state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
    }
    .state-title {
      font-family: var(--font-display);
      font-size: var(--text-xl);
      font-weight: 800;
      margin: 0;
    }
    .state-desc {
      font-size: var(--text-sm);
      color: var(--color-text-secondary);
      margin: 0;
    }
    .spinner {
      width: 32px;
      height: 32px;
      border: 3px solid var(--color-window-border);
      border-top-color: var(--color-accent);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin-bottom: 8px;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    .error-icon {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: var(--color-danger);
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      font-weight: 800;
      margin-bottom: 8px;
    }
    .btn-retry {
      display: inline-block;
      margin-top: 12px;
      background: var(--color-accent);
      color: var(--color-accent-text);
      border: 2px solid var(--color-text);
      border-radius: 6px;
      padding: 8px 20px;
      font-family: var(--font-body);
      font-size: var(--text-sm);
      font-weight: 600;
      text-decoration: none;
      transition: background 0.15s;
    }
    .btn-retry:hover {
      background: var(--color-accent-hover);
    }
  `],
})
export class VerifyComponent implements OnInit {
  loading = true;
  errorMsg = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private auth: AuthService,
  ) {}

  ngOnInit(): void {
    const token = this.route.snapshot.queryParams['token'];
    if (!token) {
      this.loading = false;
      this.errorMsg = 'No verification token found.';
      return;
    }

    this.auth.verify(token).subscribe({
      next: () => {
        this.router.navigate(['/chat']);
      },
      error: (err) => {
        this.loading = false;
        this.errorMsg = err.error?.error || 'This link has expired or is invalid.';
      },
    });
  }
}
