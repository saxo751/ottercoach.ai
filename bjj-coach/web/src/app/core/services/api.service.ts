import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { User, Position, Technique, TrainingSession, FocusPeriod, FocusPeriodWithDays, SessionStats, Goal, LibraryTechnique, FeatureIdea, FeatureIdeaComment } from '../../shared/models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private baseUrl = environment.apiUrl + '/dashboard';

  constructor(private http: HttpClient) {}

  getProfile(): Observable<User> {
    return this.http.get<User>(`${this.baseUrl}/profile`);
  }

  updateProfile(updates: Partial<User>): Observable<User> {
    return this.http.put<User>(`${this.baseUrl}/profile`, updates);
  }

  getSessions(limit = 10): Observable<TrainingSession[]> {
    return this.http.get<TrainingSession[]>(`${this.baseUrl}/sessions`, {
      params: { limit: limit.toString() },
    });
  }

  createSession(body: Partial<TrainingSession>): Observable<TrainingSession> {
    return this.http.post<TrainingSession>(`${this.baseUrl}/sessions`, body);
  }

  updateSession(id: number, body: Partial<TrainingSession>): Observable<TrainingSession> {
    return this.http.put<TrainingSession>(`${this.baseUrl}/sessions/${id}`, body);
  }

  deleteSession(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/sessions/${id}`);
  }

  getPositions(): Observable<Position[]> {
    return this.http.get<Position[]>(`${this.baseUrl}/positions`);
  }

  getTechniques(): Observable<Technique[]> {
    return this.http.get<Technique[]>(`${this.baseUrl}/techniques`);
  }

  getActiveFocus(): Observable<FocusPeriod | null> {
    return this.http.get<FocusPeriod | null>(`${this.baseUrl}/focus`);
  }

  getGoals(): Observable<Goal[]> {
    return this.http.get<Goal[]>(`${this.baseUrl}/goals`);
  }

  getSessionStats(): Observable<SessionStats> {
    return this.http.get<SessionStats>(`${this.baseUrl}/stats`);
  }

  getFocusHistory(): Observable<FocusPeriodWithDays[]> {
    return this.http.get<FocusPeriodWithDays[]>(`${this.baseUrl}/focus/history`);
  }

  createFocusPeriod(body: { name: string; description?: string; focus_techniques?: string; focus_positions?: string }): Observable<FocusPeriod> {
    return this.http.post<FocusPeriod>(`${this.baseUrl}/focus`, body);
  }

  updateFocusPeriod(id: number, body: Partial<{ name: string; description: string; focus_techniques: string; focus_positions: string; status: string }>): Observable<FocusPeriod> {
    return this.http.put<FocusPeriod>(`${this.baseUrl}/focus/${id}`, body);
  }

  deleteFocusPeriod(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/focus/${id}`);
  }

  getLibrary(opts?: { category?: string; search?: string }): Observable<LibraryTechnique[]> {
    const params: Record<string, string> = {};
    if (opts?.category) params['category'] = opts.category;
    if (opts?.search) params['search'] = opts.search;
    return this.http.get<LibraryTechnique[]>(`${this.baseUrl}/library`, { params });
  }

  identifyTechniques(description: string): Observable<{ suggestions: string[] }> {
    return this.http.post<{ suggestions: string[] }>(`${this.baseUrl}/techniques/identify`, { description });
  }

  // --- Telegram ---

  validateTelegramToken(token: string): Observable<{ valid: boolean; bot_username?: string; error?: string }> {
    return this.http.post<{ valid: boolean; bot_username?: string; error?: string }>(
      `${this.baseUrl}/telegram/validate`, { token }
    );
  }

  setTelegramToken(token: string | null): Observable<{ success: boolean; bot_username?: string }> {
    return this.http.put<{ success: boolean; bot_username?: string }>(
      `${this.baseUrl}/telegram/token`, { token }
    );
  }

  // --- Feature Ideas ---
  private ideasUrl = environment.apiUrl + '/ideas';

  getIdeas(sort: 'newest' | 'top' = 'newest'): Observable<FeatureIdea[]> {
    return this.http.get<FeatureIdea[]>(this.ideasUrl, { params: { sort } });
  }

  submitIdea(title: string, description: string): Observable<FeatureIdea> {
    return this.http.post<FeatureIdea>(this.ideasUrl, { title, description });
  }

  toggleIdeaVote(ideaId: number): Observable<{ voted: boolean; vote_count: number }> {
    return this.http.post<{ voted: boolean; vote_count: number }>(`${this.ideasUrl}/${ideaId}/vote`, {});
  }

  getIdeaComments(ideaId: number): Observable<FeatureIdeaComment[]> {
    return this.http.get<FeatureIdeaComment[]>(`${this.ideasUrl}/${ideaId}/comments`);
  }

  addIdeaComment(ideaId: number, content: string): Observable<FeatureIdeaComment> {
    return this.http.post<FeatureIdeaComment>(`${this.ideasUrl}/${ideaId}/comments`, { content });
  }
}
