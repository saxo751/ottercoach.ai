import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SessionService } from './session.service';
import { environment } from '../../../environments/environment';
import type { User, Position, Technique, TrainingSession, FocusPeriod, Goal, LibraryTechnique } from '../../shared/models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private baseUrl = environment.apiUrl + '/dashboard';

  constructor(private http: HttpClient, private session: SessionService) {}

  private params() {
    return { sid: this.session.getSessionId() };
  }

  getProfile(): Observable<User> {
    return this.http.get<User>(`${this.baseUrl}/profile`, { params: this.params() });
  }

  getSessions(limit = 10): Observable<TrainingSession[]> {
    return this.http.get<TrainingSession[]>(`${this.baseUrl}/sessions`, {
      params: { ...this.params(), limit: limit.toString() },
    });
  }

  getPositions(): Observable<Position[]> {
    return this.http.get<Position[]>(`${this.baseUrl}/positions`, { params: this.params() });
  }

  getTechniques(): Observable<Technique[]> {
    return this.http.get<Technique[]>(`${this.baseUrl}/techniques`, { params: this.params() });
  }

  getActiveFocus(): Observable<FocusPeriod | null> {
    return this.http.get<FocusPeriod | null>(`${this.baseUrl}/focus`, { params: this.params() });
  }

  getGoals(): Observable<Goal[]> {
    return this.http.get<Goal[]>(`${this.baseUrl}/goals`, { params: this.params() });
  }

  getLibrary(opts?: { category?: string; search?: string }): Observable<LibraryTechnique[]> {
    const params: Record<string, string> = {};
    if (opts?.category) params['category'] = opts.category;
    if (opts?.search) params['search'] = opts.search;
    return this.http.get<LibraryTechnique[]>(`${this.baseUrl}/library`, { params });
  }
}
