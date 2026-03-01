import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import type { TrainingSession, Technique } from '../../shared/models';
import { TechniquePickerComponent } from '../../shared/components/technique-picker.component';

@Component({
  selector: 'app-session-form',
  standalone: true,
  imports: [CommonModule, FormsModule, TechniquePickerComponent],
  template: `
    <div class="overlay" (click)="cancel.emit()">
      <div class="modal" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>{{ session ? 'Edit Session' : 'Add Session' }}</h3>
          <button class="close-btn" (click)="cancel.emit()">&times;</button>
        </div>

        <div class="modal-body">
          <label class="field">
            <span class="label">Date *</span>
            <input type="date" [(ngModel)]="form.date" required />
          </label>

          <label class="field">
            <span class="label">Type</span>
            <select [(ngModel)]="form.session_type">
              <option [ngValue]="null">—</option>
              <option value="gi">Gi</option>
              <option value="nogi">No-Gi</option>
              <option value="open_mat">Open Mat</option>
              <option value="competition">Competition</option>
              <option value="private">Private</option>
            </select>
          </label>

          <label class="field">
            <span class="label">Duration (min)</span>
            <input type="number" [(ngModel)]="form.duration_minutes" min="1" max="600" placeholder="e.g. 90" />
          </label>

          <div class="field">
            <span class="label">Energy Level</span>
            <div class="energy-picker">
              <span
                *ngFor="let n of [1,2,3,4,5]"
                class="energy-dot"
                [class.active]="form.energy_level !== null && n <= form.energy_level!"
                (click)="setEnergy(n)"
              >&#9679;</span>
            </div>
          </div>

          <app-technique-picker
            label="Techniques Drilled"
            [selected]="techniques_drilled"
            [userTechniques]="userTechniques"
            (selectedChange)="techniques_drilled = $event"
          ></app-technique-picker>

          <app-technique-picker
            label="Techniques Used in Sparring"
            [selected]="techniques_sparring"
            [userTechniques]="userTechniques"
            (selectedChange)="techniques_sparring = $event"
          ></app-technique-picker>

          <label class="field">
            <span class="label">Wins</span>
            <textarea [(ngModel)]="form.wins" rows="2" placeholder="What went well?"></textarea>
          </label>

          <label class="field">
            <span class="label">Struggles</span>
            <textarea [(ngModel)]="form.struggles" rows="2" placeholder="What was tough?"></textarea>
          </label>

          <label class="field">
            <span class="label">Rolling Notes</span>
            <textarea [(ngModel)]="form.rolling_notes" rows="2" placeholder="Observations, details..."></textarea>
          </label>
        </div>

        <div class="modal-footer">
          <button class="btn-secondary" (click)="cancel.emit()">Cancel</button>
          <button class="btn-primary" (click)="onSave()" [disabled]="!form.date">Save</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 16px;
    }
    .modal {
      background: var(--color-surface);
      border: var(--border-medium);
      border-radius: 8px;
      box-shadow: var(--shadow-window-active);
      width: 100%;
      max-width: 480px;
      max-height: 90vh;
      display: flex;
      flex-direction: column;
    }
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      border-bottom: var(--border-subtle);
      background: var(--color-titlebar);
    }
    .modal-header h3 {
      font-family: var(--font-body);
      font-size: var(--text-lg);
      font-weight: 600;
      margin: 0;
    }
    .close-btn {
      background: none;
      border: none;
      font-size: 22px;
      cursor: pointer;
      color: var(--color-text-muted);
      line-height: 1;
      padding: 0 4px;
    }
    .close-btn:hover { color: var(--color-text); }
    .modal-body {
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      overflow-y: auto;
    }
    .field {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .label {
      font-size: var(--text-xs);
      font-weight: 600;
      color: var(--color-text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }
    input, select, textarea {
      font-family: var(--font-body);
      font-size: var(--text-sm);
      padding: 8px 10px;
      border: var(--border-subtle);
      border-radius: 4px;
      background: var(--color-surface-muted);
      color: var(--color-text);
      outline: none;
      transition: border-color 0.15s;
    }
    input:focus, select:focus, textarea:focus {
      border-color: var(--color-accent);
    }
    textarea { resize: vertical; }
    .energy-picker {
      display: flex;
      gap: 8px;
      padding: 4px 0;
    }
    .energy-dot {
      font-size: 20px;
      cursor: pointer;
      color: var(--color-text-muted);
      transition: color 0.1s;
      user-select: none;
    }
    .energy-dot.active { color: var(--color-accent); }
    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      padding: 12px 16px;
      border-top: var(--border-subtle);
    }
    .btn-primary, .btn-secondary {
      font-family: var(--font-body);
      font-size: var(--text-sm);
      font-weight: 600;
      padding: 8px 20px;
      border-radius: 6px;
      cursor: pointer;
      transition: background 0.15s;
    }
    .btn-primary {
      background: var(--color-accent);
      color: var(--color-accent-text);
      border: 2px solid var(--color-text);
    }
    .btn-primary:hover:not(:disabled) { background: var(--color-accent-hover); }
    .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-secondary {
      background: var(--color-surface);
      color: var(--color-text);
      border: var(--border-subtle);
    }
    .btn-secondary:hover { background: var(--color-surface-muted); }
  `],
})
export class SessionFormComponent implements OnInit {
  @Input() session: TrainingSession | null = null;
  @Input() userTechniques: Technique[] = [];
  @Output() save = new EventEmitter<Partial<TrainingSession>>();
  @Output() cancel = new EventEmitter<void>();

  techniques_drilled: string[] = [];
  techniques_sparring: string[] = [];

  form: {
    date: string;
    session_type: string | null;
    duration_minutes: number | null;
    energy_level: number | null;
    wins: string;
    struggles: string;
    rolling_notes: string;
  } = {
    date: '',
    session_type: null,
    duration_minutes: null,
    energy_level: null,
    wins: '',
    struggles: '',
    rolling_notes: '',
  };

  ngOnInit(): void {
    if (this.session) {
      this.form = {
        date: this.session.date,
        session_type: this.session.session_type ?? null,
        duration_minutes: this.session.duration_minutes ?? null,
        energy_level: this.session.energy_level ?? null,
        wins: this.session.wins ?? '',
        struggles: this.session.struggles ?? '',
        rolling_notes: this.session.rolling_notes ?? '',
      };

      // Parse techniques_worked
      if (this.session.techniques_worked) {
        try {
          const parsed = JSON.parse(this.session.techniques_worked);
          if (parsed && typeof parsed === 'object' && (parsed.drilled || parsed.sparring)) {
            this.techniques_drilled = Array.isArray(parsed.drilled) ? parsed.drilled : [];
            this.techniques_sparring = Array.isArray(parsed.sparring) ? parsed.sparring : [];
          } else {
            // Legacy: treat as single drilled entry
            this.techniques_drilled = [this.session.techniques_worked];
          }
        } catch {
          // Legacy free text: treat as single drilled entry
          if (this.session.techniques_worked.trim()) {
            this.techniques_drilled = [this.session.techniques_worked];
          }
        }
      }
    } else {
      // Default to today
      this.form.date = new Date().toISOString().slice(0, 10);
    }
  }

  setEnergy(n: number): void {
    this.form.energy_level = this.form.energy_level === n ? null : n;
  }

  onSave(): void {
    if (!this.form.date) return;

    const hasTechniques = this.techniques_drilled.length > 0 || this.techniques_sparring.length > 0;
    const techniques_worked = hasTechniques
      ? JSON.stringify({ drilled: this.techniques_drilled, sparring: this.techniques_sparring })
      : null;

    this.save.emit({
      date: this.form.date,
      session_type: this.form.session_type || null,
      duration_minutes: this.form.duration_minutes || null,
      energy_level: this.form.energy_level,
      wins: this.form.wins.trim() || null,
      struggles: this.form.struggles.trim() || null,
      rolling_notes: this.form.rolling_notes.trim() || null,
      techniques_worked,
    } as Partial<TrainingSession>);
  }
}
