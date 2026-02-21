import { Injectable } from '@angular/core';

const SESSION_KEY = 'bjj_coach_session_id';

@Injectable({ providedIn: 'root' })
export class SessionService {
  private sessionId: string;

  constructor() {
    let stored = localStorage.getItem(SESSION_KEY);
    if (!stored) {
      stored = this.generateId();
      localStorage.setItem(SESSION_KEY, stored);
    }
    this.sessionId = stored;
  }

  getSessionId(): string {
    return this.sessionId;
  }

  isNewUser(): boolean {
    return !localStorage.getItem('bjj_coach_has_history');
  }

  markHasHistory(): void {
    localStorage.setItem('bjj_coach_has_history', '1');
  }

  private generateId(): string {
    return 'web_' + crypto.randomUUID();
  }
}
