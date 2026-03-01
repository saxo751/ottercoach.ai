import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface AuthUser {
  id: string;
  name: string | null;
  email: string;
  belt_rank: string | null;
  onboarding_complete: number;
  profile_picture?: string | null;
}

export interface SignupData {
  email: string;
  password: string;
  name: string;
  belt_rank: string;
  experience_months: number;
  training_days: string;
  goals: string;
  telegram_bot_token?: string;
}

interface LoginData {
  email: string;
  password: string;
}

interface AuthTokenResponse {
  token: string;
  user: AuthUser;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'bjj_coach_jwt';
  private currentUser$ = new BehaviorSubject<AuthUser | null>(null);
  private _initialized: Promise<void>;

  user$ = this.currentUser$.asObservable();

  constructor(private http: HttpClient) {
    const token = this.getToken();
    if (token) {
      this._initialized = this.fetchMe();
    } else {
      this._initialized = Promise.resolve();
    }
  }

  /** Resolves once the initial auth check (fetchMe) has completed. */
  get initialized(): Promise<void> {
    return this._initialized;
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  get currentUser(): AuthUser | null {
    return this.currentUser$.value;
  }

  signup(data: SignupData): Observable<AuthTokenResponse> {
    return this.http.post<AuthTokenResponse>(`${environment.apiUrl}/auth/signup`, data).pipe(
      tap((response) => {
        localStorage.setItem(this.TOKEN_KEY, response.token);
        this.currentUser$.next(response.user);
      }),
    );
  }

  login(data: LoginData): Observable<AuthTokenResponse> {
    return this.http.post<AuthTokenResponse>(`${environment.apiUrl}/auth/login`, data).pipe(
      tap((response) => {
        localStorage.setItem(this.TOKEN_KEY, response.token);
        this.currentUser$.next(response.user);
      }),
    );
  }

  fetchMe(): Promise<void> {
    return firstValueFrom(this.http.get<AuthUser>(`${environment.apiUrl}/auth/me`)).then(
      (user) => { this.currentUser$.next(user); },
      (err) => {
        // Only logout on auth failures, not transient network/server errors
        if (err.status === 401 || err.status === 403) {
          this.logout();
        }
      },
    );
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    this.currentUser$.next(null);
  }
}
