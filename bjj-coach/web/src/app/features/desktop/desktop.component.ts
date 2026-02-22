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

      <!-- Admin: DB browser (only for admin user) -->
      <div class="icon-grid admin-grid" *ngIf="isAdmin">
        <a class="desktop-icon" [href]="adminUrl + '/tables?secret=' + adminSecret" target="_blank">
          <div class="desktop-icon__image icon-admin">
            <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="4" y="8" width="40" height="32" rx="4" fill="#1a1a1a" stroke="#333" stroke-width="2"/>
              <rect x="8" y="12" width="32" height="4" rx="1" fill="#f5a623" opacity="0.8"/>
              <rect x="8" y="20" width="32" height="2" rx="1" fill="#666"/>
              <rect x="8" y="26" width="32" height="2" rx="1" fill="#666"/>
              <rect x="8" y="32" width="32" height="2" rx="1" fill="#666"/>
            </svg>
          </div>
          <span class="desktop-icon__label">db/tables</span>
        </a>

        <a class="desktop-icon" [href]="adminUrl + '/table/users?secret=' + adminSecret" target="_blank">
          <div class="desktop-icon__image icon-admin">
            <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="4" y="8" width="40" height="32" rx="4" fill="#1a1a1a" stroke="#333" stroke-width="2"/>
              <circle cx="20" cy="22" r="6" fill="#3b82f6" opacity="0.7"/>
              <path d="M10 36 Q20 28 30 36" fill="#3b82f6" opacity="0.4"/>
              <rect x="32" y="18" width="8" height="2" rx="1" fill="#666"/>
              <rect x="32" y="24" width="8" height="2" rx="1" fill="#666"/>
              <rect x="32" y="30" width="8" height="2" rx="1" fill="#666"/>
            </svg>
          </div>
          <span class="desktop-icon__label">db/users</span>
        </a>

        <a class="desktop-icon" [href]="adminUrl + '/table/conversation_history?secret=' + adminSecret" target="_blank">
          <div class="desktop-icon__image icon-admin">
            <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="4" y="8" width="40" height="32" rx="4" fill="#1a1a1a" stroke="#333" stroke-width="2"/>
              <rect x="10" y="14" width="18" height="3" rx="1.5" fill="#8b5cf6" opacity="0.6"/>
              <rect x="20" y="21" width="18" height="3" rx="1.5" fill="#f5a623" opacity="0.6"/>
              <rect x="10" y="28" width="18" height="3" rx="1.5" fill="#8b5cf6" opacity="0.6"/>
              <rect x="20" y="35" width="14" height="3" rx="1.5" fill="#f5a623" opacity="0.6"/>
            </svg>
          </div>
          <span class="desktop-icon__label">db/chats</span>
        </a>

        <a class="desktop-icon" [href]="adminUrl + '/table/training_sessions?secret=' + adminSecret" target="_blank">
          <div class="desktop-icon__image icon-admin">
            <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="4" y="8" width="40" height="32" rx="4" fill="#1a1a1a" stroke="#333" stroke-width="2"/>
              <rect x="10" y="30" width="6" height="6" fill="#16a34a" opacity="0.7"/>
              <rect x="18" y="24" width="6" height="12" fill="#16a34a" opacity="0.7"/>
              <rect x="26" y="18" width="6" height="18" fill="#16a34a" opacity="0.7"/>
              <rect x="34" y="14" width="6" height="22" fill="#16a34a" opacity="0.7"/>
            </svg>
          </div>
          <span class="desktop-icon__label">db/sessions</span>
        </a>
      </div>

      <!-- Mascot scene — v2 otter, thumbs up -->
      <div class="desktop-scene">
        <svg viewBox="0 0 320 280" fill="none" xmlns="http://www.w3.org/2000/svg" class="scene-svg">
          <defs>
            <linearGradient id="beltShine" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="white"/>
              <stop offset="100%" stop-color="transparent"/>
            </linearGradient>
          </defs>

          <!-- Mat / floor -->
          <rect x="30" y="232" width="260" height="40" rx="4" fill="#e8e2d6" stroke="#c4bfb3" stroke-width="1.5"/>
          <line x1="90" y1="232" x2="90" y2="272" stroke="#d4cfc5" stroke-width="1"/>
          <line x1="160" y1="232" x2="160" y2="272" stroke="#d4cfc5" stroke-width="1"/>
          <line x1="230" y1="232" x2="230" y2="272" stroke="#d4cfc5" stroke-width="1"/>

          <!-- Speech bubble -->
          <rect x="198" y="38" width="76" height="36" rx="12" fill="rgba(196,162,78,0.15)"/>
          <path d="M212 74 L206 85 L222 74" fill="rgba(196,162,78,0.15)"/>
          <text x="236" y="61" text-anchor="middle" font-family="Bricolage Grotesque, sans-serif" font-size="15" fill="#C4A24E" font-weight="600">OSS!</text>

          <!-- Ground shadow -->
          <ellipse cx="155" cy="230" rx="45" ry="9" fill="rgba(0,0,0,0.12)"/>

          <!-- Thick otter tail — tapered rudder -->
          <path d="M122 210 Q88 224 75 242 Q71 249 78 245 Q96 234 128 218" fill="#5C4120" stroke="#33250F" stroke-width="1.5"/>
          <path d="M88 236 Q82 240 78 243" stroke="#4A3618" stroke-width="0.8" fill="none" opacity="0.4"/>

          <!-- Feet — webbed -->
          <ellipse cx="135" cy="225" rx="15" ry="7" fill="#5C4120" stroke="#33250F" stroke-width="1"/>
          <ellipse cx="172" cy="225" rx="15" ry="7" fill="#5C4120" stroke="#33250F" stroke-width="1"/>
          <path d="M128 225 L125 229" stroke="#33250F" stroke-width="0.6" opacity="0.4"/>
          <path d="M132 225 L130 230" stroke="#33250F" stroke-width="0.6" opacity="0.4"/>
          <path d="M165 225 L163 230" stroke="#33250F" stroke-width="0.6" opacity="0.4"/>
          <path d="M169 225 L167 229" stroke="#33250F" stroke-width="0.6" opacity="0.4"/>

          <!-- Gi pants -->
          <rect x="126" y="172" width="21" height="52" rx="8" fill="#F0EDE8" stroke="#D8D2C8" stroke-width="1"/>
          <rect x="159" y="172" width="21" height="52" rx="8" fill="#F0EDE8" stroke="#D8D2C8" stroke-width="1"/>

          <!-- Body / Gi top — elongated otter body -->
          <path d="M118 108 Q115 166 126 190 L180 190 Q191 166 188 108 Z" fill="#F0EDE8" stroke="#D8D2C8" stroke-width="1.5"/>
          <!-- Gi lapel V -->
          <path d="M147 108 L143 155 L153 190" fill="none" stroke="#D8D2C8" stroke-width="1.5"/>
          <path d="M159 108 L163 155 L153 190" fill="none" stroke="#D8D2C8" stroke-width="1.5"/>
          <!-- Belly patch through gi opening -->
          <path d="M143 116 Q153 110 163 116 L163 155 Q153 163 143 155 Z" fill="#B8A47C" opacity="0.5"/>

          <!-- Purple belt -->
          <rect x="120" y="158" width="60" height="8" rx="3" fill="#7B4BAA"/>
          <rect x="120" y="158" width="60" height="8" rx="3" fill="url(#beltShine)" opacity="0.25"/>
          <circle cx="160" cy="162" r="5" fill="#5E3388"/>
          <path d="M160 167 L153 182" stroke="#7B4BAA" stroke-width="4" stroke-linecap="round"/>
          <path d="M160 167 L167 180" stroke="#7B4BAA" stroke-width="4" stroke-linecap="round"/>

          <!-- Left arm (relaxed at side) -->
          <path d="M118 118 Q98 130 92 150 Q90 155 96 152 Q105 146 114 137" fill="#F0EDE8" stroke="#D8D2C8" stroke-width="1.5"/>
          <ellipse cx="93" cy="151" rx="9" ry="7" fill="#5C4120" stroke="#33250F" stroke-width="1"/>
          <path d="M87 149 Q93 145 99 149" stroke="#E8E4DC" stroke-width="2.5" fill="none" stroke-linecap="round"/>

          <!-- Right arm (thumbs up!) -->
          <path d="M188 118 Q208 106 214 90 Q216 85 211 88 Q203 96 194 112" fill="#F0EDE8" stroke="#D8D2C8" stroke-width="1.5"/>
          <ellipse cx="214" cy="87" rx="9" ry="7.5" fill="#5C4120" stroke="#33250F" stroke-width="1"/>
          <!-- Thumb -->
          <path d="M212 79 Q213 69 215 65" stroke="#5C4120" stroke-width="6" stroke-linecap="round"/>
          <path d="M212 79 Q213 69 215 65" stroke="#33250F" stroke-width="1" stroke-linecap="round" fill="none"/>
          <path d="M208 85 Q214 81 220 85" stroke="#E8E4DC" stroke-width="2.5" fill="none" stroke-linecap="round"/>

          <!-- HEAD — wide flat otter v2, dark chocolate -->
          <ellipse cx="153" cy="84" rx="38" ry="26" fill="#5C4120"/>

          <!-- Tiny ears — LOW on sides of skull -->
          <circle cx="120" cy="72" r="6" fill="#5C4120" stroke="#33250F" stroke-width="1"/>
          <circle cx="120" cy="72" r="3" fill="#A89060"/>
          <circle cx="186" cy="72" r="6" fill="#5C4120" stroke="#33250F" stroke-width="1"/>
          <circle cx="186" cy="72" r="3" fill="#A89060"/>

          <!-- Face patch + muzzle bump -->
          <ellipse cx="153" cy="91" rx="24" ry="16" fill="#A89060"/>
          <ellipse cx="153" cy="95" rx="14" ry="9" fill="#B8A47C"/>

          <!-- Eyes — happy squint -->
          <path d="M138 79 Q142 74 146 79" stroke="#1E100A" stroke-width="2.5" fill="none" stroke-linecap="round"/>
          <path d="M160 79 Q164 74 168 79" stroke="#1E100A" stroke-width="2.5" fill="none" stroke-linecap="round"/>

          <!-- Nose — wide, rounded -->
          <ellipse cx="153" cy="89" rx="5" ry="3.2" fill="#1E100A"/>
          <ellipse cx="154.5" cy="88" rx="2" ry="1" fill="white" opacity="0.25"/>

          <!-- Big happy smile -->
          <path d="M143 98 Q153 105 163 98" stroke="#33250F" stroke-width="2" fill="none" stroke-linecap="round"/>
          <path d="M148 99 Q153 102 158 99" stroke="#F0EDE8" stroke-width="1.5" fill="none" stroke-linecap="round"/>

          <!-- Whiskers — 3 per side -->
          <line x1="135" y1="92" x2="112" y2="86" stroke="#33250F" stroke-width="1" opacity="0.5"/>
          <line x1="135" y1="95" x2="110" y2="94" stroke="#33250F" stroke-width="1" opacity="0.5"/>
          <line x1="135" y1="98" x2="113" y2="101" stroke="#33250F" stroke-width="1" opacity="0.4"/>
          <line x1="171" y1="92" x2="194" y2="86" stroke="#33250F" stroke-width="1" opacity="0.5"/>
          <line x1="171" y1="95" x2="196" y2="94" stroke="#33250F" stroke-width="1" opacity="0.5"/>
          <line x1="171" y1="98" x2="193" y2="101" stroke="#33250F" stroke-width="1" opacity="0.4"/>
        </svg>
      </div>
    </div>
  `,
  styles: [`
    .desktop-surface {
      min-height: calc(100vh - 52px);
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
    .admin-grid {
      margin-top: 20px;
      padding-top: 16px;
      border-top: 1px dashed var(--color-border, #ccc);
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
export class DesktopComponent {
  isAdmin = false;
  adminUrl = '';
  adminSecret = '';

  constructor(private auth: AuthService) {
    const secret = localStorage.getItem('admin_secret');
    this.auth.user$.subscribe(user => {
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
