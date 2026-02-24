import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService, type SignupData } from '../../core/services/auth.service';
import { environment } from '../../../environments/environment';

const BELT_OPTIONS = [
  { value: 'white', label: 'White', color: '#f0ece4', textColor: '#1a1a1a', border: true },
  { value: 'blue', label: 'Blue', color: '#3b82f6', textColor: '#fff', border: false },
  { value: 'purple', label: 'Purple', color: '#8b5cf6', textColor: '#fff', border: false },
  { value: 'brown', label: 'Brown', color: '#92400e', textColor: '#fff', border: false },
  { value: 'black', label: 'Black', color: '#1a1a1a', textColor: '#fff', border: false },
  { value: 'nogi', label: 'No-gi', color: '#2d3748', textColor: '#fff', border: false },
];

const EXPERIENCE_OPTIONS = [
  { value: 3, label: '< 6 months' },
  { value: 9, label: '6–12 months' },
  { value: 18, label: '1–2 years' },
  { value: 36, label: '2–5 years' },
  { value: 72, label: '5+ years' },
];

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="window-container">
      <div class="retro-window signup-window">
        <!-- Title bar -->
        <div class="retro-window__titlebar">
          <div class="retro-window__controls">
            <a routerLink="/" class="retro-window__dot retro-window__dot--close"></a>
            <span class="retro-window__dot retro-window__dot--minimize"></span>
            <span class="retro-window__dot retro-window__dot--maximize"></span>
          </div>
          <span class="retro-window__title">signup.wizard</span>
        </div>

        <div class="retro-window__body signup-body">
          <!-- Step indicator -->
          <div class="steps">
            <div class="step" *ngFor="let s of [1,2,3,4]; let i = index"
                 [class.step--active]="step === s"
                 [class.step--done]="step > s">
              <div class="step__circle">{{ step > s ? '✓' : s }}</div>
              <div class="step__label">{{ stepLabels[i] }}</div>
            </div>
            <div class="step__line"></div>
          </div>

          <!-- Step 1: Name + Email -->
          <div class="step-content" *ngIf="step === 1">
            <h2 class="step-title">Let's get you started</h2>
            <p class="step-desc">We just need a few basics to set up your coaching experience.</p>

            <div class="field">
              <label class="field-label">What should we call you?</label>
              <input type="text" class="field-input" [(ngModel)]="name" placeholder="Your name" autocomplete="name" />
            </div>

            <div class="field">
              <label class="field-label">Email</label>
              <input type="email" class="field-input" [(ngModel)]="email" placeholder="you@example.com" autocomplete="email" />
            </div>

            <div class="field">
              <label class="field-label">Password</label>
              <input type="password" class="field-input" [(ngModel)]="password" placeholder="At least 6 characters" autocomplete="new-password" />
            </div>
          </div>

          <!-- Step 2: Belt + Experience -->
          <div class="step-content" *ngIf="step === 2">
            <h2 class="step-title">Your BJJ background</h2>
            <p class="step-desc">This helps your coach tailor advice to your level.</p>

            <div class="field">
              <label class="field-label">Belt rank</label>
              <div class="chip-group">
                <button *ngFor="let b of beltOptions"
                        class="chip belt-chip"
                        [class.chip--selected]="beltRank === b.value"
                        [style.background]="beltRank === b.value ? b.color : 'transparent'"
                        [style.color]="beltRank === b.value ? b.textColor : 'var(--color-text-secondary)'"
                        [style.border-color]="beltRank === b.value ? b.color : ''"
                        (click)="beltRank = b.value">
                  {{ b.label }}
                </button>
              </div>
            </div>

            <div class="field">
              <label class="field-label">How long have you been training?</label>
              <div class="chip-group">
                <button *ngFor="let e of experienceOptions"
                        class="chip"
                        [class.chip--selected]="experienceMonths === e.value"
                        (click)="experienceMonths = e.value">
                  {{ e.label }}
                </button>
              </div>
            </div>
          </div>

          <!-- Step 3: Schedule + Goals -->
          <div class="step-content" *ngIf="step === 3">
            <h2 class="step-title">Training schedule & goals</h2>
            <p class="step-desc">When do you train? What are you working toward?</p>

            <div class="field">
              <label class="field-label">Training days</label>
              <div class="chip-group">
                <button *ngFor="let day of days; let i = index"
                        class="chip day-chip"
                        [class.chip--selected]="daySchedule[day]"
                        (click)="toggleDay(day)">
                  {{ dayLabels[i] }}
                </button>
              </div>
            </div>

            <div class="schedule-list" *ngIf="selectedDaysList.length > 0">
              <div class="schedule-row" *ngFor="let entry of selectedDaysList; trackBy: trackByDay">
                <span class="schedule-day">{{ entry.label }}</span>
                <input type="time" class="field-input time-input"
                       [ngModel]="daySchedule[entry.day]"
                       (ngModelChange)="daySchedule[entry.day] = $event" />
              </div>
            </div>

            <div class="field">
              <label class="field-label">What do you want to work on?</label>
              <textarea class="field-input field-textarea" [(ngModel)]="goals"
                        placeholder="e.g., Improve my guard retention, work on submissions from mount..."
                        rows="3"></textarea>
            </div>
          </div>

          <!-- Step 4: Telegram (optional) -->
          <div class="step-content" *ngIf="step === 4">
            <h2 class="step-title">Connect Telegram</h2>
            <p class="step-desc">Get coaching messages right in Telegram. This is optional — you can set it up later from your profile.</p>

            <div class="botfather-guide">
              <p class="guide-title">Quick setup:</p>
              <ol class="guide-steps">
                <li>Open Telegram and search for <strong>&#64;BotFather</strong></li>
                <li>Send <code>/newbot</code> and follow the prompts</li>
                <li>Copy the API token BotFather gives you</li>
                <li>Paste it below</li>
              </ol>
            </div>

            <div class="field">
              <label class="field-label">Bot token</label>
              <div class="token-input-row">
                <input type="text" class="field-input" [(ngModel)]="telegramToken"
                       placeholder="123456:ABC-DEF..." autocomplete="off" />
                <button class="btn-validate" (click)="validateTelegram()" [disabled]="!telegramToken.trim() || validatingToken">
                  {{ validatingToken ? 'Checking...' : 'Validate' }}
                </button>
              </div>
              <p class="field-hint telegram-success" *ngIf="telegramValid">Bot verified: &#64;{{ telegramBotUsername }}</p>
              <p class="field-hint telegram-error" *ngIf="telegramError">{{ telegramError }}</p>
            </div>
          </div>

          <!-- Error message -->
          <p class="error-msg" *ngIf="errorMsg">{{ errorMsg }}</p>

          <!-- Navigation -->
          <div class="nav-buttons">
            <button class="btn-back" *ngIf="step > 1" (click)="step = step - 1">&larr; Back</button>
            <span class="nav-spacer"></span>
            <button class="btn-next" *ngIf="step < 4" (click)="nextStep()" [disabled]="!canAdvance()">
              Next &rarr;
            </button>
            <button class="btn-submit" *ngIf="step === 4" (click)="submit()" [disabled]="submitting">
              {{ submitting ? 'Creating account...' : (telegramValid ? 'Create account' : 'Skip & create account') }}
            </button>
          </div>

          <p class="login-link">
            Already have an account? <a routerLink="/auth/login">Sign in</a>
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
    .signup-window {
      width: 100%;
      max-width: 520px;
    }
    .signup-body {
      padding: 28px 24px;
      background: var(--color-surface-muted);
    }

    /* Steps indicator */
    .steps {
      display: flex;
      justify-content: center;
      gap: 40px;
      margin-bottom: 28px;
      position: relative;
    }
    .step {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      z-index: 1;
    }
    .step__circle {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      border: 2px solid var(--color-window-border);
      background: var(--color-surface);
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: var(--font-body);
      font-size: var(--text-sm);
      font-weight: 600;
      color: var(--color-text-muted);
      transition: all 0.2s;
    }
    .step--active .step__circle {
      border-color: var(--color-accent);
      background: var(--color-accent);
      color: var(--color-accent-text);
    }
    .step--done .step__circle {
      border-color: var(--color-success);
      background: var(--color-success);
      color: #fff;
      font-size: 14px;
    }
    .step__label {
      font-family: var(--font-body);
      font-size: var(--text-xs);
      color: var(--color-text-muted);
    }
    .step--active .step__label {
      color: var(--color-text);
      font-weight: 600;
    }
    .step__line {
      position: absolute;
      top: 16px;
      left: 25%;
      right: 25%;
      height: 2px;
      background: var(--color-window-border);
      z-index: 0;
    }

    /* Step content */
    .step-content {
      margin-bottom: 20px;
    }
    .step-title {
      font-family: var(--font-display);
      font-size: var(--text-xl);
      font-weight: 800;
      margin: 0 0 6px;
    }
    .step-desc {
      font-size: var(--text-sm);
      color: var(--color-text-secondary);
      margin: 0 0 20px;
    }

    /* Fields */
    .field {
      margin-bottom: 16px;
    }
    .field-label {
      display: block;
      font-family: var(--font-body);
      font-size: var(--text-sm);
      font-weight: 600;
      margin-bottom: 6px;
      color: var(--color-text);
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
    .field-textarea {
      resize: vertical;
      min-height: 72px;
    }
    .time-input {
      max-width: 160px;
    }
    .field-hint {
      font-size: var(--text-xs);
      color: var(--color-text-muted);
      margin-top: 4px;
    }

    /* Chips */
    .chip-group {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .chip {
      padding: 6px 14px;
      border: var(--border-subtle);
      border-radius: 20px;
      background: transparent;
      font-family: var(--font-body);
      font-size: var(--text-sm);
      font-weight: 500;
      color: var(--color-text-secondary);
      cursor: pointer;
      transition: all 0.15s;
    }
    .chip:hover {
      border-color: var(--color-accent);
    }
    .chip--selected {
      background: var(--color-accent);
      color: var(--color-accent-text);
      border-color: var(--color-accent);
    }
    .belt-chip.chip--selected {
      border-color: rgba(0,0,0,0.2);
    }
    .day-chip {
      min-width: 48px;
      text-align: center;
    }

    /* Schedule list */
    .schedule-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-top: 12px;
    }
    .schedule-row {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .schedule-day {
      font-family: var(--font-body);
      font-size: var(--text-sm);
      font-weight: 500;
      color: var(--color-text);
      min-width: 40px;
    }

    /* Error */
    .error-msg {
      color: var(--color-danger);
      font-size: var(--text-sm);
      margin-bottom: 12px;
      padding: 8px 12px;
      background: #fef2f2;
      border-radius: 6px;
      border: 1px solid #fecaca;
    }

    /* Navigation */
    .nav-buttons {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-top: 4px;
    }
    .nav-spacer {
      flex: 1;
    }
    .btn-back {
      background: transparent;
      border: none;
      font-family: var(--font-body);
      font-size: var(--text-sm);
      font-weight: 500;
      color: var(--color-text-secondary);
      cursor: pointer;
      padding: 8px 4px;
    }
    .btn-back:hover {
      color: var(--color-text);
    }
    .btn-next, .btn-submit {
      background: var(--color-accent);
      color: var(--color-accent-text);
      border: 2px solid var(--color-text);
      border-radius: 6px;
      padding: 8px 20px;
      font-family: var(--font-body);
      font-size: var(--text-sm);
      font-weight: 600;
      cursor: pointer;
      transition: background 0.15s;
    }
    .btn-next:hover:not(:disabled), .btn-submit:hover:not(:disabled) {
      background: var(--color-accent-hover);
    }
    .btn-next:disabled, .btn-submit:disabled {
      opacity: 0.4;
      cursor: default;
    }
    .login-link {
      text-align: center;
      margin-top: 16px;
      font-size: var(--text-sm);
      color: var(--color-text-muted);
    }
    .login-link a {
      color: var(--color-accent-hover);
      text-decoration: none;
      font-weight: 600;
    }
    .login-link a:hover {
      text-decoration: underline;
    }

    /* BotFather guide */
    .botfather-guide {
      background: var(--color-surface);
      border: var(--border-subtle);
      border-radius: 8px;
      padding: 14px 16px;
      margin-bottom: 16px;
    }
    .guide-title {
      font-family: var(--font-body);
      font-size: var(--text-sm);
      font-weight: 600;
      margin: 0 0 8px;
    }
    .guide-steps {
      margin: 0;
      padding-left: 20px;
      font-size: var(--text-sm);
      color: var(--color-text-secondary);
      line-height: 1.6;
    }
    .guide-steps code {
      background: var(--color-surface-muted);
      padding: 1px 5px;
      border-radius: 3px;
      font-size: var(--text-xs);
    }

    /* Token input row */
    .token-input-row {
      display: flex;
      gap: 8px;
    }
    .token-input-row .field-input {
      flex: 1;
    }
    .btn-validate {
      background: var(--color-surface);
      border: var(--border-subtle);
      border-radius: 6px;
      padding: 8px 16px;
      font-family: var(--font-body);
      font-size: var(--text-sm);
      font-weight: 500;
      cursor: pointer;
      white-space: nowrap;
      transition: border-color 0.15s;
    }
    .btn-validate:hover:not(:disabled) {
      border-color: var(--color-accent);
    }
    .btn-validate:disabled {
      opacity: 0.4;
      cursor: default;
    }

    .telegram-success {
      color: var(--color-success, #16a34a) !important;
      font-weight: 600;
    }
    .telegram-error {
      color: var(--color-danger) !important;
    }

    @media (max-width: 480px) {
      .signup-body { padding: 20px 16px; }
      .steps { gap: 24px; }
      .step__line { left: 15%; right: 15%; }
    }
  `],
})
export class SignupComponent {
  step = 1;
  stepLabels = ['Basics', 'Background', 'Schedule', 'Telegram'];

  // Step 1
  name = '';
  email = '';
  password = '';

  // Step 2
  beltRank = '';
  experienceMonths: number | null = null;
  beltOptions = BELT_OPTIONS;
  experienceOptions = EXPERIENCE_OPTIONS;

  // Step 3
  daySchedule: Record<string, string> = {};
  goals = '';
  days = DAYS;
  dayLabels = DAY_LABELS;

  // Step 4: Telegram
  telegramToken = '';
  telegramValid = false;
  telegramBotUsername = '';
  validatingToken = false;
  telegramError = '';

  // State
  submitting = false;
  errorMsg = '';

  constructor(private auth: AuthService, private router: Router, private http: HttpClient) {}

  get selectedDaysList(): { day: string; label: string }[] {
    return this.days
      .filter(d => d in this.daySchedule)
      .map((d, _, __, i = this.days.indexOf(d)) => ({ day: d, label: DAY_LABELS[i] }));
  }

  trackByDay(_index: number, entry: { day: string }): string {
    return entry.day;
  }

  toggleDay(day: string): void {
    if (this.daySchedule[day]) {
      delete this.daySchedule[day];
    } else {
      this.daySchedule[day] = '19:00';
    }
  }

  canAdvance(): boolean {
    if (this.step === 1) {
      return this.name.trim().length > 0 && this.email.includes('@') && this.password.length >= 6;
    }
    if (this.step === 2) {
      return this.beltRank !== '' && this.experienceMonths !== null;
    }
    return true;
  }

  nextStep(): void {
    if (this.canAdvance()) {
      this.errorMsg = '';
      this.step++;
    }
  }

  validateTelegram(): void {
    this.telegramError = '';
    this.telegramValid = false;
    this.validatingToken = true;

    this.http.post<{ valid: boolean; bot_username?: string; error?: string }>(
      `${environment.apiUrl}/auth/validate-telegram`,
      { token: this.telegramToken.trim() }
    ).subscribe({
      next: (res) => {
        this.validatingToken = false;
        if (res.valid) {
          this.telegramValid = true;
          this.telegramBotUsername = res.bot_username || '';
        } else {
          this.telegramError = res.error || 'Invalid token';
        }
      },
      error: () => {
        this.validatingToken = false;
        this.telegramError = 'Failed to validate token. Please try again.';
      },
    });
  }

  submit(): void {
    this.errorMsg = '';
    this.submitting = true;

    const data: SignupData = {
      email: this.email.trim().toLowerCase(),
      password: this.password,
      name: this.name.trim(),
      belt_rank: this.beltRank,
      experience_months: this.experienceMonths || 0,
      training_days: JSON.stringify(this.daySchedule),
      goals: this.goals.trim(),
    };

    if (this.telegramValid && this.telegramToken.trim()) {
      data.telegram_bot_token = this.telegramToken.trim();
    }

    this.auth.signup(data).subscribe({
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
