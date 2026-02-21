import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import type { Position, Technique } from '../../shared/models';

@Component({
  selector: 'app-skill-snapshot',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="panel" *ngIf="positions.length > 0 || techniques.length > 0">
      <h3 class="panel-subtitle">Skill Snapshot</h3>

      <div *ngIf="positions.length > 0">
        <h4 class="section-label">Positions</h4>
        <div class="skill-row" *ngFor="let p of positions">
          <span class="skill-name">{{ p.name }}</span>
          <div class="bar-track">
            <div class="bar-fill" [style.width.%]="(p.confidence_level / 5) * 100"
                 [class]="'level-' + p.confidence_level"></div>
          </div>
          <span class="level-text">{{ p.confidence_level }}/5</span>
        </div>
      </div>

      <div *ngIf="techniques.length > 0">
        <h4 class="section-label">Techniques</h4>
        <div class="skill-row" *ngFor="let t of techniques">
          <span class="skill-name">{{ t.name }}</span>
          <div class="bar-track">
            <div class="bar-fill" [style.width.%]="(t.confidence_level / 5) * 100"
                 [class]="'level-' + t.confidence_level"></div>
          </div>
          <span class="level-text">{{ t.confidence_level }}/5</span>
        </div>
      </div>
    </div>

    <div class="panel empty" *ngIf="positions.length === 0 && techniques.length === 0">
      <h3 class="panel-subtitle">Skill Snapshot</h3>
      <p class="empty-text">No skills tracked yet. Chat with your coach to start building your profile.</p>
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
    .section-label {
      font-size: var(--text-xs);
      font-weight: 600;
      color: var(--color-text-muted);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin: 14px 0 6px;
    }
    .empty-text { color: var(--color-text-muted); font-size: var(--text-sm); }
    .skill-row { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
    .skill-name {
      width: 130px;
      font-size: var(--text-sm);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .bar-track {
      flex: 1;
      height: 8px;
      background: var(--color-desktop-darker);
      border-radius: 4px;
      overflow: hidden;
    }
    .bar-fill { height: 100%; border-radius: 4px; transition: width 0.3s; }
    .level-1 { background: var(--color-danger); }
    .level-2 { background: #f97316; }
    .level-3 { background: var(--color-accent); }
    .level-4 { background: var(--color-success); }
    .level-5 { background: #10b981; }
    .level-text {
      font-family: var(--font-mono);
      font-size: var(--text-xs);
      color: var(--color-text-muted);
      width: 28px;
      text-align: right;
    }
  `],
})
export class SkillSnapshotComponent {
  @Input() positions: Position[] = [];
  @Input() techniques: Technique[] = [];
}
