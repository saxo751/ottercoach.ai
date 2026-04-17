---
name: anthropic-design
description: Apply Anthropic's official brand aesthetic to web and mobile interfaces. Clean, warm, and minimal — Anthropic's color palette, Poppins/Lora typography, and accent system. Keeps the project's otter mascots and desktop icon navigation. Use this skill whenever building UI for the BJJ Coach Bot project.
---

# Anthropic Brand Design System — BJJ Coach Bot

This skill defines the visual language for the BJJ Coach Bot interface, built on **Anthropic's official brand guidelines**. Clean, warm, and minimal — with the project's signature otter mascots and desktop icon navigation layered on top.

**The tone:** A coach's desk, not a corporate app. Anthropic's restrained palette keeps things calm and focused. The otter mascot and desktop icons add personality without fighting the brand.

---

## Core Design Principles

1. **Anthropic's palette is the foundation.** Dark (`#141413`), Light (`#faf9f5`), accents of Orange (`#d97757`), Blue (`#6a9bcc`), Green (`#788c5d`). No other brand colors.
2. **Desktop metaphor for navigation.** The main view IS a desktop. Navigation through clickable icons with file-extension labels. No nav bar.
3. **Windows only for opened content.** Window chrome (title bar, controls) only appears when the user opens something. On the desktop itself, no windows.
4. **Illustrated mascot scene.** The otter mascot appears in scenes on the desktop — decorative, not interactive.
5. **Typography is Poppins + Lora.** Headings in Poppins (clean geometric sans), body text in Lora (readable serif). Monospace only for data/timestamps.
6. **Minimal, not busy.** Anthropic's brand is restrained. White space is a feature. Fewer borders, softer shadows, less visual noise.

---

## Color Palette

Anthropic's official brand colors, extended with BJJ belt colors and status indicators.

```css
:root {
  /* Anthropic Main Colors */
  --color-dark: #141413;
  --color-light: #faf9f5;
  --color-mid-gray: #b0aea5;
  --color-light-gray: #e8e6dc;

  /* Anthropic Accent Colors */
  --color-accent: #d97757;        /* Orange — primary accent */
  --color-accent-secondary: #6a9bcc; /* Blue — secondary accent */
  --color-accent-tertiary: #788c5d;  /* Green — tertiary accent */

  /* Derived from Anthropic palette */
  --color-desktop: #faf9f5;       /* Light — desktop background */
  --color-surface: #ffffff;        /* Content surfaces */
  --color-surface-muted: #f5f4f0; /* Subtle card backgrounds */
  --color-titlebar: #e8e6dc;      /* Light Gray — window chrome */
  --color-window-border: #b0aea5; /* Mid Gray — borders */

  /* Text — derived from Dark */
  --color-text: #141413;
  --color-text-secondary: #4a4a46;
  --color-text-muted: #b0aea5;
  --color-text-inverse: #faf9f5;

  /* BJJ belt colors (project-specific) */
  --color-belt-white: #e8e6dc;
  --color-belt-blue: #6a9bcc;
  --color-belt-purple: #8b5cf6;
  --color-belt-brown: #92400e;
  --color-belt-black: #141413;

  /* Status — using Anthropic accents where possible */
  --color-success: #788c5d;       /* Green accent */
  --color-warning: #d97757;       /* Orange accent */
  --color-danger: #c44d3b;        /* Darker orange for danger */
  --color-info: #6a9bcc;          /* Blue accent */

  /* Borders & shadows — softer, Anthropic-minimal */
  --border-subtle: 1px solid #e8e6dc;
  --border-medium: 1px solid #b0aea5;
  --shadow-window: 0 2px 16px rgba(20, 20, 19, 0.06);
  --shadow-window-active: 0 4px 24px rgba(20, 20, 19, 0.10);
}
```

---

## Typography

Anthropic's official fonts: **Poppins** for headings, **Lora** for body text. Monospace for data.

```css
:root {
  --font-heading: 'Poppins', Arial, sans-serif;
  --font-body: 'Lora', Georgia, serif;
  --font-mono: 'IBM Plex Mono', 'Courier New', monospace;

  --text-xs: 11px;
  --text-sm: 13px;
  --text-base: 15px;
  --text-lg: 18px;
  --text-xl: 24px;
  --text-2xl: 32px;
}
```

Font loading:
```html
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&family=Lora:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">
```

Rules:
- **Headings (24pt+):** Poppins, weight 600–800
- **Subheadings / labels:** Poppins, weight 500, uppercase, letter-spacing 0.5px
- **Body text:** Lora, weight 400–500, 15px
- **Desktop icon labels:** Poppins, 13px, weight 500
- **Window titles:** Poppins, 13px, weight 600
- **Chat messages:** Lora, 15px
- **Data/timestamps:** IBM Plex Mono, 11px

---

## Desktop Background

Clean Anthropic Light with subtle paper grain.

```css
body.desktop {
  background-color: var(--color-light);
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.02'/%3E%3C/svg%3E");
  min-height: 100vh;
}
```

---

## Desktop Icons

Primary navigation. File-extension labels. Detailed SVGs, warm and charming.

```css
.desktop-icon {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
  cursor: pointer;
  border-radius: 6px;
  text-decoration: none;
  color: var(--color-text);
  transition: background 0.15s ease;
  min-width: 80px;
  max-width: 100px;
}

.desktop-icon:hover {
  background: rgba(20, 20, 19, 0.04);
}

.desktop-icon__image {
  width: 48px;
  height: 48px;
  object-fit: contain;
}

.desktop-icon__label {
  font-family: var(--font-heading);
  font-size: 13px;
  font-weight: 500;
  text-align: center;
  line-height: 1.2;
}
```

Use file-extension labels: "coach.chat", "techniques/", "stats.dashboard", "focus-plan.md". Icons should be detailed SVGs (48x48).

### Mobile

On mobile, icons go into a two-column grid.

---

## Window Chrome

Anthropic Light Gray title bar, macOS-style dot controls, soft shadows.

```css
.retro-window {
  background: var(--color-surface);
  border: var(--border-medium);
  border-radius: 8px;
  box-shadow: var(--shadow-window);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.retro-window__titlebar {
  background: var(--color-light-gray);
  padding: 8px 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  border-bottom: var(--border-subtle);
}

.retro-window__controls {
  display: flex;
  gap: 6px;
}

.retro-window__dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.retro-window__dot--close { background: #d97757; }    /* Anthropic Orange */
.retro-window__dot--minimize { background: #b0aea5; }  /* Anthropic Mid Gray */
.retro-window__dot--maximize { background: #788c5d; }  /* Anthropic Green */

.retro-window__title {
  font-family: var(--font-heading);
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text);
}

.retro-window__statusbar {
  background: var(--color-light-gray);
  padding: 4px 12px;
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--color-text-muted);
  border-top: var(--border-subtle);
}
```

---

## Chat Messages

Coach messages: light surface, left-aligned. User messages: Anthropic Orange background, right-aligned.

```css
.chat-msg__bubble--coach {
  background: var(--color-surface-muted);
  border: var(--border-subtle);
  border-radius: 2px 12px 12px 12px;
  padding: 10px 14px;
  font-family: var(--font-body);
}

.chat-msg__bubble--user {
  background: var(--color-accent);
  color: var(--color-text-inverse);
  border-radius: 12px 2px 12px 12px;
  padding: 10px 14px;
  font-family: var(--font-body);
}
```

Quick reply buttons: pill-shaped, Anthropic Orange border, fills on hover.

---

## Buttons

Primary: Anthropic Orange. Secondary: outlined with Mid Gray. Ghost: minimal.

```css
.btn-primary {
  background: var(--color-accent);
  color: var(--color-text-inverse);
  border: none;
  border-radius: 6px;
  padding: 10px 24px;
  font-family: var(--font-heading);
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: opacity 0.15s;
}

.btn-primary:hover {
  opacity: 0.9;
}

.btn-secondary {
  background: transparent;
  border: var(--border-medium);
  border-radius: 6px;
  padding: 10px 24px;
  font-family: var(--font-heading);
  font-weight: 500;
  font-size: 14px;
  cursor: pointer;
  color: var(--color-text);
}

.btn-secondary:hover {
  background: var(--color-light-gray);
}
```

---

## Icon System (HugeIcons Pro)

All icons use the **HugeIcons Pro** library via a registry pattern. Icons are managed in `bjj-coach/web/src/app/components/ui-components/icon/icon-registry.ts`.

### Usage

```html
<ui-icon name="calendar-01" />
<ui-icon name="tick-01" variant="solid" />
<ui-icon name="arrow-right-01" variant="stroke-sharp" />
```

Import `IconComponent` from `@components/ui-components/icon/icon.component` in your standalone component's `imports` array.

### Available Icons

**Navigation:** `search-01`, `help-circle`, `arrow-left-01`, `arrow-right-01`, `arrow-down-01`, `arrow-up-01`, `cancel-01`, `cancel-circle`, `menu-01`, `home-01`, `grid`, `logout-03`

**Actions:** `tick-01`, `tick-02`, `plus-sign`, `plus-sign-circle`, `minus-sign-circle`, `edit-01`, `pencil-edit-01`, `delete-03`, `more-horizontal`, `filter-horizontal`, `refresh-01`, `view`, `view-off`

**Time:** `calendar-01`, `clock-01`

**Communication:** `message-02`, `chat-done`, `notification-02`, `sent`, `information-circle`, `alert-circle`, `checkmark-circle-02`, `checkmark-badge-01`

**Users:** `user-01`, `user-02`, `user-circle`

**BJJ / Training:** `star`, `star-half`, `award-01`, `champion`, `medal-01`, `fire`, `zap-01`, `flag-01`, `thumbs-up`, `repeat`, `dashboard-speed-01`, `record`, `idea-01`

**Settings:** `setting-07`

### Variants

Each icon supports a subset of: `stroke` (default), `stroke-sharp`, `solid`, `solid-sharp`, `auto` (resolves to `stroke`). If a variant is missing, the `help-circle` fallback renders.

### Adding a New Icon

1. Find the icon at [hugeicons.com](https://hugeicons.com/)
2. Import from the appropriate `@hugeicons-pro/core-*` package in `icon-registry.ts`
3. Add a kebab-case entry to the `icons` object with variant mappings
4. The `IconName` type is auto-inferred — no extra type changes needed

### Packages Installed

- `@hugeicons-pro/core-stroke-rounded`
- `@hugeicons-pro/core-stroke-sharp`
- `@hugeicons-pro/core-solid-rounded`
- `@hugeicons-pro/core-solid-sharp`

Registry configured via `.npmrc`: `@hugeicons-pro:registry=https://npm.hugeicons.com/`

---

## Cards

Content cards use Anthropic's light palette with minimal borders.

```css
.card {
  background: var(--color-surface);
  border: var(--border-subtle);
  border-radius: 8px;
  padding: 16px;
}

.card--accent {
  background: var(--color-surface);
  border-left: 3px solid var(--color-accent);
}

.card__label {
  font-family: var(--font-heading);
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--color-accent);
}
```

---

## Mascot Scene

The otter mascot in an illustrated scene — lower-right quadrant of the desktop.

```css
.desktop-scene {
  position: fixed;
  bottom: 0;
  right: 0;
  width: 55%;
  max-width: 700px;
  pointer-events: none;
  z-index: 1;
}

@media (max-width: 768px) {
  .desktop-scene {
    position: static;
    width: 100%;
    margin-top: 20px;
  }
}
```

---

## Otter Mascot Library

The project has SVG otter illustrations at `bjj-coach/web/src/assets/otters/`. **Every new screen/window MUST include a relevant otter** in the titlebar.

| File | Mood / Context | Use On |
|------|---------------|--------|
| `Otter-relaxed-with-arms-crossed.svg` | Confident, chill (with belt) | Landing page desktop scene |
| `Otter-relaxed-with-arms-crossed-no-belt.svg` | Confident, chill | Chat titlebar |
| `Otter-ready-fight-stance.svg` | Ready, energized | Dashboard titlebar |
| `Otter-ready-fight-stance-gi.svg` | Ready, energized (with gi) | Login page hero |
| `Otter-meditating.svg` | Calm, focused | Focus Timeline, loading, typing |
| `Otter-armbar-turtle.svg` | Playful, technical | Techniques titlebar |
| `Otter-with-finger-in-air.svg` | Idea, eureka | Ideas titlebar |
| `Otter-approving-with-thumbs-up.svg` | Positive, encouraging | Profile, signup, empty states |
| `Otter-confused.svg` | Lost, searching | Empty search results |
| `Otter-trippin-turtle.svg` | Silly, unexpected | Error states, 404 |
| `otter_base.svg` | Neutral base | Fallback |

### Usage

```html
<div class="retro-window__titlebar">
  <div class="retro-window__controls">...</div>
  <span class="retro-window__title">window.title</span>
  <img src="assets/otters/Otter-meditating.svg" alt="" class="titlebar-otter" />
</div>
```

---

## React Native Theme Mapping

For the mobile app (`bjj-coach/mobile/src/theme/`), use these Anthropic values:

```typescript
// colors.ts
export const colors = {
  dark: '#141413',        // Anthropic Dark
  light: '#faf9f5',       // Anthropic Light (replaces parchment)
  surface: '#ffffff',
  surfaceMuted: '#f5f4f0',
  lightGray: '#e8e6dc',   // Anthropic Light Gray
  midGray: '#b0aea5',     // Anthropic Mid Gray
  accent: '#d97757',      // Anthropic Orange
  accentBlue: '#6a9bcc',  // Anthropic Blue
  accentGreen: '#788c5d', // Anthropic Green
  text: '#141413',
  textLight: '#faf9f5',
  textMuted: '#b0aea5',
  border: '#e8e6dc',
  white: '#ffffff',
  error: '#c44d3b',
};

// fonts.ts
import { Platform } from 'react-native';
export const fonts = {
  heading: Platform.select({ ios: 'Poppins-SemiBold', android: 'Poppins-SemiBold', default: 'System' }),
  body: Platform.select({ ios: 'Lora', android: 'Lora', default: 'Georgia' }),
  mono: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
};
```

---

## Do's and Don'ts

**DO:** Use Anthropic's `#141413` / `#faf9f5` / `#d97757` palette exclusively. Use Poppins for headings, Lora for body. Keep layouts minimal with generous white space. Use soft shadows (`rgba(20,20,19,0.06)`). Make desktop icons charming with file-extension labels. Include a relevant otter in every window titlebar. Use Orange as primary accent, Blue/Green as secondary.

**DON'T:** Use colors outside the Anthropic palette. Use heavy borders or hard shadows. Mix in other brand aesthetics. Use sans-serif for body text (use Lora). Create a new window without an otter. Use more than 2 accent colors on one screen. Use bold/heavy visual treatments — Anthropic's brand is restrained.
