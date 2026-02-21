import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import type { FeatureIdea, FeatureIdeaComment } from '../../shared/models';

@Component({
  selector: 'app-ideas',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="window-container">
      <div class="retro-window ideas-window">
        <!-- Title bar -->
        <div class="retro-window__titlebar">
          <div class="retro-window__controls">
            <a routerLink="/" class="retro-window__dot retro-window__dot--close"></a>
            <span class="retro-window__dot retro-window__dot--minimize"></span>
            <span class="retro-window__dot retro-window__dot--maximize"></span>
          </div>
          <span class="retro-window__title">ideas.txt — Feature Ideas</span>
        </div>

        <!-- Toolbar -->
        <div class="toolbar">
          <div class="toolbar-row">
            <div class="sort-tabs">
              <button class="tab" [class.tab--active]="sort === 'newest'" (click)="setSort('newest')">Newest</button>
              <button class="tab" [class.tab--active]="sort === 'top'" (click)="setSort('top')">Most Voted</button>
            </div>
            @if (isLoggedIn) {
              <button class="btn-new" (click)="showForm = !showForm">
                {{ showForm ? 'Cancel' : '+ New Idea' }}
              </button>
            } @else {
              <a class="btn-signin" routerLink="/auth/login">Sign in to submit</a>
            }
          </div>

          <!-- Submit form -->
          @if (showForm) {
            <form class="idea-form" (ngSubmit)="submitIdea()">
              <input
                type="text"
                class="form-input"
                placeholder="Idea title"
                [(ngModel)]="newTitle"
                name="title"
                maxlength="200"
              />
              <div class="char-count">{{ newTitle.length }}/200</div>
              <textarea
                class="form-textarea"
                placeholder="Describe your idea..."
                [(ngModel)]="newDescription"
                name="description"
                rows="3"
                maxlength="2000"
              ></textarea>
              <div class="char-count">{{ newDescription.length }}/2000</div>
              <button type="submit" class="btn-submit" [disabled]="!newTitle.trim() || !newDescription.trim() || submitting">
                {{ submitting ? 'Submitting...' : 'Submit Idea' }}
              </button>
              @if (submitError) {
                <div class="form-error">{{ submitError }}</div>
              }
            </form>
          }
        </div>

        <!-- Body -->
        <div class="retro-window__body ideas-body">
          @if (loading) {
            <div class="empty-state">Loading ideas...</div>
          } @else if (ideas.length === 0) {
            <div class="empty-state">
              <p>No ideas yet. Be the first to suggest a feature!</p>
            </div>
          } @else {
            <div class="ideas-list">
              @for (idea of ideas; track idea.id) {
                <div class="idea-card" [class.idea-card--expanded]="expandedId === idea.id">
                  <div class="idea-row">
                    <button
                      class="vote-btn"
                      [class.vote-btn--voted]="idea.user_has_voted"
                      [disabled]="!isLoggedIn"
                      (click)="vote(idea)"
                      [title]="isLoggedIn ? (idea.user_has_voted ? 'Remove vote' : 'Upvote') : 'Sign in to vote'"
                    >
                      <svg class="vote-arrow" viewBox="0 0 12 8" fill="none">
                        <path d="M1 7L6 2L11 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                      </svg>
                      <span class="vote-count">{{ idea.vote_count }}</span>
                    </button>
                    <button class="idea-content" (click)="toggleExpand(idea)">
                      <span class="idea-title">{{ idea.title }}</span>
                      <span class="idea-meta">
                        {{ idea.author_name || 'Anonymous' }} · {{ timeAgo(idea.created_at) }}
                        @if (idea.comment_count > 0) {
                          · {{ idea.comment_count }} {{ idea.comment_count === 1 ? 'comment' : 'comments' }}
                        }
                      </span>
                    </button>
                  </div>

                  <!-- Expanded detail -->
                  @if (expandedId === idea.id) {
                    <div class="idea-detail">
                      <p class="idea-description">{{ idea.description }}</p>

                      <!-- Comments -->
                      <div class="comments-section">
                        @if (commentsLoading) {
                          <div class="comments-loading">Loading comments...</div>
                        } @else {
                          @for (comment of comments; track comment.id) {
                            <div class="comment">
                              <span class="comment-author">{{ comment.author_name || 'Anonymous' }}</span>
                              <span class="comment-time">{{ timeAgo(comment.created_at) }}</span>
                              <p class="comment-content">{{ comment.content }}</p>
                            </div>
                          }
                        }

                        <!-- Add comment -->
                        @if (isLoggedIn) {
                          <form class="comment-form" (ngSubmit)="addComment(idea)">
                            <input
                              type="text"
                              class="comment-input"
                              placeholder="Add a comment..."
                              [(ngModel)]="newComment"
                              name="comment"
                              maxlength="1000"
                            />
                            <button type="submit" class="btn-comment" [disabled]="!newComment.trim() || commentSubmitting">
                              Post
                            </button>
                          </form>
                        } @else {
                          <div class="comment-signin">
                            <a routerLink="/auth/login">Sign in</a> to comment
                          </div>
                        }
                      </div>
                    </div>
                  }
                </div>
              }
            </div>
          }
        </div>

        <!-- Status bar -->
        <div class="retro-window__statusbar">
          {{ ideas.length }} {{ ideas.length === 1 ? 'idea' : 'ideas' }} · sorted by {{ sort === 'top' ? 'most voted' : 'newest' }}
        </div>
      </div>
    </div>
  `,
  styles: [`
    .window-container {
      display: flex;
      justify-content: center;
      padding: 24px 16px;
      min-height: calc(100vh - 52px);
    }
    .ideas-window {
      width: 100%;
      max-width: 700px;
      min-height: calc(100vh - 52px - 48px);
    }

    /* Toolbar */
    .toolbar {
      background: var(--color-surface-muted);
      border-bottom: var(--border-subtle);
      padding: 12px 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .toolbar-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }
    .sort-tabs {
      display: flex;
      gap: 4px;
    }
    .tab {
      padding: 5px 10px;
      border: var(--border-subtle);
      border-radius: 4px;
      background: var(--color-surface);
      font-family: var(--font-body);
      font-size: var(--text-xs);
      font-weight: 500;
      color: var(--color-text-secondary);
      cursor: pointer;
      transition: all 0.15s;
    }
    .tab:hover { background: var(--color-desktop-darker); }
    .tab--active {
      background: var(--color-accent);
      color: var(--color-accent-text);
      border-color: var(--color-accent);
      font-weight: 600;
    }
    .btn-new {
      padding: 5px 14px;
      border: 2px solid var(--color-text);
      border-radius: 4px;
      background: var(--color-accent);
      color: var(--color-accent-text);
      font-family: var(--font-body);
      font-size: var(--text-xs);
      font-weight: 600;
      cursor: pointer;
      transition: background 0.15s;
    }
    .btn-new:hover { background: var(--color-accent-hover); }
    .btn-signin {
      font-family: var(--font-body);
      font-size: var(--text-xs);
      color: var(--color-text-muted);
      text-decoration: underline;
    }

    /* Submit form */
    .idea-form {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .form-input {
      padding: 8px 12px;
      border: var(--border-subtle);
      border-radius: 4px;
      font-family: var(--font-body);
      font-size: var(--text-sm);
      background: var(--color-surface);
      color: var(--color-text);
      outline: none;
    }
    .form-input:focus { border-color: var(--color-accent); }
    .form-textarea {
      padding: 8px 12px;
      border: var(--border-subtle);
      border-radius: 4px;
      font-family: var(--font-body);
      font-size: var(--text-sm);
      background: var(--color-surface);
      color: var(--color-text);
      outline: none;
      resize: vertical;
      min-height: 60px;
    }
    .form-textarea:focus { border-color: var(--color-accent); }
    .char-count {
      font-family: var(--font-mono);
      font-size: 10px;
      color: var(--color-text-muted);
      text-align: right;
    }
    .btn-submit {
      align-self: flex-end;
      padding: 6px 16px;
      border: 2px solid var(--color-text);
      border-radius: 4px;
      background: var(--color-accent);
      color: var(--color-accent-text);
      font-family: var(--font-body);
      font-size: var(--text-xs);
      font-weight: 600;
      cursor: pointer;
      transition: background 0.15s;
    }
    .btn-submit:hover:not(:disabled) { background: var(--color-accent-hover); }
    .btn-submit:disabled { opacity: 0.5; cursor: default; }
    .form-error {
      font-size: var(--text-xs);
      color: #d32f2f;
    }

    /* Ideas list */
    .ideas-body {
      background: var(--color-surface-muted);
      flex: 1;
      overflow-y: auto;
    }
    .ideas-list {
      padding: 8px;
    }
    .idea-card {
      background: var(--color-surface);
      border: var(--border-subtle);
      border-radius: 6px;
      margin-bottom: 6px;
      transition: border-color 0.1s;
    }
    .idea-card:hover { border-color: var(--color-desktop-darker); }
    .idea-card--expanded { border-color: var(--color-accent); }

    .idea-row {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 12px;
    }

    /* Vote button */
    .vote-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
      padding: 6px 8px;
      border: var(--border-subtle);
      border-radius: 6px;
      background: var(--color-surface);
      cursor: pointer;
      transition: all 0.15s;
      flex-shrink: 0;
      min-width: 40px;
    }
    .vote-btn:hover:not(:disabled) {
      background: var(--color-desktop-darker);
    }
    .vote-btn--voted {
      border-color: var(--color-accent);
      background: rgba(245, 166, 35, 0.08);
    }
    .vote-btn--voted .vote-arrow { color: var(--color-accent); }
    .vote-btn--voted .vote-count { color: var(--color-accent); font-weight: 700; }
    .vote-btn:disabled { cursor: default; opacity: 0.7; }
    .vote-arrow {
      width: 12px;
      height: 8px;
      color: var(--color-text-muted);
      transition: color 0.15s;
    }
    .vote-count {
      font-family: var(--font-mono);
      font-size: var(--text-xs);
      font-weight: 600;
      color: var(--color-text-secondary);
    }

    /* Idea content */
    .idea-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 4px;
      background: none;
      border: none;
      padding: 0;
      cursor: pointer;
      text-align: left;
      font-family: var(--font-body);
    }
    .idea-title {
      font-size: var(--text-sm);
      font-weight: 600;
      color: var(--color-text);
      line-height: 1.3;
    }
    .idea-content:hover .idea-title { color: var(--color-accent); }
    .idea-meta {
      font-size: var(--text-xs);
      color: var(--color-text-muted);
    }

    /* Expanded detail */
    .idea-detail {
      padding: 0 12px 12px 64px;
    }
    .idea-description {
      font-size: var(--text-sm);
      color: var(--color-text-secondary);
      line-height: 1.5;
      margin: 0 0 12px 0;
      white-space: pre-wrap;
    }

    /* Comments */
    .comments-section {
      border-top: var(--border-subtle);
      padding-top: 10px;
    }
    .comments-loading {
      font-size: var(--text-xs);
      color: var(--color-text-muted);
      padding: 8px 0;
    }
    .comment {
      padding: 6px 0;
      border-bottom: 1px solid rgba(0, 0, 0, 0.04);
    }
    .comment:last-of-type { border-bottom: none; }
    .comment-author {
      font-size: var(--text-xs);
      font-weight: 600;
      color: var(--color-text);
      margin-right: 6px;
    }
    .comment-time {
      font-size: 10px;
      color: var(--color-text-muted);
    }
    .comment-content {
      font-size: var(--text-xs);
      color: var(--color-text-secondary);
      margin: 2px 0 0 0;
      line-height: 1.4;
    }
    .comment-form {
      display: flex;
      gap: 6px;
      margin-top: 8px;
    }
    .comment-input {
      flex: 1;
      padding: 6px 10px;
      border: var(--border-subtle);
      border-radius: 4px;
      font-family: var(--font-body);
      font-size: var(--text-xs);
      background: var(--color-surface);
      color: var(--color-text);
      outline: none;
    }
    .comment-input:focus { border-color: var(--color-accent); }
    .btn-comment {
      padding: 6px 12px;
      border: var(--border-subtle);
      border-radius: 4px;
      background: var(--color-surface);
      font-family: var(--font-body);
      font-size: var(--text-xs);
      font-weight: 600;
      color: var(--color-text-secondary);
      cursor: pointer;
      transition: all 0.15s;
    }
    .btn-comment:hover:not(:disabled) {
      background: var(--color-desktop-darker);
      color: var(--color-text);
    }
    .btn-comment:disabled { opacity: 0.5; cursor: default; }
    .comment-signin {
      font-size: var(--text-xs);
      color: var(--color-text-muted);
      padding: 8px 0;
    }
    .comment-signin a {
      color: var(--color-accent);
      text-decoration: underline;
    }

    /* States */
    .empty-state {
      text-align: center;
      padding: 48px 20px;
      color: var(--color-text-muted);
      font-size: var(--text-sm);
    }

    @media (max-width: 600px) {
      .window-container { padding: 8px; }
      .ideas-window { min-height: calc(100vh - 52px - 16px); }
      .idea-detail { padding-left: 12px; }
    }
  `],
})
export class IdeasComponent implements OnInit {
  ideas: FeatureIdea[] = [];
  sort: 'newest' | 'top' = 'newest';
  loading = true;

  showForm = false;
  newTitle = '';
  newDescription = '';
  submitting = false;
  submitError = '';

  expandedId: number | null = null;
  comments: FeatureIdeaComment[] = [];
  commentsLoading = false;
  newComment = '';
  commentSubmitting = false;

  isLoggedIn = false;

  constructor(private api: ApiService, private auth: AuthService) {}

  ngOnInit(): void {
    this.isLoggedIn = this.auth.isAuthenticated();
    this.loadIdeas();
  }

  loadIdeas(): void {
    this.loading = true;
    this.api.getIdeas(this.sort).subscribe({
      next: (ideas) => {
        this.ideas = ideas;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  setSort(sort: 'newest' | 'top'): void {
    if (this.sort === sort) return;
    this.sort = sort;
    this.loadIdeas();
  }

  submitIdea(): void {
    if (!this.newTitle.trim() || !this.newDescription.trim() || this.submitting) return;
    this.submitting = true;
    this.submitError = '';

    this.api.submitIdea(this.newTitle.trim(), this.newDescription.trim()).subscribe({
      next: () => {
        this.newTitle = '';
        this.newDescription = '';
        this.showForm = false;
        this.submitting = false;
        this.loadIdeas();
      },
      error: (err) => {
        this.submitError = err.error?.error || 'Failed to submit idea';
        this.submitting = false;
      },
    });
  }

  vote(idea: FeatureIdea): void {
    if (!this.isLoggedIn) return;
    this.api.toggleIdeaVote(idea.id).subscribe({
      next: (result) => {
        idea.user_has_voted = result.voted ? 1 : 0;
        idea.vote_count = result.vote_count;
      },
    });
  }

  toggleExpand(idea: FeatureIdea): void {
    if (this.expandedId === idea.id) {
      this.expandedId = null;
      this.comments = [];
      this.newComment = '';
      return;
    }
    this.expandedId = idea.id;
    this.commentsLoading = true;
    this.newComment = '';
    this.api.getIdeaComments(idea.id).subscribe({
      next: (comments) => {
        this.comments = comments;
        this.commentsLoading = false;
      },
      error: () => {
        this.commentsLoading = false;
      },
    });
  }

  addComment(idea: FeatureIdea): void {
    if (!this.newComment.trim() || this.commentSubmitting) return;
    this.commentSubmitting = true;

    this.api.addIdeaComment(idea.id, this.newComment.trim()).subscribe({
      next: (comment) => {
        this.comments.push(comment);
        idea.comment_count++;
        this.newComment = '';
        this.commentSubmitting = false;
      },
      error: () => {
        this.commentSubmitting = false;
      },
    });
  }

  timeAgo(dateStr: string): string {
    const now = Date.now();
    const then = new Date(dateStr).getTime();
    const seconds = Math.floor((now - then) / 1000);

    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months}mo ago`;
    return `${Math.floor(months / 12)}y ago`;
  }
}
