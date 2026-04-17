import {
  Component,
  ChangeDetectionStrategy,
  signal,
  input,
  computed,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, type SafeHtml } from '@angular/platform-browser';

interface SvgPathAttributes {
  d: string;
  fill?: string;
  opacity?: string;
  fillRule?: 'nonzero' | 'evenodd';
  stroke?: string;
  strokeWidth?: number | string;
  strokeLinecap?: 'butt' | 'round' | 'square';
  strokeLinejoin?: 'miter' | 'round' | 'bevel';
  [key: string]: unknown;
}

type LooseSvgPathAttributes = {
  d?: string;
  [key: string]: string | number | undefined;
};

export type IconSvgObject = readonly (readonly [
  string,
  SvgPathAttributes | LooseSvgPathAttributes,
])[];

@Component({
  selector: 'hugeicons-icon',
  standalone: true,
  imports: [CommonModule],
  template: ` <div class="icon" [innerHTML]="safeSvgElement()"></div> `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HugeiconsIconComponent {
  private sanitizer = inject(DomSanitizer);
  icon = input.required<IconSvgObject>();
  size = input<string | number>(24);
  strokeWidth = input<number | undefined>(undefined);
  color = input<string>('currentColor');
  class = input<string>('');

  html = signal<string>('');

  private camelToKebab(str: string): string {
    return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
  }

  svgElement = computed(() => {
    const svg = document.createElement('svg');
    svg.setAttribute('width', this.size().toString());
    svg.setAttribute('height', this.size().toString());
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('color', this.color());
    svg.setAttribute('class', this.class());
    svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

    const currentIcon = this.icon();

    for (let i = 0; i < currentIcon.length; i++) {
      const path = currentIcon[i];
      const tag = path[0];
      const attributes = path[1];
      const attributeKeys = Object.keys(attributes);

      const elm = document.createElement(tag);

      for (let y = 0; y < attributeKeys.length; y++) {
        elm.setAttribute(
          this.camelToKebab(attributeKeys[y]),
          String(attributes[attributeKeys[y]] ?? ''),
        );
      }

      elm.setAttribute('fill', String(attributes['fill'] ?? 'none'));
      elm.setAttribute(
        'stroke-width',
        String(this.strokeWidth() ?? attributes['strokeWidth'] ?? ''),
      );

      svg.appendChild(elm);
    }

    return svg.outerHTML;
  });

  safeSvgElement = computed<SafeHtml>(() => {
    return this.sanitizer.bypassSecurityTrustHtml(this.svgElement());
  });
}
