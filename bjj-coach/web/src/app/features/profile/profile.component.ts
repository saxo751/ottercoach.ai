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

    @media (max-width: 480px) {
      .profile-body { padding: 20px 16px; }
    }
  `],
})
export class ProfileComponent implements OnInit {
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

  private populateForm(user: User): void {
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
