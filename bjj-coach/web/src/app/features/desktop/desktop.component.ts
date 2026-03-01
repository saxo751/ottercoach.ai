import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-desktop',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="desktop-surface">
      <!-- Left column -->
      <div class="icon-column icon-column--left">
        <a class="desktop-icon" routerLink="/chat">
          <div class="desktop-icon__image icon-chat">
            <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="4" y="6" width="40" height="30" rx="4" fill="#f5a623" stroke="#1a1a1a" stroke-width="2"/>
              <rect x="8" y="12" width="20" height="3" rx="1.5" fill="#fff" opacity="0.7"/>
              <rect x="8" y="18" width="14" height="3" rx="1.5" fill="#fff" opacity="0.5"/>
              <rect x="8" y="24" width="24" height="3" rx="1.5" fill="#fff" opacity="0.3"/>
              <polygon points="14,36 22,36 18,42" fill="#f5a623" stroke="#1a1a1a" stroke-width="2" stroke-linejoin="round"/>
            </svg>
          </div>
          <span class="desktop-icon__label">coach.chat</span>
        </a>

        <a class="desktop-icon" routerLink="/dashboard">
          <div class="desktop-icon__image icon-dashboard">
            <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="4" y="4" width="40" height="40" rx="4" fill="#e8e2d6" stroke="#1a1a1a" stroke-width="2"/>
              <rect x="9" y="10" width="10" height="14" rx="2" fill="#f5a623"/>
              <rect x="9" y="28" width="10" height="8" rx="2" fill="#c4bfb3"/>
              <rect x="23" y="10" width="16" height="8" rx="2" fill="#c4bfb3"/>
              <rect x="23" y="22" width="16" height="14" rx="2" fill="#3b82f6" opacity="0.6"/>
              <rect x="26" y="26" width="10" height="2" rx="1" fill="#fff" opacity="0.6"/>
              <rect x="26" y="30" width="7" height="2" rx="1" fill="#fff" opacity="0.4"/>
            </svg>
          </div>
          <span class="desktop-icon__label">stats.dashboard</span>
        </a>

        <a class="desktop-icon" routerLink="/focus">
          <div class="desktop-icon__image icon-focus">
            <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="24" cy="24" r="20" stroke="#1a1a1a" stroke-width="2" fill="#faf8f4"/>
              <circle cx="24" cy="24" r="14" stroke="#f5a623" stroke-width="2" fill="none"/>
              <circle cx="24" cy="24" r="8" stroke="#f5a623" stroke-width="2" fill="none"/>
              <circle cx="24" cy="24" r="3" fill="#f5a623"/>
              <line x1="24" y1="2" x2="24" y2="10" stroke="#1a1a1a" stroke-width="2" stroke-linecap="round"/>
              <line x1="24" y1="38" x2="24" y2="46" stroke="#1a1a1a" stroke-width="2" stroke-linecap="round"/>
              <line x1="2" y1="24" x2="10" y2="24" stroke="#1a1a1a" stroke-width="2" stroke-linecap="round"/>
              <line x1="38" y1="24" x2="46" y2="24" stroke="#1a1a1a" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </div>
          <span class="desktop-icon__label">focus.log</span>
        </a>

        <a class="desktop-icon" routerLink="/techniques">
          <div class="desktop-icon__image icon-techniques">
            <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="8" y="2" width="32" height="44" rx="3" fill="#faf8f4" stroke="#1a1a1a" stroke-width="2"/>
              <rect x="13" y="8" width="22" height="3" rx="1.5" fill="#1a1a1a" opacity="0.7"/>
              <rect x="13" y="14" width="18" height="2" rx="1" fill="#c4bfb3"/>
              <rect x="13" y="19" width="22" height="2" rx="1" fill="#c4bfb3"/>
              <rect x="13" y="24" width="15" height="2" rx="1" fill="#c4bfb3"/>
              <rect x="13" y="30" width="22" height="3" rx="1.5" fill="#8b5cf6" opacity="0.5"/>
              <rect x="13" y="36" width="18" height="2" rx="1" fill="#c4bfb3"/>
              <polyline points="6,6 6,2 8,2" stroke="#1a1a1a" stroke-width="2" fill="none" stroke-linecap="round"/>
            </svg>
          </div>
          <span class="desktop-icon__label">techniques/</span>
        </a>

        <a class="desktop-icon" routerLink="/ideas">
          <div class="desktop-icon__image icon-ideas">
            <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="6" y="4" width="36" height="40" rx="3" fill="#faf8f4" stroke="#1a1a1a" stroke-width="2"/>
              <rect x="11" y="10" width="26" height="3" rx="1.5" fill="#1a1a1a" opacity="0.7"/>
              <rect x="11" y="16" width="20" height="2" rx="1" fill="#c4bfb3"/>
              <rect x="11" y="21" width="24" height="2" rx="1" fill="#c4bfb3"/>
              <rect x="11" y="26" width="16" height="2" rx="1" fill="#c4bfb3"/>
              <circle cx="35" cy="34" r="10" fill="#f5a623" stroke="#1a1a1a" stroke-width="1.5"/>
              <path d="M35 28 L35 32 Q35 34 33 35 L33 37 L37 37 L37 35 Q35 34 35 32 Z" fill="#fff" opacity="0.85"/>
              <rect x="32.5" y="38" width="5" height="2" rx="1" fill="#fff" opacity="0.6"/>
            </svg>
          </div>
          <span class="desktop-icon__label">ideas.txt</span>
        </a>
      </div>

      <!-- Right column (admin) -->
      <div class="icon-column icon-column--right" *ngIf="isAdmin">
        <a
          class="desktop-icon"
          [href]="adminUrl + '/tables?secret=' + adminSecret"
          target="_blank"
        >
          <div class="desktop-icon__image icon-admin">
            <svg
              viewBox="0 0 48 48"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect
                x="4"
                y="8"
                width="40"
                height="32"
                rx="4"
                fill="#1a1a1a"
                stroke="#333"
                stroke-width="2"
              />
              <rect
                x="8"
                y="12"
                width="32"
                height="4"
                rx="1"
                fill="#f5a623"
                opacity="0.8"
              />
              <rect x="8" y="20" width="32" height="2" rx="1" fill="#666" />
              <rect x="8" y="26" width="32" height="2" rx="1" fill="#666" />
              <rect x="8" y="32" width="32" height="2" rx="1" fill="#666" />
            </svg>
          </div>
          <span class="desktop-icon__label">db/tables</span>
        </a>

        <a
          class="desktop-icon"
          [href]="adminUrl + '/table/users?secret=' + adminSecret"
          target="_blank"
        >
          <div class="desktop-icon__image icon-admin">
            <svg
              viewBox="0 0 48 48"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect
                x="4"
                y="8"
                width="40"
                height="32"
                rx="4"
                fill="#1a1a1a"
                stroke="#333"
                stroke-width="2"
              />
              <circle cx="20" cy="22" r="6" fill="#3b82f6" opacity="0.7" />
              <path d="M10 36 Q20 28 30 36" fill="#3b82f6" opacity="0.4" />
              <rect x="32" y="18" width="8" height="2" rx="1" fill="#666" />
              <rect x="32" y="24" width="8" height="2" rx="1" fill="#666" />
              <rect x="32" y="30" width="8" height="2" rx="1" fill="#666" />
            </svg>
          </div>
          <span class="desktop-icon__label">db/users</span>
        </a>

        <a
          class="desktop-icon"
          [href]="
            adminUrl + '/table/conversation_history?secret=' + adminSecret
          "
          target="_blank"
        >
          <div class="desktop-icon__image icon-admin">
            <svg
              viewBox="0 0 48 48"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect
                x="4"
                y="8"
                width="40"
                height="32"
                rx="4"
                fill="#1a1a1a"
                stroke="#333"
                stroke-width="2"
              />
              <rect
                x="10"
                y="14"
                width="18"
                height="3"
                rx="1.5"
                fill="#8b5cf6"
                opacity="0.6"
              />
              <rect
                x="20"
                y="21"
                width="18"
                height="3"
                rx="1.5"
                fill="#f5a623"
                opacity="0.6"
              />
              <rect
                x="10"
                y="28"
                width="18"
                height="3"
                rx="1.5"
                fill="#8b5cf6"
                opacity="0.6"
              />
              <rect
                x="20"
                y="35"
                width="14"
                height="3"
                rx="1.5"
                fill="#f5a623"
                opacity="0.6"
              />
            </svg>
          </div>
          <span class="desktop-icon__label">db/chats</span>
        </a>

        <a
          class="desktop-icon"
          [href]="adminUrl + '/table/training_sessions?secret=' + adminSecret"
          target="_blank"
        >
          <div class="desktop-icon__image icon-admin">
            <svg
              viewBox="0 0 48 48"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect
                x="4"
                y="8"
                width="40"
                height="32"
                rx="4"
                fill="#1a1a1a"
                stroke="#333"
                stroke-width="2"
              />
              <rect
                x="10"
                y="30"
                width="6"
                height="6"
                fill="#16a34a"
                opacity="0.7"
              />
              <rect
                x="18"
                y="24"
                width="6"
                height="12"
                fill="#16a34a"
                opacity="0.7"
              />
              <rect
                x="26"
                y="18"
                width="6"
                height="18"
                fill="#16a34a"
                opacity="0.7"
              />
              <rect
                x="34"
                y="14"
                width="6"
                height="22"
                fill="#16a34a"
                opacity="0.7"
              />
            </svg>
          </div>
          <span class="desktop-icon__label">db/sessions</span>
        </a>
      </div>

      <!-- Mascot scene — otter base SVG -->
      <div class="desktop-scene">
        <img
          src="assets/otters/otter_base.svg"
          alt="BJJ Coach Otter"
          class="scene-img"
        />
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
      .desktop-icon__image {
        width: 48px;
        height: 48px;
      }
      .desktop-icon__image svg {
        width: 100%;
        height: 100%;
      }
      .desktop-icon__label {
        font-family: var(--font-body);
        font-size: var(--text-sm);
        font-weight: 500;
        text-align: center;
        line-height: 1.2;
      }
      .desktop-scene {
        position: fixed;
        bottom: 0;
        right: 0;
        max-height: 200px;
        max-width: 320px;
        pointer-events: none;
        z-index: 1;
        opacity: 0.7;
      }
      .scene-img {
        width: auto;
        height: 100%;
        max-height: 200px;
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
        .desktop-scene {
          position: fixed;
          bottom: 0;
          right: 0;
          max-height: 160px;
          max-width: 160px;
          margin-top: 0;
          opacity: 0.8;
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
