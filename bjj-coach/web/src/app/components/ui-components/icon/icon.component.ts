import { CommonModule } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { HugeiconsIconComponent } from './hugeicons-icon.component';
import { resolveIcon, type IconName, type IconVariant } from './icon-registry';

@Component({
  selector: 'ui-icon',
  standalone: true,
  imports: [CommonModule, HugeiconsIconComponent],
  template: `
    @if (stroke() !== undefined) {
      <hugeicons-icon
        class="fill-current stroke-current icon"
        [icon]="icon()"
        [strokeWidth]="stroke()!"
      />
    } @else {
      <hugeicons-icon class="fill-current stroke-current icon" [icon]="icon()" />
    }
  `,
  styles: [`.icon ::ng-deep svg { width: 1em; height: 1em; }`],
})
export class IconComponent {
  public readonly name = input.required<IconName>();
  public readonly variant = input<IconVariant | null>('auto');
  public readonly stroke = input<number | undefined>(undefined);

  public readonly icon = computed(() =>
    resolveIcon(this.name(), this.variant() || 'auto'),
  );
}
