import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ApiService } from '../../core/services/api.service';
import type { LibraryTechnique } from '../../shared/models';

interface SubcategoryGroup {
  name: string;
  techniques: LibraryTechnique[];
  expanded: boolean;
}

const CATEGORY_LABELS: Record<string, string> = {
  submission: 'Submissions',
  back_take: 'Back Takes',
  guard_pass: 'Guard Passes',
  sweep: 'Sweeps',
  takedown: 'Takedowns',
  escape: 'Escapes',
};

const CATEGORY_ORDER = ['submission', 'guard_pass', 'sweep', 'takedown', 'back_take', 'escape'];

@Component({
  selector: 'app-techniques',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="window-container">
      <div class="retro-window techniques-window">
        <!-- Title bar -->
        <div class="retro-window__titlebar">
          <div class="retro-window__controls">
            <a routerLink="/" class="retro-window__dot retro-window__dot--close"></a>
            <span class="retro-window__dot retro-window__dot--minimize"></span>
            <span class="retro-window__dot retro-window__dot--maximize"></span>
          </div>
          <span class="retro-window__title">techniques/ — BJJ Video Library</span>
        </div>

        <!-- Toolbar -->
        <div class="toolbar">
          <div class="search-box">
            <svg class="search-icon" viewBox="0 0 16 16" fill="none">
              <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" stroke-width="1.5"/>
              <line x1="10" y1="10" x2="14" y2="14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
            <input
              type="text"
              class="search-input"
              placeholder="Search techniques..."
              [(ngModel)]="searchQuery"
              (ngModelChange)="onSearch($event)"
            />
            <button *ngIf="searchQuery" class="search-clear" (click)="clearSearch()">×</button>
          </div>
          <div class="category-tabs">
            <button
              class="tab"
              [class.tab--active]="activeCategory === 'all'"
              (click)="setCategory('all')"
            >
              All <span class="tab-count">{{ allTechniques.length }}</span>
            </button>
            <button
              *ngFor="let cat of categories"
              class="tab"
              [class.tab--active]="activeCategory === cat"
              (click)="setCategory(cat)"
            >
              {{ categoryLabel(cat) }}
              <span class="tab-count">{{ getCategoryCount(cat) }}</span>
            </button>
          </div>
        </div>

        <!-- Body -->
        <div class="retro-window__body techniques-body">
          <!-- Active video player -->
          <div class="video-player" *ngIf="activeVideo">
            <div class="video-header">
              <span class="video-title">{{ activeVideo.name }}</span>
              <button class="video-close" (click)="closeVideo()">×</button>
            </div>
            <div class="video-embed">
              <iframe
                [src]="activeVideoUrl"
                frameborder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowfullscreen
              ></iframe>
            </div>
          </div>

          <!-- Technique groups -->
          <div class="groups" *ngIf="!loading">
            <div *ngFor="let group of filteredGroups" class="subcategory-group">
              <button class="group-header" (click)="group.expanded = !group.expanded">
                <svg class="chevron" [class.chevron--open]="group.expanded" viewBox="0 0 12 12">
                  <polyline points="4,2 8,6 4,10" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <span class="group-name">{{ group.name }}</span>
                <span class="group-count">{{ group.techniques.length }} {{ group.techniques.length === 1 ? 'variation' : 'variations' }}</span>
                <span class="group-category-tag">{{ categoryLabel(group.techniques[0].category) }}</span>
              </button>

              <div class="group-body" *ngIf="group.expanded">
                <div *ngFor="let t of group.techniques" class="technique-card" [class.technique-card--expanded]="expandedTechniqueId === t.id">
                  <div class="technique-row">
                    <button
                      class="technique-info"
                      (click)="toggleDescription(t)"
                      [class.technique-info--has-desc]="!!t.description"
                    >
                      <svg *ngIf="t.description" class="desc-chevron" [class.desc-chevron--open]="expandedTechniqueId === t.id" viewBox="0 0 12 12">
                        <polyline points="4,2 8,6 4,10" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
                      </svg>
                      <span class="technique-position">{{ t.starting_position }}</span>
                    </button>
                    <div class="technique-actions">
                      <button
                        *ngIf="t.youtube_url"
                        class="btn-video btn-video--curated"
                        (click)="playVideo(t)"
                        title="Watch curated tutorial"
                      >
                        <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14">
                          <path d="M6.5 4.5v7l5-3.5-5-3.5z"/>
                        </svg>
                        Watch
                      </button>
                      <a
                        *ngIf="!t.youtube_url"
                        [href]="t.youtube_search_url"
                        target="_blank"
                        rel="noopener"
                        class="btn-video btn-video--search"
                        title="Search YouTube"
                      >
                        <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14">
                          <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" stroke-width="1" fill="none"/>
                          <line x1="10" y1="10" x2="14" y2="14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                        </svg>
                        Search
                      </a>
                    </div>
                  </div>
                  <div class="technique-description" *ngIf="expandedTechniqueId === t.id && t.description">
                    <ul class="step-list">
                      <li *ngFor="let step of parseDescription(t.description)">{{ step }}</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div *ngIf="filteredGroups.length === 0" class="empty-state">
              <p>No techniques found{{ searchQuery ? ' for "' + searchQuery + '"' : '' }}.</p>
            </div>
          </div>

          <!-- Loading -->
          <div *ngIf="loading" class="loading-state">
            <p>Loading technique library...</p>
          </div>
        </div>

        <!-- Status bar -->
        <div class="retro-window__statusbar">
          {{ filteredCount }} techniques · {{ curatedCount }} with curated videos · {{ categories.length }} categories
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
    .techniques-window {
      width: 100%;
      max-width: 800px;
      min-height: calc(100vh - 52px - 48px);
    }

    /* Toolbar */
    .toolbar {
      background: var(--color-surface-muted);
      border-bottom: var(--border-subtle);
      padding: 12px 16px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .search-box {
      position: relative;
      display: flex;
      align-items: center;
    }
    .search-icon {
      position: absolute;
      left: 10px;
      width: 14px;
      height: 14px;
      color: var(--color-text-muted);
      pointer-events: none;
    }
    .search-input {
      width: 100%;
      padding: 8px 32px 8px 32px;
      border: var(--border-subtle);
      border-radius: 6px;
      font-family: var(--font-body);
      font-size: var(--text-sm);
      background: var(--color-surface);
      color: var(--color-text);
      outline: none;
    }
    .search-input:focus {
      border-color: var(--color-accent);
    }
    .search-input::placeholder {
      color: var(--color-text-muted);
    }
    .search-clear {
      position: absolute;
      right: 8px;
      background: none;
      border: none;
      font-size: 18px;
      color: var(--color-text-muted);
      cursor: pointer;
      padding: 0 4px;
      line-height: 1;
    }
    .category-tabs {
      display: flex;
      gap: 4px;
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
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
      white-space: nowrap;
      transition: all 0.15s;
    }
    .tab:hover {
      background: var(--color-desktop-darker);
    }
    .tab--active {
      background: var(--color-accent);
      color: var(--color-accent-text);
      border-color: var(--color-accent);
      font-weight: 600;
    }
    .tab-count {
      font-family: var(--font-mono);
      font-size: 10px;
      opacity: 0.7;
      margin-left: 2px;
    }

    /* Video player */
    .video-player {
      background: var(--color-navy);
      border-bottom: 2px solid var(--color-accent);
    }
    .video-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 16px;
    }
    .video-title {
      font-family: var(--font-body);
      font-size: var(--text-sm);
      font-weight: 600;
      color: var(--color-text-inverse);
    }
    .video-close {
      background: none;
      border: none;
      color: var(--color-text-inverse);
      font-size: 20px;
      cursor: pointer;
      opacity: 0.7;
      padding: 0 4px;
      line-height: 1;
    }
    .video-close:hover { opacity: 1; }
    .video-embed {
      position: relative;
      padding-bottom: 56.25%;
      height: 0;
    }
    .video-embed iframe {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
    }

    /* Technique groups */
    .techniques-body {
      background: var(--color-surface-muted);
      flex: 1;
      overflow-y: auto;
    }
    .groups {
      padding: 8px;
    }
    .subcategory-group {
      margin-bottom: 2px;
    }
    .group-header {
      width: 100%;
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 12px;
      background: var(--color-surface);
      border: var(--border-subtle);
      border-radius: 6px;
      cursor: pointer;
      font-family: var(--font-body);
      text-align: left;
      transition: background 0.1s;
    }
    .group-header:hover {
      background: var(--color-desktop);
    }
    .chevron {
      width: 12px;
      height: 12px;
      flex-shrink: 0;
      color: var(--color-text-muted);
      transition: transform 0.15s;
    }
    .chevron--open {
      transform: rotate(90deg);
    }
    .group-name {
      font-size: var(--text-base);
      font-weight: 600;
      color: var(--color-text);
      flex: 1;
    }
    .group-count {
      font-family: var(--font-mono);
      font-size: var(--text-xs);
      color: var(--color-text-muted);
    }
    .group-category-tag {
      font-size: 10px;
      font-weight: 500;
      padding: 2px 6px;
      border-radius: 3px;
      background: var(--color-desktop-darker);
      color: var(--color-text-secondary);
      white-space: nowrap;
    }

    /* Technique cards */
    .group-body {
      padding: 4px 0 8px 20px;
    }
    .technique-card {
      border-left: 2px solid var(--color-desktop-darker);
      margin-left: 4px;
      transition: border-color 0.1s;
    }
    .technique-card:hover {
      border-left-color: var(--color-accent);
    }
    .technique-card--expanded {
      border-left-color: var(--color-accent);
    }
    .technique-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 12px;
    }
    .technique-info {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 6px;
      background: none;
      border: none;
      padding: 0;
      cursor: default;
      font-family: var(--font-body);
      text-align: left;
    }
    .technique-info--has-desc {
      cursor: pointer;
    }
    .technique-info--has-desc:hover .technique-position {
      color: var(--color-text);
    }
    .desc-chevron {
      width: 10px;
      height: 10px;
      flex-shrink: 0;
      color: var(--color-text-muted);
      transition: transform 0.15s;
    }
    .desc-chevron--open {
      transform: rotate(90deg);
    }
    .technique-position {
      font-size: var(--text-sm);
      color: var(--color-text-secondary);
      transition: color 0.1s;
    }
    .technique-description {
      padding: 0 12px 10px 28px;
    }
    .step-list {
      margin: 0;
      padding: 0 0 0 16px;
      list-style: disc;
    }
    .step-list li {
      font-size: var(--text-xs);
      color: var(--color-text-secondary);
      line-height: 1.5;
      padding: 2px 0;
    }
    .technique-actions {
      flex-shrink: 0;
    }
    .btn-video {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 4px 10px;
      border-radius: 4px;
      font-family: var(--font-body);
      font-size: var(--text-xs);
      font-weight: 500;
      cursor: pointer;
      text-decoration: none;
      transition: all 0.15s;
      border: none;
    }
    .btn-video--curated {
      background: var(--color-accent);
      color: var(--color-accent-text);
    }
    .btn-video--curated:hover {
      background: var(--color-accent-hover);
    }
    .btn-video--search {
      background: transparent;
      border: var(--border-subtle);
      color: var(--color-text-secondary);
    }
    .btn-video--search:hover {
      background: var(--color-desktop);
      color: var(--color-text);
    }

    /* States */
    .empty-state, .loading-state {
      text-align: center;
      padding: 48px 20px;
      color: var(--color-text-muted);
      font-size: var(--text-sm);
    }

    @media (max-width: 600px) {
      .window-container { padding: 8px; }
      .techniques-window { min-height: calc(100vh - 52px - 16px); }
      .category-tabs { gap: 3px; }
      .tab { padding: 4px 8px; font-size: 10px; }
      .group-body { padding-left: 12px; }
    }
  `],
})
export class TechniquesComponent implements OnInit {
  allTechniques: LibraryTechnique[] = [];
  categories = CATEGORY_ORDER;
  activeCategory = 'all';
  searchQuery = '';
  loading = true;

  activeVideo: LibraryTechnique | null = null;
  activeVideoUrl: SafeResourceUrl | null = null;
  expandedTechniqueId: number | null = null;

  filteredGroups: SubcategoryGroup[] = [];
  filteredCount = 0;
  curatedCount = 0;

  constructor(private api: ApiService, private sanitizer: DomSanitizer) {}

  ngOnInit(): void {
    this.api.getLibrary().subscribe({
      next: (data) => {
        this.allTechniques = data;
        this.curatedCount = data.filter((t) => t.youtube_url).length;
        this.loading = false;
        this.rebuildGroups();
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  categoryLabel(cat: string): string {
    return CATEGORY_LABELS[cat] || cat;
  }

  getCategoryCount(cat: string): number {
    return this.allTechniques.filter((t) => t.category === cat).length;
  }

  setCategory(cat: string): void {
    this.activeCategory = cat;
    this.rebuildGroups();
  }

  onSearch(query: string): void {
    this.searchQuery = query;
    this.rebuildGroups();
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.rebuildGroups();
  }

  playVideo(t: LibraryTechnique): void {
    if (!t.youtube_url) return;
    this.activeVideo = t;
    const videoId = this.extractVideoId(t.youtube_url);
    if (videoId) {
      this.activeVideoUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
        `https://www.youtube.com/embed/${videoId}?autoplay=1`
      );
    }
  }

  closeVideo(): void {
    this.activeVideo = null;
    this.activeVideoUrl = null;
  }

  toggleDescription(t: LibraryTechnique): void {
    if (!t.description) return;
    this.expandedTechniqueId = this.expandedTechniqueId === t.id ? null : t.id;
  }

  parseDescription(description: string): string[] {
    return description
      .split('\n')
      .map((line) => line.replace(/^-\s*/, '').trim())
      .filter((line) => line.length > 0);
  }

  private extractVideoId(url: string): string | null {
    const match = url.match(/(?:v=|\/embed\/|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    return match ? match[1] : null;
  }

  private rebuildGroups(): void {
    let techniques = this.allTechniques;

    if (this.activeCategory !== 'all') {
      techniques = techniques.filter((t) => t.category === this.activeCategory);
    }

    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      techniques = techniques.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.subcategory.toLowerCase().includes(q) ||
          t.starting_position.toLowerCase().includes(q)
      );
    }

    this.filteredCount = techniques.length;

    // Group by subcategory
    const map = new Map<string, LibraryTechnique[]>();
    for (const t of techniques) {
      const key = t.subcategory;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(t);
    }

    this.filteredGroups = Array.from(map.entries()).map(([name, techs]) => ({
      name,
      techniques: techs,
      expanded: !!this.searchQuery.trim(), // auto-expand when searching
    }));
  }
}
