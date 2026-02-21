import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import type { TrainingSession } from '../../shared/models';

@Component({
  selector: 'app-session-history',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="panel">
      <h3 class="panel-subtitle">Recent Sessions</h3>

      <div *ngIf="sessions.length === 0" class="empty-text">
        No training sessions logged yet. Debrief with your coach after training to start tracking.
      </div>

      <div class="session-card" *ngFor="let s of sessions">
        <div class="session-header">
          <span class="date">{{ s.date }}</span>
          <span class="type-badge" *ngIf="s.session_type">{{ s.session_type }}</span>
          <span class="duration" *ngIf="s.duration_minutes">{{ s.duration_minutes }} min</span>
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
    .panel-subtitle {
      font-family: var(--font-body);
      font-size: var(--text-lg);
      font-weight: 600;
      margin: 0 0 12px;
    }
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
    .duration {
      font-family: var(--font-mono);
      font-size: var(--text-xs);
      color: var(--color-text-muted);
      margin-left: auto;
    }
    .detail { font-size: var(--text-sm); margin-bottom: 4px; }
    .note { color: var(--color-text-secondary); }
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
}
