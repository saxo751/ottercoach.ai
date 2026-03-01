import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService, type AuthUser } from '../../core/services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <nav class="navbar">
      <div class="navbar__inner">
        <!-- Left: Logo + brand -->
        <a class="navbar__brand" routerLink="/">
          <svg
            class="navbar__logo"
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="16" cy="16" r="14" fill="#252119" />
            <ellipse cx="16" cy="15" rx="12" ry="8" fill="#5C4120" />
            <circle cx="5.5" cy="11" r="2" fill="#5C4120" />
            <circle cx="26.5" cy="11" r="2" fill="#5C4120" />
            <ellipse cx="16" cy="18" rx="7" ry="4.5" fill="#A89060" />
            <ellipse cx="16" cy="19.5" rx="4" ry="2.5" fill="#B8A47C" />
            <ellipse cx="12" cy="14.5" rx="1.5" ry="1.7" fill="#1E100A" />
            <ellipse cx="20" cy="14.5" rx="1.5" ry="1.7" fill="#1E100A" />
            <circle cx="12.6" cy="13.8" r="0.6" fill="white" opacity="0.8" />
            <circle cx="20.6" cy="13.8" r="0.6" fill="white" opacity="0.8" />
            <ellipse cx="16" cy="17.5" rx="1.5" ry="1" fill="#1E100A" />
            <path
              d="M13.5 20.5 Q16 22.5 18.5 20.5"
              stroke="#33250F"
              stroke-width="0.8"
              fill="none"
              stroke-linecap="round"
            />
            <line
              x1="12"
              y1="18.5"
              x2="6"
              y2="17"
              stroke="#33250F"
              stroke-width="0.5"
              opacity="0.5"
            />
            <line
              x1="12"
              y1="19.5"
              x2="5.5"
              y2="19.5"
              stroke="#33250F"
              stroke-width="0.5"
              opacity="0.5"
            />
            <line
              x1="20"
              y1="18.5"
              x2="26"
              y2="17"
              stroke="#33250F"
              stroke-width="0.5"
              opacity="0.5"
            />
            <line
              x1="20"
              y1="19.5"
              x2="26.5"
              y2="19.5"
              stroke="#33250F"
              stroke-width="0.5"
              opacity="0.5"
            />
            <rect x="6" y="27" width="20" height="3" rx="1.5" fill="#7B4BAA" />
          </svg>
          <span class="navbar__brand-text">BJJ Coach</span>
        </a>

        <!-- Center: Nav links -->
        <div class="navbar__links">
          <a
            class="navbar__link"
            routerLink="/chat"
            routerLinkActive="navbar__link--active"
          >
            Coach Chat
          </a>
          <a
            class="navbar__link"
            routerLink="/dashboard"
            routerLinkActive="navbar__link--active"
          >
            Dashboard
          </a>
          <a
            class="navbar__link"
            routerLink="/focus"
            routerLinkActive="navbar__link--active"
          >
            Focus
          </a>
          <a
            class="navbar__link"
            routerLink="/techniques"
            routerLinkActive="navbar__link--active"
          >
            Techniques
          </a>
          <a
            class="navbar__link"
            routerLink="/ideas"
            routerLinkActive="navbar__link--active"
          >
            Ideas
          </a>
        </div>

        <!-- Right: CTA + icons -->
        <div class="navbar__actions">
          @if (!user && !hasToken) {
            <a class="navbar__cta" routerLink="/auth/signup"
              >Get started &ndash; free</a
            >
            <a
              class="navbar__icon-btn"
              routerLink="/auth/login"
              aria-label="Sign in"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 18 18"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle
                  cx="9"
                  cy="6.5"
                  r="3.5"
                  stroke="currentColor"
                  stroke-width="1.8"
                />
                <path
                  d="M2 16.5C2 13.5 5 11.5 9 11.5C13 11.5 16 13.5 16 16.5"
                  stroke="currentColor"
                  stroke-width="1.8"
                  stroke-linecap="round"
                />
              </svg>
            </a>
          } @else {
            <button
              class="navbar__avatar"
              (click)="dropdownOpen = !dropdownOpen"
            >
              @if (user?.profile_picture) {
                <img [src]="user!.profile_picture!" class="navbar__avatar-img" alt="Avatar" />
              } @else {
                {{ userInitial }}
              }
            </button>
            @if (dropdownOpen) {
              <div class="navbar__dropdown">
                <div class="navbar__dropdown-name">
                  {{ user?.name || user?.email || 'User' }}
                </div>
                <div class="navbar__dropdown-divider"></div>
                <a
                  class="navbar__dropdown-item"
                  routerLink="/dashboard"
                  (click)="dropdownOpen = false"
                  >Dashboard</a
                >
                <a
                  class="navbar__dropdown-item"
                  routerLink="/profile"
                  (click)="dropdownOpen = false"
                  >Settings</a
                >
                <button class="navbar__dropdown-item" (click)="signOut()">
                  Sign out
                </button>
              </div>
            }
          }
        </div>

        <!-- Mobile hamburger -->
        <button
          class="navbar__hamburger"
          (click)="mobileOpen = !mobileOpen"
          aria-label="Menu"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            @if (mobileOpen) {
              <line
                x1="4"
                y1="4"
                x2="16"
                y2="16"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
              />
              <line
                x1="16"
                y1="4"
                x2="4"
                y2="16"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
              />
            } @else {
              <line
                x1="3"
                y1="5"
                x2="17"
                y2="5"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
              />
              <line
                x1="3"
                y1="10"
                x2="17"
                y2="10"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
              />
              <line
                x1="3"
                y1="15"
                x2="17"
                y2="15"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
              />
            }
          </svg>
        </button>
      </div>

      <!-- Mobile menu -->
      @if (mobileOpen) {
        <div class="navbar__mobile-menu">
          <a
            class="navbar__mobile-link"
            routerLink="/chat"
            routerLinkActive="navbar__link--active"
            (click)="mobileOpen = false"
            >Coach Chat</a
          >
          <a
            class="navbar__mobile-link"
            routerLink="/dashboard"
            routerLinkActive="navbar__link--active"
            (click)="mobileOpen = false"
            >Dashboard</a
          >
          <a
            class="navbar__mobile-link"
            routerLink="/focus"
            routerLinkActive="navbar__link--active"
            (click)="mobileOpen = false"
            >Focus</a
          >
          <a
            class="navbar__mobile-link"
            routerLink="/techniques"
            routerLinkActive="navbar__link--active"
            (click)="mobileOpen = false"
            >Techniques</a
          >
          <a
            class="navbar__mobile-link"
            routerLink="/ideas"
            routerLinkActive="navbar__link--active"
            (click)="mobileOpen = false"
            >Ideas</a
          >
          <div class="navbar__mobile-divider"></div>
          @if (!user && !hasToken) {
            <a
              class="navbar__cta navbar__cta--mobile"
              routerLink="/auth/signup"
              (click)="mobileOpen = false"
              >Get started &ndash; free</a
            >
            <a
              class="navbar__mobile-link"
              routerLink="/auth/login"
              (click)="mobileOpen = false"
              >Sign in</a
            >
          } @else if (user) {
            <a
              class="navbar__mobile-link"
              routerLink="/profile"
              (click)="mobileOpen = false"
              >Settings</a
            >
            <button
              class="navbar__mobile-link"
              style="border:none;background:none;width:100%;text-align:left;cursor:pointer;"
              (click)="signOut()"
            >
              Sign out
            </button>
          }
        </div>
      }
    </nav>
  `,
  styles: [
    `
      .navbar {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        z-index: 100;
        background: var(--color-desktop);
        border-bottom: var(--border-subtle);
      }

      .navbar__inner {
        margin: 0 auto;
        padding: 0 24px;
        height: 52px;
        display: flex;
        align-items: center;
        gap: 8px;
      }

      /* Brand */
      .navbar__brand {
        display: flex;
        align-items: center;
        gap: 8px;
        text-decoration: none;
        color: var(--color-text);
        margin-right: 16px;
        flex-shrink: 0;
      }

      .navbar__logo {
        width: 28px;
        height: 28px;
      }

      .navbar__brand-text {
        font-family: var(--font-display);
        font-size: 16px;
        font-weight: 800;
        letter-spacing: -0.02em;
      }

      /* Nav links */
      .navbar__links {
        display: flex;
        align-items: center;
        gap: 4px;
        flex: 1;
      }

      .navbar__link {
        font-family: var(--font-body);
        font-size: 14px;
        font-weight: 500;
        color: var(--color-text-secondary);
        text-decoration: none;
        padding: 6px 14px;
        border-radius: 6px;
        transition:
          color 0.15s ease,
          background 0.15s ease;
      }

      .navbar__link:hover {
        color: var(--color-text);
        background: rgba(0, 0, 0, 0.04);
      }

      .navbar__link--active {
        color: var(--color-text);
        font-weight: 600;
      }

      /* Actions (right side) */
      .navbar__actions {
        display: flex;
        align-items: center;
        gap: 6px;
        flex-shrink: 0;
        position: relative;
      }

      .navbar__cta {
        display: inline-flex;
        align-items: center;
        background: var(--color-accent);
        color: var(--color-accent-text);
        border: 2px solid var(--color-text);
        border-radius: 6px;
        padding: 5px 16px;
        font-family: var(--font-body);
        font-size: 13px;
        font-weight: 600;
        text-decoration: none;
        cursor: pointer;
        transition:
          background 0.15s ease,
          transform 0.1s ease;
        white-space: nowrap;
      }

      .navbar__cta:hover {
        background: var(--color-accent-hover);
      }

      .navbar__cta:active {
        transform: scale(0.98);
      }

      .navbar__icon-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 34px;
        height: 34px;
        border: var(--border-subtle);
        border-radius: 6px;
        background: transparent;
        color: var(--color-text-secondary);
        cursor: pointer;
        transition:
          color 0.15s ease,
          background 0.15s ease;
      }

      .navbar__icon-btn:hover {
        color: var(--color-text);
        background: rgba(0, 0, 0, 0.04);
      }

      /* Avatar + dropdown */
      .navbar__avatar {
        width: 34px;
        height: 34px;
        border-radius: 50%;
        border: 2px solid var(--color-text);
        background: var(--color-accent);
        color: var(--color-accent-text);
        font-family: var(--font-body);
        font-size: 14px;
        font-weight: 700;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: background 0.15s ease;
      }

      .navbar__avatar:hover {
        background: var(--color-accent-hover);
      }

      .navbar__avatar-img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        border-radius: 50%;
      }

      .navbar__dropdown {
        position: absolute;
        top: 46px;
        right: 0;
        background: var(--color-surface);
        border: var(--border-medium);
        border-radius: 6px;
        box-shadow: var(--shadow-window);
        min-width: 180px;
        padding: 6px 0;
        z-index: 200;
      }

      .navbar__dropdown-name {
        padding: 8px 14px;
        font-family: var(--font-body);
        font-size: 13px;
        font-weight: 600;
        color: var(--color-text);
      }

      .navbar__dropdown-divider {
        height: 1px;
        background: rgba(0, 0, 0, 0.06);
        margin: 4px 0;
      }

      .navbar__dropdown-item {
        display: block;
        width: 100%;
        padding: 8px 14px;
        font-family: var(--font-body);
        font-size: 13px;
        font-weight: 500;
        color: var(--color-text-secondary);
        text-decoration: none;
        background: none;
        border: none;
        cursor: pointer;
        text-align: left;
        transition:
          color 0.15s ease,
          background 0.15s ease;
      }

      .navbar__dropdown-item:hover {
        color: var(--color-text);
        background: rgba(0, 0, 0, 0.04);
      }

      /* Hamburger (mobile only) */
      .navbar__hamburger {
        display: none;
        align-items: center;
        justify-content: center;
        width: 34px;
        height: 34px;
        border: none;
        border-radius: 6px;
        background: transparent;
        color: var(--color-text);
        cursor: pointer;
        margin-left: auto;
      }

      /* Mobile menu */
      .navbar__mobile-menu {
        display: none;
        flex-direction: column;
        padding: 8px 24px 16px;
        border-top: var(--border-subtle);
        background: var(--color-desktop);
      }

      .navbar__mobile-link {
        font-family: var(--font-body);
        font-size: 15px;
        font-weight: 500;
        color: var(--color-text-secondary);
        text-decoration: none;
        padding: 10px 0;
        border-bottom: 1px solid rgba(0, 0, 0, 0.05);
        transition: color 0.15s ease;
      }

      .navbar__mobile-link:hover {
        color: var(--color-text);
      }

      .navbar__mobile-link.navbar__link--active {
        color: var(--color-text);
        font-weight: 600;
      }

      .navbar__mobile-divider {
        height: 1px;
        background: rgba(0, 0, 0, 0.06);
        margin: 8px 0;
      }

      .navbar__cta--mobile {
        margin-top: 4px;
        text-align: center;
        justify-content: center;
      }

      /* Responsive */
      @media (max-width: 768px) {
        .navbar__links,
        .navbar__actions {
          display: none;
        }

        .navbar__hamburger {
          display: inline-flex;
        }

        .navbar__mobile-menu {
          display: flex;
        }
      }
    `,
  ],
})
export class NavbarComponent implements OnInit, OnDestroy {
  mobileOpen = false;
  dropdownOpen = false;
  user: AuthUser | null = null;
  private userSub?: Subscription;

  constructor(
    private auth: AuthService,
    private router: Router,
  ) {}

  get hasToken(): boolean {
    return this.auth.isAuthenticated();
  }

  get userInitial(): string {
    if (this.user?.name) return this.user.name.charAt(0).toUpperCase();
    if (this.user?.email) return this.user.email.charAt(0).toUpperCase();
    return '?';
  }

  ngOnInit(): void {
    this.userSub = this.auth.user$.subscribe((u) => (this.user = u));
  }

  ngOnDestroy(): void {
    this.userSub?.unsubscribe();
  }

  signOut(): void {
    this.dropdownOpen = false;
    this.mobileOpen = false;
    this.auth.logout();
    this.router.navigate(['/']);
  }
}
