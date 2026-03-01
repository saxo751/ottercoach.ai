import { Component, EventEmitter, Input, Output, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, Subscription, debounceTime, distinctUntilChanged, switchMap, of } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import type { Technique, LibraryTechnique } from '../../shared/models';

@Component({
  selector: 'app-technique-picker',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="picker">
      <span class="picker-label">{{ label }}</span>

      <!-- Selected chips -->
      <div class="chips" *ngIf="selected.length > 0">
        <span class="chip" *ngFor="let name of selected">
          {{ name }}
          <button class="chip-remove" (click)="remove(name)">&times;</button>
        </span>
      </div>

      <!-- Search input -->
      <div class="search-row">
        <input
          type="text"
          class="search-input"
          [placeholder]="selected.length ? 'Add another...' : 'Search techniques...'"
          [(ngModel)]="query"
          (ngModelChange)="onQueryChange($event)"
          (focus)="showDropdown = true"
          (keydown.enter)="addCustom()"
        />
        <button
          class="ai-btn"
          [class.ai-btn--active]="showAI"
          (click)="toggleAI()"
          title="Describe a technique to identify it"
        >AI</button>
      </div>

      <!-- AI describe panel -->
      <div class="ai-panel" *ngIf="showAI">
        <textarea
          class="ai-textarea"
          [(ngModel)]="aiDescription"
          rows="2"
          placeholder="Describe the technique (e.g. 'that sweep from half guard where you underhook and come up')"
        ></textarea>
        <button class="ai-search-btn" (click)="identifyTechnique()" [disabled]="aiLoading || !aiDescription.trim()">
          {{ aiLoading ? 'Thinking...' : 'Identify' }}
        </button>
        <div class="ai-suggestions" *ngIf="aiSuggestions.length > 0">
          <button
            class="dropdown-item"
            *ngFor="let s of aiSuggestions"
            (click)="addTechnique(s)"
          >{{ s }}</button>
        </div>
      </div>

      <!-- Dropdown -->
      <div class="dropdown" *ngIf="showDropdown && (filteredUser.length > 0 || filteredLibrary.length > 0 || (query.trim() && !matchesExisting()))">
        <div *ngIf="filteredUser.length > 0" class="dropdown-section">
          <span class="dropdown-section-label">Your Techniques</span>
          <button
            class="dropdown-item"
            *ngFor="let t of filteredUser"
            (click)="addTechnique(t.name)"
          >{{ t.name }}</button>
        </div>
        <div *ngIf="filteredLibrary.length > 0" class="dropdown-section">
          <span class="dropdown-section-label">Library</span>
          <button
            class="dropdown-item"
            *ngFor="let t of filteredLibrary"
            (click)="addTechnique(t.name)"
          >{{ t.name }}</button>
        </div>
        <div *ngIf="query.trim() && !matchesExisting()" class="dropdown-section">
          <button class="dropdown-item dropdown-item--custom" (click)="addCustom()">
            Add "{{ query.trim() }}"
          </button>
        </div>
      </div>

      <!-- Click-away overlay -->
      <div class="click-away" *ngIf="showDropdown" (click)="showDropdown = false"></div>
    </div>
  `,
  styles: [`
    .picker {
      display: flex;
      flex-direction: column;
      gap: 4px;
      position: relative;
    }
    .picker-label {
      font-size: var(--text-xs);
      font-weight: 600;
      color: var(--color-text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }
    .chips {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
    }
    .chip {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      background: var(--color-accent);
      color: var(--color-accent-text);
      font-size: var(--text-xs);
      font-weight: 600;
      padding: 2px 8px;
      border-radius: 4px;
    }
    .chip-remove {
      background: none;
      border: none;
      color: inherit;
      font-size: 14px;
      cursor: pointer;
      padding: 0 2px;
      line-height: 1;
      opacity: 0.7;
    }
    .chip-remove:hover { opacity: 1; }
    .search-row {
      display: flex;
      gap: 4px;
    }
    .search-input {
      flex: 1;
      font-family: var(--font-body);
      font-size: var(--text-sm);
      padding: 8px 10px;
      border: var(--border-subtle);
      border-radius: 4px;
      background: var(--color-surface-muted);
      color: var(--color-text);
      outline: none;
      transition: border-color 0.15s;
    }
    .search-input:focus { border-color: var(--color-accent); }
    .ai-btn {
      font-family: var(--font-mono);
      font-size: var(--text-xs);
      font-weight: 700;
      padding: 6px 10px;
      border: var(--border-subtle);
      border-radius: 4px;
      background: var(--color-surface-muted);
      color: var(--color-text-muted);
      cursor: pointer;
      transition: all 0.15s;
    }
    .ai-btn:hover { color: var(--color-text); border-color: var(--color-accent); }
    .ai-btn--active {
      background: var(--color-accent);
      color: var(--color-accent-text);
      border-color: var(--color-accent);
    }
    .ai-panel {
      display: flex;
      flex-direction: column;
      gap: 6px;
      padding: 8px;
      border: var(--border-subtle);
      border-radius: 4px;
      background: var(--color-surface-muted);
    }
    .ai-textarea {
      font-family: var(--font-body);
      font-size: var(--text-sm);
      padding: 6px 8px;
      border: var(--border-subtle);
      border-radius: 4px;
      background: var(--color-surface);
      color: var(--color-text);
      outline: none;
      resize: vertical;
    }
    .ai-textarea:focus { border-color: var(--color-accent); }
    .ai-search-btn {
      align-self: flex-end;
      font-family: var(--font-body);
      font-size: var(--text-xs);
      font-weight: 600;
      padding: 4px 12px;
      border-radius: 4px;
      border: 2px solid var(--color-text);
      background: var(--color-accent);
      color: var(--color-accent-text);
      cursor: pointer;
    }
    .ai-search-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .ai-suggestions {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .dropdown {
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      z-index: 50;
      background: var(--color-surface);
      border: var(--border-subtle);
      border-radius: 4px;
      box-shadow: var(--shadow-window-active);
      max-height: 200px;
      overflow-y: auto;
    }
    .dropdown-section {
      display: flex;
      flex-direction: column;
    }
    .dropdown-section-label {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      color: var(--color-text-muted);
      padding: 6px 10px 2px;
      letter-spacing: 0.05em;
    }
    .dropdown-item {
      display: block;
      width: 100%;
      text-align: left;
      font-family: var(--font-body);
      font-size: var(--text-sm);
      padding: 6px 10px;
      border: none;
      background: none;
      color: var(--color-text);
      cursor: pointer;
    }
    .dropdown-item:hover { background: var(--color-surface-muted); }
    .dropdown-item--custom {
      color: var(--color-accent);
      font-weight: 600;
    }
    .click-away {
      position: fixed;
      inset: 0;
      z-index: 49;
    }
  `],
})
export class TechniquePickerComponent implements OnInit, OnDestroy {
  @Input() label = 'Techniques';
  @Input() selected: string[] = [];
  @Input() userTechniques: Technique[] = [];
  @Output() selectedChange = new EventEmitter<string[]>();

  query = '';
  showDropdown = false;
  showAI = false;
  aiDescription = '';
  aiLoading = false;
  aiSuggestions: string[] = [];

  filteredUser: Technique[] = [];
  filteredLibrary: LibraryTechnique[] = [];

  private search$ = new Subject<string>();
  private searchSub?: Subscription;

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.searchSub = this.search$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(q => q.length >= 2 ? this.api.getLibrary({ search: q }) : of([]))
    ).subscribe(results => {
      this.filteredLibrary = results
        .filter(t => !this.selected.includes(t.name))
        .slice(0, 8);
    });
  }

  ngOnDestroy(): void {
    this.searchSub?.unsubscribe();
  }

  onQueryChange(q: string): void {
    this.showDropdown = true;
    const words = q.toLowerCase().split(/\s+/).filter(w => w.length > 0);

    // Filter user techniques locally — every word must appear somewhere in the name
    this.filteredUser = words.length > 0
      ? this.userTechniques
          .filter(t => {
            const name = t.name.toLowerCase();
            return words.every(w => name.includes(w)) && !this.selected.includes(t.name);
          })
          .slice(0, 5)
      : [];

    // Debounced library search
    this.search$.next(q);
  }

  matchesExisting(): boolean {
    const q = this.query.trim().toLowerCase();
    return this.filteredUser.some(t => t.name.toLowerCase() === q) ||
           this.filteredLibrary.some(t => t.name.toLowerCase() === q) ||
           this.selected.some(s => s.toLowerCase() === q);
  }

  addTechnique(name: string): void {
    if (!this.selected.includes(name)) {
      this.selected = [...this.selected, name];
      this.selectedChange.emit(this.selected);
    }
    this.query = '';
    this.showDropdown = false;
    this.filteredUser = [];
    this.filteredLibrary = [];
  }

  addCustom(): void {
    const name = this.query.trim();
    if (name && !this.selected.includes(name)) {
      this.addTechnique(name);
    }
  }

  remove(name: string): void {
    this.selected = this.selected.filter(s => s !== name);
    this.selectedChange.emit(this.selected);
  }

  toggleAI(): void {
    this.showAI = !this.showAI;
    if (!this.showAI) {
      this.aiSuggestions = [];
      this.aiDescription = '';
    }
  }

  identifyTechnique(): void {
    if (!this.aiDescription.trim() || this.aiLoading) return;
    this.aiLoading = true;
    this.aiSuggestions = [];

    this.api.identifyTechniques(this.aiDescription.trim()).subscribe({
      next: (res) => {
        this.aiSuggestions = res.suggestions || [];
        this.aiLoading = false;
      },
      error: () => {
        this.aiLoading = false;
      },
    });
  }
}
