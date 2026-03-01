import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import type { TrainingSession } from '../../shared/models';

@Component({
  selector: 'app-session-history',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="panel">
      <div class="panel-header">
        <h3 class="panel-subtitle">Recent Sessions</h3>
        <button class="add-btn" (click)="addSession.emit()">+ Add Session</button>
      </div>

      <div *ngIf="sessions.length === 0" class="empty-text">
        No training sessions logged yet. Debrief with your coach after training to start tracking.
      </div>

      <div class="session-card" *ngFor="let s of sessions">
        <div class="session-header">
          <span class="date">{{ s.date }}</span>
          <span class="type-badge" *ngIf="s.session_type">{{ s.session_type }}</span>
          <span class="focus-badge" *ngIf="s.focus_name">{{ s.focus_name }}</span>
          <span class="duration" *ngIf="s.duration_minutes">{{ s.duration_minutes }} min</span>
          <span class="card-actions">
            <button class="icon-btn" title="Edit" (click)="editSession.emit(s)">&#9998;</button>
            <button class="icon-btn icon-btn--danger" title="Delete" (click)="confirmDelete(s)">&#128465;</button>
          </span>
        </div>
        <div class="session-body">
          <div *ngIf="s.wins" class="detail">
            <strong>Wins:</strong> {{ s.wins }}
          </div>
          <div *ngIf="s.struggles" class="detail">
            <strong>Struggles:</strong> {{ s.struggles }}
          </div>
          <div *ngIf="s.rolling_notes" class="detail note">
            {{ s.rolling_notes }}
          </div>
        </div>
        <div class="technique-chips" *ngIf="parseTechniques(s.techniques_worked) as techs">
          <div *ngIf="techs.drilled.length > 0" class="technique-row">
            <span class="technique-label">Drilled:</span>
            <span class="technique-chip" *ngFor="let t of techs.drilled">{{ t }}</span>
          </div>
          <div *ngIf="techs.sparring.length > 0" class="technique-row">
            <span class="technique-label">Sparring:</span>
            <span class="technique-chip technique-chip--sparring" *ngFor="let t of techs.sparring">{{ t }}</span>
          </div>
        </div>
        <div class="energy" *ngIf="s.energy_level">
          Energy: {{ '●'.repeat(s.energy_level) }}{{ '○'.repeat(5 - s.energy_level) }}
        </div>
      </div>
    </div>
  `,
  styles: [`
    .panel {
      background: var(--color-surface);
      border: var(--border-subtle);
      border-radius: 6px;
      padding: 16px;
    }
    .panel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }
    .panel-subtitle {
      font-family: var(--font-body);
      font-size: var(--text-lg);
      font-weight: 600;
      margin: 0;
    }
    .add-btn {
      font-family: var(--font-body);
      font-size: var(--text-xs);
      font-weight: 600;
      background: var(--color-accent);
      color: var(--color-accent-text);
      border: 2px solid var(--color-text);
      border-radius: 6px;
      padding: 4px 12px;
      cursor: pointer;
      transition: background 0.15s;
    }
    .add-btn:hover { background: var(--color-accent-hover); }
    .empty-text { color: var(--color-text-muted); font-size: var(--text-sm); }
    .session-card {
      border: var(--border-subtle);
      border-radius: 6px;
      padding: 12px;
      margin-bottom: 10px;
      background: var(--color-surface-muted);
    }
    .session-header {
      display: flex;
      gap: 10px;
      align-items: center;
      margin-bottom: 8px;
    }
    .date {
      font-family: var(--font-mono);
      font-weight: 500;
      font-size: var(--text-sm);
    }
    .type-badge {
      background: var(--color-accent);
      color: var(--color-accent-text);
      font-size: var(--text-xs);
      padding: 2px 8px;
      border-radius: 4px;
      text-transform: uppercase;
      font-weight: 600;
    }
    .focus-badge {
      background: var(--color-surface);
      border: 1px solid var(--color-accent);
      color: var(--color-accent);
      font-size: var(--text-xs);
      padding: 2px 8px;
      border-radius: 4px;
      font-weight: 500;
    }
    .duration {
      font-family: var(--font-mono);
      font-size: var(--text-xs);
      color: var(--color-text-muted);
    }
    .card-actions {
      margin-left: auto;
      display: flex;
      gap: 4px;
    }
    .icon-btn {
      background: none;
      border: none;
      cursor: pointer;
      font-size: 14px;
      padding: 2px 4px;
      border-radius: 3px;
      color: var(--color-text-muted);
      transition: color 0.1s, background 0.1s;
    }
    .icon-btn:hover { color: var(--color-text); background: var(--color-desktop-darker); }
    .icon-btn--danger:hover { color: var(--color-danger); }
    .detail { font-size: var(--text-sm); margin-bottom: 4px; }
    .note { color: var(--color-text-secondary); }
    .technique-chips {
      display: flex;
      flex-direction: column;
      gap: 4px;
      margin-top: 6px;
    }
    .technique-row {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 4px;
    }
    .technique-label {
      font-size: var(--text-xs);
      font-weight: 600;
      color: var(--color-text-muted);
    }
    .technique-chip {
      font-size: 10px;
      font-weight: 600;
      padding: 1px 6px;
      border-radius: 3px;
      background: var(--color-accent);
      color: var(--color-accent-text);
    }
    .technique-chip--sparring {
      background: var(--color-surface);
      color: var(--color-accent);
      border: 1px solid var(--color-accent);
    }
    .energy {
      font-family: var(--font-mono);
      font-size: var(--text-xs);
      color: var(--color-text-muted);
      margin-top: 6px;
    }
  `],
})
export class SessionHistoryComponent {
  @Input() sessions: TrainingSession[] = [];
  @Output() addSession = new EventEmitter<void>();
  @Output() editSession = new EventEmitter<TrainingSession>();
  @Output() deleteSession = new EventEmitter<TrainingSession>();

  parseTechniques(raw: string | null): { drilled: string[]; sparring: string[] } | null {
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && (parsed.drilled || parsed.sparring)) {
        const drilled = Array.isArray(parsed.drilled) ? parsed.drilled : [];
        const sparring = Array.isArray(parsed.sparring) ? parsed.sparring : [];
        if (drilled.length === 0 && sparring.length === 0) return null;
        return { drilled, sparring };
      }
    } catch {}
    // Legacy free text — show as drilled
    return raw.trim() ? { drilled: [raw], sparring: [] } : null;
  }

  confirmDelete(session: TrainingSession): void {
    if (confirm(`Delete session from ${session.date}?`)) {
      this.deleteSession.emit(session);
    }
  }
}
