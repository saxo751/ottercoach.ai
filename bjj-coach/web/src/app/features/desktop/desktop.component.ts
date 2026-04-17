import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { environment } from '../../../environments/environment';
import { IconComponent } from '../../components/ui-components/icon/icon.component';

@Component({
  selector: 'app-desktop',
  standalone: true,
  imports: [CommonModule, RouterLink, IconComponent],
  template: `
    <div class="desktop-surface">
      <!-- Left column -->
      <div class="icon-column icon-column--left">
        <a class="desktop-icon" routerLink="/chat">
          <div class="desktop-icon__box">
            <ui-icon name="message-02" />
          </div>
          <span class="desktop-icon__label">coach.chat</span>
        </a>

        <a class="desktop-icon" routerLink="/dashboard">
          <div class="desktop-icon__box">
            <ui-icon name="dashboard-speed-01" />
          </div>
          <span class="desktop-icon__label">stats.dashboard</span>
        </a>

        <a class="desktop-icon" routerLink="/focus">
          <div class="desktop-icon__box">
            <ui-icon name="flag-01" />
          </div>
          <span class="desktop-icon__label">focus.log</span>
        </a>

        <a class="desktop-icon" routerLink="/techniques">
          <div class="desktop-icon__box">
            <ui-icon name="award-01" />
          </div>
          <span class="desktop-icon__label">techniques/</span>
        </a>

        <a class="desktop-icon" routerLink="/ideas">
          <div class="desktop-icon__box">
            <ui-icon name="idea-01" />
          </div>
          <span class="desktop-icon__label">ideas.txt</span>
        </a>
      </div>

      <!-- Right column (admin) -->
      <div class="icon-column icon-column--right" *ngIf="isAdmin">
        <a class="desktop-icon" [href]="adminUrl + '/tables?secret=' + adminSecret" target="_blank">
          <div class="desktop-icon__box desktop-icon__box--admin">
            <ui-icon name="grid" />
          </div>
          <span class="desktop-icon__label">db/tables</span>
        </a>

        <a class="desktop-icon" [href]="adminUrl + '/table/users?secret=' + adminSecret" target="_blank">
          <div class="desktop-icon__box desktop-icon__box--admin">
            <ui-icon name="user-02" />
          </div>
          <span class="desktop-icon__label">db/users</span>
        </a>

        <a class="desktop-icon" [href]="adminUrl + '/table/conversation_history?secret=' + adminSecret" target="_blank">
          <div class="desktop-icon__box desktop-icon__box--admin">
            <ui-icon name="chat-done" />
          </div>
          <span class="desktop-icon__label">db/chats</span>
        </a>

        <a class="desktop-icon" [href]="adminUrl + '/table/training_sessions?secret=' + adminSecret" target="_blank">
          <div class="desktop-icon__box desktop-icon__box--admin">
            <ui-icon name="fire" />
          </div>
          <span class="desktop-icon__label">db/sessions</span>
        </a>
      </div>

      <!-- Mobile mascot -->
      <div class="mobile-mascot">
        <img src="assets/otters/Otter-relaxed-with-arms-crossed.svg" alt="Otter Coach mascot" />
      </div>
    </div>
  `,
  styles: [
    `
      .desktop-surface {
        min-height: calc(100vh - 52px);
        padding: 32px;
        position: relative;
        display: flex;
        justify-content: space-between;
      }
      .icon-column {
        display: flex;
        flex-direction: column;
        gap: 12px;
        width: fit-content;
        position: relative;
        z-index: 2;
      }
      .icon-column--right {
        align-items: flex-end;
      }
      .desktop-icon {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
        padding: 8px 12px;
        cursor: pointer;
        border-radius: 4px;
        text-decoration: none;
        color: var(--color-text);
        transition: background 0.15s ease;
        min-width: 80px;
        max-width: 100px;
      }
      .desktop-icon:hover {
        background: rgba(0, 0, 0, 0.06);
      }
      .desktop-icon__box {
        width: 56px;
        height: 56px;
        border-radius: 14px;
        background: var(--color-surface);
        border: var(--border-subtle);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 28px;
        color: var(--color-accent);
        transition: border-color 0.15s, box-shadow 0.15s;
      }
      .desktop-icon:hover .desktop-icon__box {
        border-color: var(--color-accent);
        box-shadow: 0 2px 8px rgba(217, 119, 87, 0.15);
      }
      .desktop-icon__box--admin {
        color: var(--color-text-muted);
        background: var(--color-dark);
        border-color: #333;
      }
      .desktop-icon:hover .desktop-icon__box--admin {
        color: var(--color-accent);
        border-color: var(--color-accent);
      }
      .desktop-icon__label {
        font-family: var(--font-heading);
        font-size: var(--text-sm);
        font-weight: 500;
        text-align: center;
        line-height: 1.2;
      }
      .mobile-mascot {
        display: none;
      }
      @media (max-width: 960px) {
        .mobile-mascot {
          display: flex;
          justify-content: flex-end;
          padding: 24px 16px 16px 0;
        }
        .mobile-mascot img {
          height: 180px;
        }
      }
      @media (max-width: 768px) {
        .desktop-surface {
          flex-direction: column;
        }
        .icon-column {
          flex-direction: row;
          flex-wrap: wrap;
          justify-content: center;
          width: 100%;
        }
        .icon-column--right {
          align-items: center;
        }
      }
    `,
  ],
})
export class DesktopComponent {
  isAdmin = false;
  adminUrl = '';
  adminSecret = '';

  constructor(private auth: AuthService) {
    const secret = localStorage.getItem('admin_secret');
    this.auth.user$.subscribe((user) => {
      const s = localStorage.getItem('admin_secret');
      if (user?.email === 'saxo@handyhand.dk' && !s) {
        const input = prompt('Admin secret:');
        if (input) {
          localStorage.setItem('admin_secret', input);
        }
      }
      const currentSecret = localStorage.getItem('admin_secret');
      this.isAdmin = user?.email === 'saxo@handyhand.dk' && !!currentSecret;
      if (this.isAdmin) {
        this.adminUrl = `${environment.apiUrl}/admin`;
        this.adminSecret = currentSecret!;
      }
    });
  }
}
