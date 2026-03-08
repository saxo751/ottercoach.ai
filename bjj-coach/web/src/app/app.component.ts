import { Component } from '@angular/core';
import { Router, NavigationEnd, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs/operators';
import { NavbarComponent } from './shared/components/navbar.component';

const ROUTE_OTTERS: Record<string, string> = {
  '/': 'Otter-relaxed-with-arms-crossed.svg',
  '/chat': 'Otter-relaxed-with-arms-crossed-no-belt.svg',
  '/dashboard': 'Otter-ready-fight-stance.svg',
  '/focus': 'Otter-meditating.svg',
  '/techniques': 'Otter-armbar-turtle.svg',
  '/ideas': 'Otter-with-finger-in-air.svg',
  '/profile': 'Otter-approving-with-thumbs-up.svg',
  '/auth/login': 'Otter-ready-fight-stance-gi.svg',
  '/auth/signup': 'Otter-approving-with-thumbs-up.svg',
};

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent],
  template: `
    <app-navbar />
    <main class="main-content">
      <router-outlet></router-outlet>
    </main>
    <img
      [src]="'assets/otters/' + cornerOtter"
      alt=""
      class="corner-otter"
    />
  `,
  styles: [
    `
      .main-content {
        padding-top: 52px; /* navbar height */
      }
      .corner-otter {
        position: fixed;
        bottom: 24px;
        right: 24px;
        height: 200px;
        pointer-events: none;
        z-index: 0;
      }
      @media (max-width: 960px) {
        .corner-otter {
          display: none;
        }
      }
    `,
  ],
})
export class AppComponent {
  cornerOtter = ROUTE_OTTERS['/'];

  constructor(private router: Router) {
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((e) => {
        this.cornerOtter = ROUTE_OTTERS[e.urlAfterRedirects] ?? ROUTE_OTTERS['/'];
      });
  }
}
