import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/desktop/desktop.component').then((m) => m.DesktopComponent),
  },
  {
    path: 'chat',
    loadComponent: () =>
      import('./features/chat/chat.component').then((m) => m.ChatComponent),
    canActivate: [authGuard],
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
    canActivate: [authGuard],
  },
  {
    path: 'focus',
    loadComponent: () =>
      import('./features/focus-timeline/focus-timeline.component').then((m) => m.FocusTimelineComponent),
    canActivate: [authGuard],
  },
  {
    path: 'techniques',
    loadComponent: () =>
      import('./features/techniques/techniques.component').then((m) => m.TechniquesComponent),
  },
  {
    path: 'ideas',
    loadComponent: () =>
      import('./features/ideas/ideas.component').then((m) => m.IdeasComponent),
  },
  {
    path: 'profile',
    loadComponent: () =>
      import('./features/profile/profile.component').then((m) => m.ProfileComponent),
    canActivate: [authGuard],
  },
  {
    path: 'auth/signup',
    loadComponent: () =>
      import('./features/auth/signup.component').then((m) => m.SignupComponent),
  },
  {
    path: 'auth/login',
    loadComponent: () =>
      import('./features/auth/login.component').then((m) => m.LoginComponent),
  },
];
