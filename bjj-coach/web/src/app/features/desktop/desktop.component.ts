import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-desktop',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="desktop-surface">
      <div class="icon-grid">
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
      </div>

      <!-- Mascot scene placeholder -->
      <div class="desktop-scene">
        <svg viewBox="0 0 320 200" fill="none" xmlns="http://www.w3.org/2000/svg" class="scene-svg">
          <!-- Mat / floor -->
          <rect x="40" y="140" width="240" height="50" rx="4" fill="#e8e2d6" stroke="#c4bfb3" stroke-width="1.5"/>
          <line x1="80" y1="140" x2="80" y2="190" stroke="#d4cfc5" stroke-width="1"/>
          <line x1="160" y1="140" x2="160" y2="190" stroke="#d4cfc5" stroke-width="1"/>
          <line x1="240" y1="140" x2="240" y2="190" stroke="#d4cfc5" stroke-width="1"/>
          <!-- Otter coach body -->
          <ellipse cx="160" cy="128" rx="28" ry="22" fill="#92400e" opacity="0.8"/>
          <!-- Head -->
          <circle cx="160" cy="98" r="22" fill="#b0703c"/>
          <!-- Ears -->
          <circle cx="143" cy="82" r="7" fill="#b0703c" stroke="#92400e" stroke-width="1.5"/>
          <circle cx="177" cy="82" r="7" fill="#b0703c" stroke="#92400e" stroke-width="1.5"/>
          <!-- Face -->
          <ellipse cx="160" cy="102" rx="12" ry="9" fill="#deb887"/>
          <!-- Eyes -->
          <circle cx="152" cy="95" r="3" fill="#1a1a1a"/>
          <circle cx="168" cy="95" r="3" fill="#1a1a1a"/>
          <circle cx="153" cy="94" r="1" fill="#fff"/>
          <circle cx="169" cy="94" r="1" fill="#fff"/>
          <!-- Nose -->
          <ellipse cx="160" cy="100" rx="3" ry="2" fill="#1a1a1a"/>
          <!-- Smile -->
          <path d="M154 105 Q160 110 166 105" stroke="#1a1a1a" stroke-width="1.5" fill="none" stroke-linecap="round"/>
          <!-- Gi -->
          <path d="M140 115 L140 140 L180 140 L180 115" fill="#f0ece4" stroke="#c4bfb3" stroke-width="1.5"/>
          <line x1="160" y1="115" x2="160" y2="140" stroke="#c4bfb3" stroke-width="1"/>
          <!-- Belt -->
          <rect x="138" y="128" width="44" height="5" rx="2" fill="#3b82f6"/>
          <rect x="156" y="128" width="8" height="5" fill="#3b82f6"/>
          <line x1="164" y1="133" x2="170" y2="140" stroke="#3b82f6" stroke-width="3" stroke-linecap="round"/>
          <line x1="164" y1="133" x2="168" y2="142" stroke="#3b82f6" stroke-width="3" stroke-linecap="round"/>
          <!-- Arms -->
          <line x1="138" y1="120" x2="118" y2="130" stroke="#b0703c" stroke-width="6" stroke-linecap="round"/>
          <line x1="182" y1="120" x2="202" y2="130" stroke="#b0703c" stroke-width="6" stroke-linecap="round"/>
          <!-- "OSS!" text -->
          <text x="210" y="105" font-family="Bricolage Grotesque, sans-serif" font-size="16" font-weight="800" fill="#f5a623" transform="rotate(-8 210 105)">OSS!</text>
        </svg>
      </div>
    </div>
  `,
  styles: [`
    .desktop-surface {
      min-height: 100vh;
      padding: 32px;
      position: relative;
    }
    .icon-grid {
      display: flex;
      flex-direction: column;
      gap: 12px;
      width: fit-content;
      position: relative;
      z-index: 2;
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
      width: 55%;
      max-width: 500px;
      pointer-events: none;
      z-index: 1;
      opacity: 0.7;
    }
    .scene-svg {
      width: 100%;
      height: auto;
    }
    @media (max-width: 768px) {
      .icon-grid {
        flex-direction: row;
        flex-wrap: wrap;
        justify-content: center;
        width: 100%;
      }
      .desktop-scene {
        position: static;
        width: 100%;
        margin-top: 40px;
        opacity: 0.8;
      }
    }
  `],
})
export class DesktopComponent {}
