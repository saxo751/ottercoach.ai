import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import type { User } from '../../shared/models';


const BELT_OPTIONS = [
  { value: 'white', label: 'White', color: '#f0ece4', textColor: '#1a1a1a', border: true },
  { value: 'blue', label: 'Blue', color: '#3b82f6', textColor: '#fff', border: false },
  { value: 'purple', label: 'Purple', color: '#8b5cf6', textColor: '#fff', border: false },
  { value: 'brown', label: 'Brown', color: '#92400e', textColor: '#fff', border: false },
  { value: 'black', label: 'Black', color: '#1a1a1a', textColor: '#fff', border: false },
  { value: 'nogi', label: 'No-gi', color: '#2d3748', textColor: '#fff', border: false },
];

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="window-container">
      <div class="retro-window profile-window">
        <!-- Title bar -->
        <div class="retro-window__titlebar">
          <div class="retro-window__controls">
            <a routerLink="/" class="retro-window__dot retro-window__dot--close"></a>
            <span class="retro-window__dot retro-window__dot--minimize"></span>
            <span class="retro-window__dot retro-window__dot--maximize"></span>
          </div>
          <span class="retro-window__title">profile.cfg &mdash; Settings</span>
        </div>

        <div class="retro-window__body profile-body">
          <div *ngIf="loading" class="loading-state">Loading profile...</div>

          <div *ngIf="!loading && !loadError">
            <h2 class="section-title">Profile Settings</h2>

            <!-- Avatar -->
            <div class="avatar-section">
              <div class="avatar-circle" (click)="fileInput.click()">
                <img *ngIf="profilePicturePreview" [src]="profilePicturePreview" class="avatar-img" alt="Profile" />
                <span *ngIf="!profilePicturePreview" class="avatar-initial">{{ avatarInitial }}</span>
                <div class="avatar-overlay">
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M15 11v4H3v-4H1v4a2 2 0 002 2h12a2 2 0 002-2v-4h-2zM9 2L4.5 6.5l1.41 1.41L8 5.83V13h2V5.83l2.09 2.08L13.5 6.5 9 2z" fill="currentColor"/></svg>
                </div>
              </div>
              <input #fileInput type="file" accept="image/*" (change)="onFileSelected($event)" class="file-hidden" />
              <button *ngIf="profilePicturePreview" class="btn-remove-photo" (click)="removePhoto()">Remove photo</button>
            </div>

            <!-- Name -->
            <div class="field">
              <label class="field-label">Name</label>
              <input type="text" class="field-input" [(ngModel)]="name" placeholder="Your name" />
            </div>

            <!-- Email -->
            <div class="field">
              <label class="field-label">Email</label>
              <input type="email" class="field-input" [(ngModel)]="email" placeholder="you@example.com" />
            </div>

            <!-- Belt rank -->
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

            <!-- Experience -->
            <div class="field">
              <label class="field-label">Experience (months)</label>
              <input type="number" class="field-input field-input--short" [(ngModel)]="experienceMonths" min="0" placeholder="e.g. 18" />
            </div>

            <!-- Game style -->
            <div class="field">
              <label class="field-label">Preferred game style</label>
              <input type="text" class="field-input" [(ngModel)]="gameStyle" placeholder="e.g. pressure, guard, wrestling" />
            </div>

            <!-- Training days -->
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
              <div class="schedule-list" *ngIf="selectedDaysList.length">
                <div class="schedule-row" *ngFor="let entry of selectedDaysList; trackBy: trackByDay">
                  <span class="schedule-day">{{ entry.label }}</span>
                  <input type="time" class="time-input" [(ngModel)]="daySchedule[entry.day]" />
                </div>
              </div>
            </div>

            <!-- Injuries -->
            <div class="field">
              <label class="field-label">Injuries / limitations</label>
              <textarea class="field-input field-textarea" [(ngModel)]="injuries" rows="2"
                        placeholder="e.g. bad left knee, recovering from shoulder surgery"></textarea>
            </div>

            <!-- Focus area -->
            <div class="field">
              <label class="field-label">Current focus area</label>
              <input type="text" class="field-input" [(ngModel)]="focusArea" placeholder="e.g. guard retention, passing" />
            </div>

            <!-- Goals -->
            <div class="field">
              <label class="field-label">Goals</label>
              <textarea class="field-input field-textarea" [(ngModel)]="goals" rows="3"
                        placeholder="What are you working toward?"></textarea>
            </div>

            <!-- Timezone -->
            <div class="field">
              <label class="field-label">Timezone</label>
              <select class="field-input field-select" [(ngModel)]="timezone">
                <option *ngFor="let tz of timezones" [value]="tz">{{ tz }}</option>
              </select>
            </div>

            <!-- Telegram Bot -->
            <h2 class="section-title section-title--spaced">Telegram Bot</h2>

            <div *ngIf="hasTelegramBot" class="telegram-status">
              <div class="telegram-connected">
                <span class="telegram-badge">Connected</span>
                <span class="telegram-token-masked">Token: {{ maskedTelegramToken }}</span>
              </div>
              <button class="btn-disconnect" (click)="disconnectTelegram()" [disabled]="telegramSaving">
                {{ telegramSaving ? 'Disconnecting...' : 'Disconnect' }}
              </button>
            </div>

            <div *ngIf="!hasTelegramBot">
              <div class="botfather-guide">
                <p class="guide-title">Connect your Telegram bot:</p>
                <ol class="guide-steps">
                  <li>Open Telegram and search for <strong>&#64;BotFather</strong></li>
                  <li>Send <code>/newbot</code> and follow the prompts</li>
                  <li>Paste the API token below</li>
                </ol>
              </div>

              <div class="field">
                <label class="field-label">Bot token</label>
                <div class="token-input-row">
                  <input type="text" class="field-input" [(ngModel)]="telegramToken"
                         placeholder="123456:ABC-DEF..." autocomplete="off" />
                  <button class="btn-validate" (click)="connectTelegram()" [disabled]="!telegramToken.trim() || telegramSaving">
                    {{ telegramSaving ? 'Connecting...' : 'Validate & Connect' }}
                  </button>
                </div>
                <p class="field-hint telegram-error" *ngIf="telegramError">{{ telegramError }}</p>
              </div>
            </div>

            <p class="telegram-success-msg" *ngIf="telegramSuccess">{{ telegramSuccess }}</p>

            <!-- Messages -->
            <p class="success-msg" *ngIf="successMsg">{{ successMsg }}</p>
            <p class="error-msg" *ngIf="errorMsg">{{ errorMsg }}</p>

            <!-- Actions -->
            <div class="action-buttons">
              <a class="btn-cancel" routerLink="/">Cancel</a>
              <button class="btn-save" (click)="save()" [disabled]="saving">
                {{ saving ? 'Saving...' : 'Save changes' }}
              </button>
            </div>
          </div>

          <div *ngIf="loadError" class="error-state">
            <p>{{ loadError }}</p>
            <a routerLink="/">Back to home</a>
          </div>
        </div>

        <!-- Status bar -->
        <div class="retro-window__statusbar">
          Last updated: {{ updatedAt || '—' }}
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
    .profile-window {
      width: 100%;
      max-width: 560px;
    }
    .profile-body {
      padding: 28px 24px;
      background: var(--color-surface-muted);
    }

    .section-title {
      font-family: var(--font-display);
      font-size: var(--text-xl);
      font-weight: 800;
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
    .field-input--short {
      max-width: 200px;
    }
    .field-textarea {
      resize: vertical;
      min-height: 60px;
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

    /* Schedule list (per-day times) */
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
      font-weight: 600;
      color: var(--color-text);
      min-width: 90px;
    }
    .time-input {
      padding: 8px 12px;
      border: var(--border-subtle);
      border-radius: 6px;
      font-family: var(--font-body);
      font-size: var(--text-sm);
      background: var(--color-surface);
      color: var(--color-text);
      outline: none;
      transition: border-color 0.15s;
    }
    .time-input:focus {
      border-color: var(--color-accent);
    }

    /* Timezone select */
    .field-select {
      appearance: auto;
      cursor: pointer;
    }

    /* Messages */
    .success-msg {
      color: var(--color-success, #16a34a);
      font-size: var(--text-sm);
      margin-bottom: 12px;
      padding: 8px 12px;
      background: #f0fdf4;
      border-radius: 6px;
      border: 1px solid #bbf7d0;
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

    /* Actions */
    .action-buttons {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-top: 8px;
    }
    .btn-cancel {
      font-family: var(--font-body);
      font-size: var(--text-sm);
      font-weight: 500;
      color: var(--color-text-secondary);
      text-decoration: none;
      padding: 8px 4px;
    }
    .btn-cancel:hover {
      color: var(--color-text);
    }
    .btn-save {
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
      margin-left: auto;
    }
    .btn-save:hover:not(:disabled) {
      background: var(--color-accent-hover);
    }
    .btn-save:disabled {
      opacity: 0.4;
      cursor: default;
    }

    /* States */
    .loading-state, .error-state {
      text-align: center;
      padding: 48px 20px;
      color: var(--color-text-muted);
      font-size: var(--text-sm);
    }
    .error-state a {
      color: var(--color-accent-hover);
      text-decoration: none;
      font-weight: 600;
    }

    /* Telegram section */
    .section-title--spaced {
      margin-top: 28px;
      padding-top: 20px;
      border-top: var(--border-subtle);
    }

    .telegram-status {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: var(--color-surface);
      border: var(--border-subtle);
      border-radius: 8px;
      padding: 14px 16px;
      margin-bottom: 16px;
    }
    .telegram-connected {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .telegram-badge {
      font-family: var(--font-body);
      font-size: var(--text-xs);
      font-weight: 600;
      color: var(--color-success, #16a34a);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .telegram-token-masked {
      font-family: var(--font-mono, monospace);
      font-size: var(--text-xs);
      color: var(--color-text-muted);
    }
    .btn-disconnect {
      background: transparent;
      border: 1px solid var(--color-danger, #dc2626);
      border-radius: 6px;
      padding: 6px 14px;
      font-family: var(--font-body);
      font-size: var(--text-xs);
      font-weight: 500;
      color: var(--color-danger, #dc2626);
      cursor: pointer;
      transition: all 0.15s;
    }
    .btn-disconnect:hover:not(:disabled) {
      background: var(--color-danger, #dc2626);
      color: #fff;
    }
    .btn-disconnect:disabled {
      opacity: 0.4;
      cursor: default;
    }

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
    .telegram-error {
      color: var(--color-danger) !important;
    }
    .telegram-success-msg {
      color: var(--color-success, #16a34a);
      font-size: var(--text-sm);
      margin-bottom: 12px;
      padding: 8px 12px;
      background: #f0fdf4;
      border-radius: 6px;
      border: 1px solid #bbf7d0;
    }

    /* Avatar */
    .avatar-section {
      display: flex;
      flex-direction: column;
      align-items: center;
      margin-bottom: 24px;
    }
    .avatar-circle {
      width: 96px;
      height: 96px;
      border-radius: 50%;
      border: 3px solid var(--color-text);
      background: var(--color-accent);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      position: relative;
      overflow: hidden;
      transition: opacity 0.15s;
    }
    .avatar-circle:hover {
      opacity: 0.85;
    }
    .avatar-circle:hover .avatar-overlay {
      opacity: 1;
    }
    .avatar-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .avatar-initial {
      font-family: var(--font-display);
      font-size: 36px;
      font-weight: 800;
      color: var(--color-accent-text);
      user-select: none;
    }
    .avatar-overlay {
      position: absolute;
      inset: 0;
      background: rgba(0,0,0,0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      opacity: 0;
      transition: opacity 0.15s;
    }
    .file-hidden {
      display: none;
    }
    .btn-remove-photo {
      margin-top: 8px;
      background: none;
      border: none;
      font-family: var(--font-body);
      font-size: var(--text-xs);
      color: var(--color-danger, #dc2626);
      cursor: pointer;
      padding: 4px 8px;
    }
    .btn-remove-photo:hover {
      text-decoration: underline;
    }

    @media (max-width: 480px) {
      .profile-body { padding: 20px 16px; }
    }
  `],
})
export class ProfileComponent implements OnInit {
  // Profile picture
  profilePicturePreview: string | null = null;
  profilePictureData: string | null = null;  // tracks pending change (null = remove, undefined-like = no change)
  profilePictureDirty = false;

  // Form fields
  name = '';
  email = '';
  beltRank = '';
  experienceMonths: number | null = null;
  gameStyle = '';
  daySchedule: Record<string, string> = {};
  injuries = '';
  focusArea = '';
  goals = '';
  timezone = '';
  updatedAt = '';

  // Options
  beltOptions = BELT_OPTIONS;
  days = DAYS;
  dayLabels = DAY_LABELS;
  timezones: string[] = [];

  get selectedDaysList(): { day: string; label: string }[] {
    return this.days
      .map((day, i) => ({ day, label: this.dayLabels[i] }))
      .filter(entry => this.daySchedule[entry.day]);
  }

  // Telegram
  hasTelegramBot = false;
  maskedTelegramToken = '';
  telegramToken = '';
  telegramSaving = false;
  telegramError = '';
  telegramSuccess = '';

  // State
  loading = true;
  loadError = '';
  saving = false;
  successMsg = '';
  errorMsg = '';

  constructor(
    private api: ApiService,
    private auth: AuthService,
  ) {}

  ngOnInit(): void {
    try {
      this.timezones = (Intl as any).supportedValuesOf('timeZone');
    } catch {
      this.timezones = [
        'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
        'America/Anchorage', 'Pacific/Honolulu', 'America/Sao_Paulo', 'America/Buenos_Aires',
        'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Europe/Moscow',
        'Asia/Tokyo', 'Asia/Shanghai', 'Asia/Kolkata', 'Asia/Dubai',
        'Australia/Sydney', 'Australia/Perth', 'Pacific/Auckland',
      ];
    }

    this.api.getProfile().subscribe({
      next: (user) => {
        this.populateForm(user);
        this.loading = false;
      },
      error: () => {
        this.loadError = 'Failed to load profile.';
        this.loading = false;
      },
    });
  }

  get avatarInitial(): string {
    if (this.name) return this.name.charAt(0).toUpperCase();
    if (this.email) return this.email.charAt(0).toUpperCase();
    return '?';
  }

  onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 256;
        let w = img.width;
        let h = img.height;
        if (w > maxDim || h > maxDim) {
          if (w > h) { h = Math.round(h * maxDim / w); w = maxDim; }
          else { w = Math.round(w * maxDim / h); h = maxDim; }
        }
        canvas.width = w;
        canvas.height = h;
        canvas.getContext('2d')!.drawImage(img, 0, 0, w, h);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        this.profilePicturePreview = dataUrl;
        this.profilePictureData = dataUrl;
        this.profilePictureDirty = true;
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
    // Reset so re-selecting the same file triggers change
    (event.target as HTMLInputElement).value = '';
  }

  removePhoto(): void {
    this.profilePicturePreview = null;
    this.profilePictureData = null;
    this.profilePictureDirty = true;
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

  save(): void {
    this.successMsg = '';
    this.errorMsg = '';
    this.saving = true;

    // Build training_days as JSON object { "monday": "19:00", "wednesday": "20:00" }
    const scheduleObj: Record<string, string> = {};
    for (const day of this.days) {
      if (this.daySchedule[day]) {
        scheduleObj[day] = this.daySchedule[day];
      }
    }
    const trainingDaysJson = JSON.stringify(scheduleObj);

    const updates: Partial<User> = {
      name: this.name.trim(),
      email: this.email.trim().toLowerCase(),
      belt_rank: this.beltRank || null,
      experience_months: this.experienceMonths,
      preferred_game_style: this.gameStyle.trim() || null,
      training_days: trainingDaysJson,
      typical_training_time: null,
      injuries_limitations: this.injuries.trim() || null,
      current_focus_area: this.focusArea.trim() || null,
      goals: this.goals.trim() || null,
      timezone: this.timezone.trim() || 'America/New_York',
    };

    if (this.profilePictureDirty) {
      updates.profile_picture = this.profilePictureData;
    }

    this.api.updateProfile(updates).subscribe({
      next: (user) => {
        this.saving = false;
        this.successMsg = 'Profile updated successfully.';
        this.populateForm(user);
        // Refresh the auth user state (navbar avatar/name)
        this.auth.fetchMe();
      },
      error: (err) => {
        this.saving = false;
        this.errorMsg = err.error?.error || 'Failed to save profile.';
      },
    });
  }

  connectTelegram(): void {
    this.telegramError = '';
    this.telegramSuccess = '';
    this.telegramSaving = true;

    this.api.setTelegramToken(this.telegramToken.trim()).subscribe({
      next: (res) => {
        this.telegramSaving = false;
        if (res.success) {
          this.hasTelegramBot = true;
          this.maskedTelegramToken = '...' + this.telegramToken.trim().slice(-4);
          this.telegramToken = '';
          this.telegramSuccess = `Bot connected${res.bot_username ? ` (@${res.bot_username})` : ''}! Open Telegram and send /start to your bot.`;
        }
      },
      error: (err) => {
        this.telegramSaving = false;
        this.telegramError = err.error?.error || 'Failed to connect bot. Check your token.';
      },
    });
  }

  disconnectTelegram(): void {
    if (!confirm('Disconnect your Telegram bot? You can reconnect later.')) return;

    this.telegramError = '';
    this.telegramSuccess = '';
    this.telegramSaving = true;

    this.api.setTelegramToken(null).subscribe({
      next: () => {
        this.telegramSaving = false;
        this.hasTelegramBot = false;
        this.maskedTelegramToken = '';
        this.telegramSuccess = 'Telegram bot disconnected.';
      },
      error: () => {
        this.telegramSaving = false;
        this.telegramError = 'Failed to disconnect. Please try again.';
      },
    });
  }

  private populateForm(user: User): void {
    this.profilePicturePreview = user.profile_picture || null;
    this.profilePictureData = user.profile_picture || null;
    this.profilePictureDirty = false;
    this.name = user.name || '';
    this.email = user.email || '';
    this.beltRank = user.belt_rank || '';
    this.experienceMonths = user.experience_months;
    this.gameStyle = user.preferred_game_style || '';
    this.injuries = user.injuries_limitations || '';
    this.focusArea = user.current_focus_area || '';
    this.goals = user.goals || '';
    this.timezone = user.timezone || '';
    this.updatedAt = user.updated_at ? new Date(user.updated_at).toLocaleDateString() : '';

    // Telegram
    this.hasTelegramBot = !!user.has_telegram_bot;
    this.maskedTelegramToken = user.telegram_bot_token || '';

    // Parse training_days — JSON object {"monday":"19:00"} or legacy array ["monday","wednesday"]
    this.daySchedule = {};
    if (user.training_days) {
      try {
        const parsed = JSON.parse(user.training_days);
        if (Array.isArray(parsed)) {
          for (const day of parsed) {
            this.daySchedule[day] = user.typical_training_time || '19:00';
          }
        } else if (typeof parsed === 'object' && parsed !== null) {
          for (const [key, val] of Object.entries(parsed)) {
            this.daySchedule[key] = (val as string) || '19:00';
          }
        }
      } catch {
        // If not valid JSON, ignore
      }
    }
  }
}
