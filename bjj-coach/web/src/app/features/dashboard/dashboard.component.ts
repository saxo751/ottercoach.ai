import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { SkillSnapshotComponent } from './skill-snapshot.component';
import { SessionHistoryComponent } from './session-history.component';
import type { User, Position, Technique, TrainingSession, FocusPeriod } from '../../shared/models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, SkillSnapshotComponent, SessionHistoryComponent],
  template: `
    <div class="window-container">
      <div class="retro-window dashboard-window">
        <!-- Title bar -->
        <div class="retro-window__titlebar">
          <div class="retro-window__controls">
            <a routerLink="/" class="retro-window__dot retro-window__dot--close"></a>
            <span class="retro-window__dot retro-window__dot--minimize"></span>
            <span class="retro-window__dot retro-window__dot--maximize"></span>
          </div>
          <span class="retro-window__title">stats.dashboard</span>
        </div>

        <!-- Body -->
        <div class="retro-window__body dashboard-body">
          <!-- Profile card -->
          <div class="panel" *ngIf="profile">
            <h2 class="panel-title">{{ profile.name || 'BJJ Athlete' }}</h2>
            <div class="meta">
              <span *ngIf="profile.belt_rank" class="belt-badge" [attr.data-belt]="profile.belt_rank">
                {{ profile.belt_rank }} belt
              </span>
              <span *ngIf="profile.experience_months" class="meta-item">
                {{ profile.experience_months }} mo training
              </span>
            </div>
            <div class="details" *ngIf="profile.preferred_game_style || profile.goals || profile.current_focus_area">
              <div *ngIf="profile.preferred_game_style"><strong>Style:</strong> {{ profile.preferred_game_style }}</div>
              <div *ngIf="profile.goals"><strong>Goals:</strong> {{ profile.goals }}</div>
              <div *ngIf="profile.current_focus_area"><strong>Current Focus:</strong> {{ profile.current_focus_area }}</div>
            </div>
          </div>

          <!-- Focus period -->
          <div class="panel focus-panel" *ngIf="focus">
            <h3 class="panel-subtitle">Active Focus: {{ focus.name }}</h3>
            <p *ngIf="focus.description" class="focus-desc">{{ focus.description }}</p>
            <div class="focus-dates">
              Started {{ focus.start_date }}
              <span *ngIf="focus.end_date"> &middot; Ends {{ focus.end_date }}</span>
            </div>
          </div>

          <!-- Empty state -->
          <div *ngIf="!profile" class="panel empty-state">
            <h2 class="panel-title">Welcome</h2>
            <p>Start chatting with your coach to build your training profile.</p>
            <a routerLink="/chat" class="btn-primary">Open coach.chat</a>
          </div>

          <app-skill-snapshot [positions]="positions" [techniques]="techniques"></app-skill-snapshot>
          <app-session-history [sessions]="sessions"></app-session-history>
        </div>

        <!-- Status bar -->
        <div class="retro-window__statusbar">
          {{ positions.length }} positions &middot; {{ techniques.length }} techniques &middot; {{ sessions.length }} sessions
        </div>
      </div>
    </div>
  `,
  styles: [`
    .window-container {
      display: flex;
      justify-content: center;
      padding: 24px 16px;
      min-height: calc(100vh - 52px);
    }
    .dashboard-window {
      width: 100%;
      max-width: 720px;
      min-height: calc(100vh - 52px - 48px);
    }
    .dashboard-body {
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 16px;
      background: var(--color-surface-muted);
    }
    .panel {
      background: var(--color-surface);
      border: var(--border-subtle);
      border-radius: 6px;
      padding: 16px;
    }
    .panel-title {
      font-family: var(--font-display);
      font-size: var(--text-xl);
      font-weight: 800;
      margin: 0 0 8px;
    }
    .panel-subtitle {
      font-family: var(--font-body);
      font-size: var(--text-lg);
      font-weight: 600;
      margin: 0 0 6px;
    }
    .meta {
      display: flex;
      gap: 12px;
      font-size: var(--text-sm);
      color: var(--color-text-secondary);
      margin-bottom: 12px;
      align-items: center;
    }
    .belt-badge {
      font-weight: 600;
      text-transform: capitalize;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: var(--text-xs);
    }
    [data-belt="white"] { background: var(--color-belt-white); color: var(--color-text); border: var(--border-subtle); }
    [data-belt="blue"] { background: var(--color-belt-blue); color: #fff; }
    [data-belt="purple"] { background: var(--color-belt-purple); color: #fff; }
    [data-belt="brown"] { background: var(--color-belt-brown); color: #fff; }
    [data-belt="black"] { background: var(--color-belt-black); color: #fff; }
    .details { font-size: var(--text-sm); line-height: 1.6; }
    .details div { margin-bottom: 2px; }
    .focus-panel { border-left: 3px solid var(--color-accent); }
    .focus-desc { font-size: var(--text-sm); color: var(--color-text-secondary); margin: 0 0 4px; }
    .focus-dates { font-family: var(--font-mono); font-size: var(--text-xs); color: var(--color-text-muted); }
    .empty-state { text-align: center; padding: 32px; }
    .empty-state p { color: var(--color-text-muted); margin-bottom: 16px; }
    .btn-primary {
      display: inline-block;
      background: var(--color-accent);
      color: var(--color-accent-text);
      border: 2px solid var(--color-text);
      border-radius: 6px;
      padding: 8px 20px;
      font-weight: 600;
      font-size: var(--text-sm);
      text-decoration: none;
      transition: background 0.15s;
    }
    .btn-primary:hover { background: var(--color-accent-hover); }
    .meta-item { font-family: var(--font-mono); font-size: var(--text-xs); }
  `],
})
export class DashboardComponent implements OnInit {
  profile: User | null = null;
  positions: Position[] = [];
  techniques: Technique[] = [];
  sessions: TrainingSession[] = [];
  focus: FocusPeriod | null = null;

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.api.getProfile().subscribe({
      next: (p) => this.profile = p,
      error: () => {},
    });
    this.api.getPositions().subscribe({
      next: (p) => this.positions = p,
      error: () => {},
    });
    this.api.getTechniques().subscribe({
      next: (t) => this.techniques = t,
      error: () => {},
    });
    this.api.getSessions().subscribe({
      next: (s) => this.sessions = s,
      error: () => {},
    });
    this.api.getActiveFocus().subscribe({
      next: (f) => this.focus = f,
      error: () => {},
    });
  }
}
