import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { TechniquePickerComponent } from '../../shared/components/technique-picker.component';
import type { FocusPeriodWithDays, Technique } from '../../shared/models';

@Component({
  selector: 'app-focus-timeline',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TechniquePickerComponent],
  template: `
    <div class="window-container">
      <div class="retro-window focus-window">
        <!-- Title bar -->
        <div class="retro-window__titlebar">
          <div class="retro-window__controls">
            <a routerLink="/" class="retro-window__dot retro-window__dot--close"></a>
            <span class="retro-window__dot retro-window__dot--minimize"></span>
            <span class="retro-window__dot retro-window__dot--maximize"></span>
          </div>
          <span class="retro-window__title">focus_periods.log &mdash; Timeline</span>
        </div>

        <div class="retro-window__body focus-body">
          <!-- New Focus button -->
          <div class="focus-actions" *ngIf="!loading && !loadError">
            <button class="btn-new-focus" (click)="toggleCreateForm()" [class.active]="showCreateForm">
              {{ showCreateForm ? 'Cancel' : '+ New Focus' }}
            </button>
          </div>

          <!-- Create form -->
          <div *ngIf="showCreateForm" class="create-form">
            <div class="form-group">
              <label class="form-label">Name *</label>
              <input class="form-input" [(ngModel)]="newName" placeholder="e.g. Guard retention block" />
            </div>
            <div class="form-group">
              <label class="form-label">Description</label>
              <input class="form-input" [(ngModel)]="newDescription" placeholder="Optional description" />
            </div>
            <app-technique-picker
              label="Focus Techniques"
              [selected]="newTechniquesList"
              [userTechniques]="userTechniques"
              (selectedChange)="newTechniquesList = $event"
            ></app-technique-picker>
            <div class="form-actions">
              <button class="btn-submit" (click)="createFocus()" [disabled]="!newName.trim() || saving">
                {{ saving ? 'Creating...' : 'Create Focus Period' }}
              </button>
            </div>
          </div>

          <div *ngIf="loading" class="loading-state">Loading focus periods...</div>

          <div *ngIf="!loading && !loadError && periods.length === 0 && !showCreateForm" class="empty-state">
            <div class="empty-icon">
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="24" cy="24" r="20" stroke="currentColor" stroke-width="2" stroke-dasharray="4 4" />
                <path d="M24 14v10l7 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </div>
            <p class="empty-title">No focus periods yet</p>
            <p class="empty-desc">Create your first focused training block above, or chat with your coach.</p>
            <a class="empty-cta" routerLink="/chat">Open Coach Chat</a>
          </div>

          <div *ngIf="!loading && !loadError && periods.length > 0" class="timeline">
            <div
              *ngFor="let period of periods; let i = index; let last = last"
              class="timeline__item"
              [class.timeline__item--active]="period.status === 'active'"
            >
              <!-- Marker column -->
              <div class="timeline__marker-col">
                <div class="timeline__dot" [class.timeline__dot--active]="period.status === 'active'"></div>
                <div *ngIf="!last" class="timeline__line"></div>
              </div>

              <!-- Card column -->
              <div class="timeline__card" [class.timeline__card--active]="period.status === 'active'">
                <!-- View mode -->
                <ng-container *ngIf="editingId !== period.id">
                  <div class="card__header">
                    <span class="card__name">{{ period.name }}</span>
                    <span *ngIf="period.status === 'active'" class="card__badge">Active</span>
                  </div>

                  <div class="card__stats">
                    <div class="card__stat">
                      <span class="card__stat-value">{{ period.session_count }}</span>
                      <span class="card__stat-label">{{ period.session_count === 1 ? 'session' : 'sessions' }}</span>
                    </div>
                    <div class="card__stat">
                      <span class="card__stat-value">{{ period.days_active }}</span>
                      <span class="card__stat-label">{{ period.days_active === 1 ? 'day' : 'days' }}</span>
                    </div>
                  </div>

                  <p *ngIf="period.description" class="card__desc">{{ period.description }}</p>

                  <div class="card__meta">
                    <span class="card__dates">{{ formatDate(period.start_date) }} &mdash; {{ period.end_date ? formatDate(period.end_date) : 'Present' }}</span>
                  </div>

                  <div *ngIf="parseTechniques(period.focus_techniques).length" class="card__tags">
                    <span *ngFor="let tech of parseTechniques(period.focus_techniques)" class="card__tag">{{ tech }}</span>
                  </div>

                  <div class="card__actions">
                    <button class="btn-card btn-edit" (click)="startEdit(period)">Edit</button>
                    <button *ngIf="period.status === 'active'" class="btn-card btn-complete" (click)="completePeriod(period)" [disabled]="saving">Complete</button>
                    <button *ngIf="period.session_count === 0" class="btn-card btn-delete" (click)="deletePeriod(period)" [disabled]="saving">Delete</button>
                  </div>
                </ng-container>

                <!-- Edit mode -->
                <ng-container *ngIf="editingId === period.id">
                  <div class="form-group">
                    <label class="form-label">Name</label>
                    <input class="form-input" [(ngModel)]="editName" />
                  </div>
                  <div class="form-group">
                    <label class="form-label">Description</label>
                    <input class="form-input" [(ngModel)]="editDescription" />
                  </div>
                  <app-technique-picker
                    label="Focus Techniques"
                    [selected]="editTechniquesList"
                    [userTechniques]="userTechniques"
                    (selectedChange)="editTechniquesList = $event"
                  ></app-technique-picker>
                  <div class="card__actions">
                    <button class="btn-card btn-save" (click)="saveEdit(period)" [disabled]="!editName.trim() || saving">
                      {{ saving ? 'Saving...' : 'Save' }}
                    </button>
                    <button class="btn-card btn-cancel" (click)="cancelEdit()">Cancel</button>
                  </div>
                </ng-container>
              </div>
            </div>
          </div>

          <div *ngIf="loadError" class="error-state">
            <p>{{ loadError }}</p>
            <a routerLink="/">Back to home</a>
          </div>
        </div>

        <!-- Status bar -->
        <div class="retro-window__statusbar">
          {{ periods.length }} focus {{ periods.length === 1 ? 'period' : 'periods' }} &middot; {{ totalSessions }} total sessions
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
    .focus-window {
      width: 100%;
      max-width: 620px;
    }
    .focus-body {
      padding: 28px 24px;
      background: var(--color-surface-muted);
    }

    /* Focus actions */
    .focus-actions {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 20px;
    }
    .btn-new-focus {
      font-family: var(--font-body);
      font-size: var(--text-sm);
      font-weight: 600;
      color: var(--color-accent-text);
      background: var(--color-accent);
      border: 2px solid var(--color-text);
      border-radius: 6px;
      padding: 6px 16px;
      cursor: pointer;
      transition: background 0.15s;
    }
    .btn-new-focus:hover, .btn-new-focus.active {
      background: var(--color-accent-hover);
    }

    /* Create form */
    .create-form {
      background: var(--color-surface);
      border: var(--border-subtle);
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 24px;
    }
    .form-group {
      margin-bottom: 12px;
    }
    .form-label {
      display: block;
      font-family: var(--font-body);
      font-size: var(--text-xs);
      font-weight: 600;
      color: var(--color-text-muted);
      margin-bottom: 4px;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }
    .form-input {
      width: 100%;
      font-family: var(--font-body);
      font-size: var(--text-sm);
      padding: 8px 10px;
      border: var(--border-subtle);
      border-radius: 6px;
      background: var(--color-surface-muted);
      color: var(--color-text);
      box-sizing: border-box;
    }
    .form-input:focus {
      outline: none;
      border-color: var(--color-accent);
    }
    .form-actions {
      display: flex;
      justify-content: flex-end;
      margin-top: 16px;
    }
    .btn-submit {
      font-family: var(--font-body);
      font-size: var(--text-sm);
      font-weight: 600;
      color: var(--color-accent-text);
      background: var(--color-accent);
      border: 2px solid var(--color-text);
      border-radius: 6px;
      padding: 8px 20px;
      cursor: pointer;
      transition: background 0.15s;
    }
    .btn-submit:hover:not(:disabled) {
      background: var(--color-accent-hover);
    }
    .btn-submit:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    /* Loading / Error */
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

    /* Empty state */
    .empty-state {
      text-align: center;
      padding: 48px 20px;
    }
    .empty-icon {
      color: var(--color-text-muted);
      margin-bottom: 16px;
    }
    .empty-title {
      font-family: var(--font-display);
      font-size: var(--text-lg);
      font-weight: 700;
      margin-bottom: 8px;
    }
    .empty-desc {
      font-size: var(--text-sm);
      color: var(--color-text-secondary);
      margin-bottom: 20px;
    }
    .empty-cta {
      display: inline-block;
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
    .empty-cta:hover {
      background: var(--color-accent-hover);
    }

    /* Timeline */
    .timeline {
      display: flex;
      flex-direction: column;
    }

    .timeline__item {
      display: flex;
      gap: 16px;
    }

    /* Marker column */
    .timeline__marker-col {
      display: flex;
      flex-direction: column;
      align-items: center;
      width: 16px;
      flex-shrink: 0;
    }
    .timeline__dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: var(--color-text-muted);
      border: 2px solid var(--color-surface-muted);
      box-shadow: 0 0 0 2px var(--color-text-muted);
      flex-shrink: 0;
      margin-top: 6px;
    }
    .timeline__dot--active {
      background: var(--color-accent);
      box-shadow: 0 0 0 2px var(--color-accent);
    }
    .timeline__line {
      width: 2px;
      flex: 1;
      background: var(--color-window-border);
      min-height: 16px;
    }

    /* Card */
    .timeline__card {
      flex: 1;
      background: var(--color-surface);
      border: var(--border-subtle);
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 16px;
      transition: border-color 0.15s;
    }
    .timeline__card--active {
      border-left: 3px solid var(--color-accent);
    }

    .card__header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 12px;
    }
    .card__name {
      font-family: var(--font-display);
      font-size: var(--text-base);
      font-weight: 700;
      color: var(--color-text);
    }
    .card__badge {
      font-family: var(--font-body);
      font-size: var(--text-xs);
      font-weight: 600;
      color: var(--color-accent-text);
      background: var(--color-accent);
      padding: 2px 8px;
      border-radius: 10px;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }

    /* Stats row */
    .card__stats {
      display: flex;
      gap: 24px;
      margin-bottom: 12px;
    }
    .card__stat {
      display: flex;
      align-items: baseline;
      gap: 4px;
    }
    .card__stat-value {
      font-family: var(--font-display);
      font-size: var(--text-xl);
      font-weight: 800;
      color: var(--color-text);
      line-height: 1;
    }
    .card__stat-label {
      font-family: var(--font-body);
      font-size: var(--text-xs);
      color: var(--color-text-muted);
      font-weight: 500;
    }

    .card__desc {
      font-size: var(--text-sm);
      color: var(--color-text-secondary);
      margin-bottom: 10px;
      line-height: 1.5;
    }

    .card__meta {
      margin-bottom: 8px;
    }
    .card__dates {
      font-family: var(--font-mono);
      font-size: var(--text-xs);
      color: var(--color-text-muted);
    }

    /* Technique tags */
    .card__tags {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-top: 10px;
    }
    .card__tag {
      font-family: var(--font-body);
      font-size: var(--text-xs);
      font-weight: 500;
      color: var(--color-text-secondary);
      background: var(--color-surface-muted);
      border: var(--border-subtle);
      padding: 3px 10px;
      border-radius: 12px;
    }

    /* Card action buttons */
    .card__actions {
      display: flex;
      gap: 8px;
      margin-top: 14px;
      padding-top: 12px;
      border-top: var(--border-subtle);
    }
    .btn-card {
      font-family: var(--font-body);
      font-size: var(--text-xs);
      font-weight: 600;
      padding: 4px 12px;
      border-radius: 4px;
      cursor: pointer;
      border: 1px solid var(--color-window-border);
      background: var(--color-surface-muted);
      color: var(--color-text-secondary);
      transition: background 0.15s, color 0.15s;
    }
    .btn-card:hover:not(:disabled) {
      background: var(--color-surface);
      color: var(--color-text);
    }
    .btn-card:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .btn-complete {
      color: var(--color-accent-text);
      background: var(--color-accent);
      border-color: var(--color-text);
    }
    .btn-complete:hover:not(:disabled) {
      background: var(--color-accent-hover);
    }
    .btn-delete {
      color: #dc2626;
    }
    .btn-delete:hover:not(:disabled) {
      background: #fef2f2;
      color: #b91c1c;
    }
    .btn-save {
      color: var(--color-accent-text);
      background: var(--color-accent);
      border-color: var(--color-text);
    }
    .btn-save:hover:not(:disabled) {
      background: var(--color-accent-hover);
    }

    @media (max-width: 480px) {
      .focus-body { padding: 20px 12px; }
      .timeline__card { padding: 12px; }
      .card__stats { gap: 16px; }
      .create-form { padding: 14px; }
    }
  `],
})
export class FocusTimelineComponent implements OnInit {
  periods: FocusPeriodWithDays[] = [];
  loading = true;
  loadError = '';
  saving = false;
  userTechniques: Technique[] = [];

  // Create form
  showCreateForm = false;
  newName = '';
  newDescription = '';
  newTechniquesList: string[] = [];

  // Edit form
  editingId: number | null = null;
  editName = '';
  editDescription = '';
  editTechniquesList: string[] = [];

  constructor(private api: ApiService) {}

  get totalSessions(): number {
    return this.periods.reduce((sum, p) => sum + (p.session_count || 0), 0);
  }

  ngOnInit(): void {
    this.loadPeriods();
    this.api.getTechniques().subscribe(t => this.userTechniques = t);
  }

  loadPeriods(): void {
    this.api.getFocusHistory().subscribe({
      next: (data) => {
        this.periods = data;
        this.loading = false;
      },
      error: () => {
        this.loadError = 'Failed to load focus periods.';
        this.loading = false;
      },
    });
  }

  toggleCreateForm(): void {
    this.showCreateForm = !this.showCreateForm;
    if (!this.showCreateForm) {
      this.newName = '';
      this.newDescription = '';
      this.newTechniquesList = [];
    }
  }

  createFocus(): void {
    if (!this.newName.trim() || this.saving) return;
    this.saving = true;

    const body: any = { name: this.newName.trim() };
    if (this.newDescription.trim()) body.description = this.newDescription.trim();
    if (this.newTechniquesList.length) body.focus_techniques = JSON.stringify(this.newTechniquesList);

    this.api.createFocusPeriod(body).subscribe({
      next: () => {
        this.showCreateForm = false;
        this.newName = '';
        this.newDescription = '';
        this.newTechniquesList = [];
        this.saving = false;
        this.loadPeriods();
      },
      error: () => {
        this.saving = false;
      },
    });
  }

  startEdit(period: FocusPeriodWithDays): void {
    this.editingId = period.id;
    this.editName = period.name;
    this.editDescription = period.description || '';
    this.editTechniquesList = this.parseTechniques(period.focus_techniques);
  }

  cancelEdit(): void {
    this.editingId = null;
  }

  saveEdit(period: FocusPeriodWithDays): void {
    if (!this.editName.trim() || this.saving) return;
    this.saving = true;

    const body: any = { name: this.editName.trim() };
    body.description = this.editDescription.trim() || null;
    body.focus_techniques = this.editTechniquesList.length ? JSON.stringify(this.editTechniquesList) : null;

    this.api.updateFocusPeriod(period.id, body).subscribe({
      next: () => {
        this.editingId = null;
        this.saving = false;
        this.loadPeriods();
      },
      error: () => {
        this.saving = false;
      },
    });
  }

  completePeriod(period: FocusPeriodWithDays): void {
    if (this.saving) return;
    this.saving = true;

    this.api.updateFocusPeriod(period.id, { status: 'completed' }).subscribe({
      next: () => {
        this.saving = false;
        this.loadPeriods();
      },
      error: () => {
        this.saving = false;
      },
    });
  }

  deletePeriod(period: FocusPeriodWithDays): void {
    if (this.saving) return;
    this.saving = true;

    this.api.deleteFocusPeriod(period.id).subscribe({
      next: () => {
        this.saving = false;
        this.loadPeriods();
      },
      error: () => {
        this.saving = false;
      },
    });
  }

  formatDate(dateStr: string): string {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  parseTechniques(raw: string | null): string[] {
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      // Fall through to comma split
    }
    return raw.split(',').map(s => s.trim()).filter(Boolean);
  }
}
