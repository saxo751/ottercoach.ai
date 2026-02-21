---
name: retro-os-design
description: Apply a retro desktop OS aesthetic to web interfaces, inspired by PostHog's desktop-metaphor website. Warm parchment backgrounds, desktop icons as navigation, illustrated mascot scenes, window chrome only for opened content. Use this skill whenever building UI for the BJJ Coach Bot project. Triggers on keywords like retro, old school, OS style, desktop, nostalgic, PostHog-style.
---

# Retro Desktop Design System — BJJ Coach Bot

This skill defines the visual language for the BJJ Coach Bot web interface. The aesthetic is a **warm retro desktop** — not a strict Windows 95 clone, but a desktop OS *metaphor* where navigation happens through desktop icons, content opens in windows, and an illustrated mascot scene anchors the visual identity.

**Inspiration:** PostHog's website redesign — a warm parchment-textured desktop where file/folder icons serve as navigation, the mascot illustration is a centerpiece, and actual window chrome only appears when you "open" content. The vibe is cozy, playful, and developer-friendly.

**The tone:** A coach's desk, not a corporate app. Warm, lived-in, slightly messy in a charming way. The otter mascot appears in an isometric illustrated scene. Everything feels tangible — like objects on a desk rather than elements on a screen.

---

## Core Design Principles

1. **Desktop metaphor first.** The main view IS a desktop. Navigation happens through clickable icons with labels, not a nav bar or sidebar. The desktop background is visible and textured.
2. **Windows only for opened content.** Window chrome (title bar, controls, borders) only appears when the user opens something — the chat, a dashboard panel, a technique detail. On the desktop itself, no windows.
3. **Warm, not cold.** The palette is parchment, cream, warm grays, and orange accents. NOT the cold blue/teal of classic Win95. Think of aged paper, a warm office, earth tones.
4. **Illustrated mascot scene.** The otter mascot (in gi, with belt) appears in an isometric/illustrated scene on the desktop — a dojo, a mat area, a training scene. This is a visual anchor, not a logo.
5. **Icons are charming and distinct.** Each desktop icon should be visually unique and slightly retro — think early macOS or Windows XP icon style with warm colors. Not pixel art, not flat modern icons. Detailed, colorful, with character.
6. **Clean labels, readable type.** Icon labels and body text use a clean sans-serif. Pixel/mono fonts are reserved for very specific UI moments (status bars, timestamps, code-like data).

---

## Color Palette

Warm and desaturated, like a sun-faded desktop.

```css
:root {
  /* Desktop & backgrounds */
  --color-desktop: #f3efe6;
  --color-desktop-darker: #e8e2d6;
  --color-surface: #ffffff;
  --color-surface-muted: #faf8f4;

  /* Primary accent — warm orange */
  --color-accent: #f5a623;
  --color-accent-hover: #e09400;
  --color-accent-text: #1a1a1a;

  /* Secondary accent — deep navy */
  --color-navy: #1d2433;
  --color-navy-light: #2d3748;

  /* Window chrome */
  --color-titlebar: #e8e2d6;
  --color-titlebar-text: #1a1a1a;
  --color-titlebar-active: #f5a623;
  --color-window-bg: #f0ece4;
  --color-window-border: #c4bfb3;
  --color-window-shadow: rgba(0,0,0,0.12);

  /* Text */
  --color-text: #1a1a1a;
  --color-text-secondary: #5a5650;
  --color-text-muted: #9b9589;
  --color-text-inverse: #ffffff;

  /* BJJ belt colors */
  --color-belt-white: #f0ece4;
  --color-belt-blue: #3b82f6;
  --color-belt-purple: #8b5cf6;
  --color-belt-brown: #92400e;
  --color-belt-black: #1a1a1a;

  /* Status */
  --color-success: #22c55e;
  --color-warning: #f5a623;
  --color-danger: #ef4444;
  --color-info: #3b82f6;

  /* Borders & shadows */
  --border-subtle: 1px solid #d4cfc5;
  --border-medium: 2px solid #c4bfb3;
  --shadow-window: 0 4px 24px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.06);
  --shadow-window-active: 0 8px 40px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08);
}
```

---

## Typography

Clean and readable. Retro character comes from the desktop metaphor, not from fonts.

```css
:root {
  --font-body: 'DM Sans', 'Segoe UI', system-ui, sans-serif;
  --font-display: 'Bricolage Grotesque', 'DM Sans', sans-serif;
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
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@400;600;800&family=DM+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">
```

Rules: Desktop icon labels use `--font-body` at 13px, weight 500. Window titles use `--font-body` at 13px, weight 600. Chat messages use `--font-body` at 15px. Data/timestamps use `--font-mono` at 11px.

---

## Desktop Background

Warm parchment with subtle paper grain texture.

```css
body.desktop {
  background-color: var(--color-desktop);
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E");
  min-height: 100vh;
}
```

---

## Desktop Icons

Primary navigation. Arranged in columns on left and right sides of the desktop.

### Individual Icon

```css
.desktop-icon {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
  cursor: pointer;
  border-radius: 4px;
  text-decoration: none;
  color: var(--color-text);
  transition: background 0.15s ease;
  min-width: 80px;
  max-width: 100px;
}

.desktop-icon:hover {
  background: rgba(0, 0, 0, 0.06);
}

.desktop-icon__image {
  width: 48px;
  height: 48px;
  object-fit: contain;
}

.desktop-icon__label {
  font-family: var(--font-body);
  font-size: 13px;
  font-weight: 500;
  text-align: center;
  line-height: 1.2;
}
```

Use file-extension labels: "coach.chat", "techniques/", "stats.dashboard", "focus-plan.md". Icons should be detailed SVGs (48x48), not emoji or flat icons.

### Mobile

On mobile, icons go into a two-column grid (matching PostHog's mobile layout).

---

## Window Chrome

Appears when user opens content. Warm gray title bar, colored dot controls (macOS-style), soft shadows. NOT hard beveled Win95 borders.

```css
.retro-window {
  background: var(--color-surface);
  border: var(--border-medium);
  border-radius: 8px 8px 4px 4px;
  box-shadow: var(--shadow-window);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.retro-window__titlebar {
  background: var(--color-titlebar);
  padding: 8px 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  border-bottom: var(--border-subtle);
  cursor: grab;
}

.retro-window__controls {
  display: flex;
  gap: 6px;
}

.retro-window__dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 1px solid rgba(0,0,0,0.15);
  cursor: pointer;
}

.retro-window__dot--close { background: #ef6b5e; }
.retro-window__dot--minimize { background: #f5bf4f; }
.retro-window__dot--maximize { background: #62c554; }

.retro-window__title {
  font-family: var(--font-body);
  font-size: 13px;
  font-weight: 600;
  color: var(--color-titlebar-text);
}

.retro-window__statusbar {
  background: var(--color-desktop);
  padding: 4px 12px;
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--color-text-muted);
  border-top: var(--border-subtle);
}
```

---

## Chat Messages

Coach messages: parchment background, left-aligned with avatar. User messages: orange background, right-aligned.

```css
.chat-msg__bubble--coach {
  background: var(--color-desktop);
  border: var(--border-subtle);
  border-radius: 2px 12px 12px 12px;
  padding: 10px 14px;
}

.chat-msg__bubble--user {
  background: var(--color-accent);
  color: var(--color-accent-text);
  border-radius: 12px 2px 12px 12px;
  padding: 10px 14px;
}
```

Quick reply buttons: pill-shaped, subtle border, turn orange on hover.

---

## Buttons

Primary CTA: orange with dark border (PostHog-style). Secondary: outlined. Ghost: minimal.

```css
.btn-primary {
  background: var(--color-accent);
  color: var(--color-accent-text);
  border: 2px solid var(--color-text);
  border-radius: 6px;
  padding: 8px 20px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
}

.btn-secondary {
  background: transparent;
  border: var(--border-subtle);
  border-radius: 6px;
  padding: 8px 20px;
  cursor: pointer;
}
```

---

## Mascot Scene

The otter mascot in an isometric illustrated scene — positioned in the lower-right quadrant of the desktop. Decorative, not interactive.

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

## Do's and Don'ts

**DO:** Use warm parchment background with paper grain texture. Make desktop icons detailed, colorful, and charming with file-extension labels. Use orange as primary accent. Use modern soft shadows on windows. Keep body text clean with DM Sans. Place mascot scene in lower-right. Use macOS-style colored dots for window controls.

**DON'T:** Use classic teal Win95 desktop. Apply hard 3D beveled borders. Use pixel fonts for body text. Use a taskbar at the bottom. Use blue gradient title bars. Put emoji as desktop icons. Use sharp Win95 corners (use border-radius 4-8px).
