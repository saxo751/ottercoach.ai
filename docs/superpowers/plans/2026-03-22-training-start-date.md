# Training Start Date Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `training_start_month` field so experience is auto-calculated from a BJJ start date instead of a static integer.

**Architecture:** New `training_start_month` TEXT column (`"YYYY-MM"`) on users table. A `getExperienceMonths()` helper computes months from start date, falling back to existing `experience_months`. The field is set via onboarding chat, free chat profile updates, web profile page, and signup.

**Tech Stack:** TypeScript, SQLite (better-sqlite3), Express, Angular 18

**Spec:** `docs/superpowers/specs/2026-03-22-training-start-date-design.md`

---

### Task 1: Database Migration + Types + User Queries

**Files:**
- Modify: `bjj-coach/server/src/db/migrations.ts:324` (add v17 after v16)
- Modify: `bjj-coach/server/src/db/types.ts:9` (add field to User interface)
- Modify: `bjj-coach/server/src/db/queries/users.ts:9-41` (add to createUser + updateUser)

- [ ] **Step 1: Add migration v17**

In `bjj-coach/server/src/db/migrations.ts`, add as the last element of the `migrations` array (before the closing `];` on line 379):

```ts
  {
    version: 17,
    description: 'Add training_start_month column to users',
    up: `
      ALTER TABLE users ADD COLUMN training_start_month TEXT;
    `,
  },
```

- [ ] **Step 2: Add field to User interface**

In `bjj-coach/server/src/db/types.ts`, add after `experience_months: number | null;` (line 9):

```ts
  training_start_month: string | null; // "YYYY-MM"
```

- [ ] **Step 3: Add field to createUser**

In `bjj-coach/server/src/db/queries/users.ts`, add to the user object literal (after line 15):

```ts
    training_start_month: overrides.training_start_month || null,
```

Add `training_start_month` to both the column list and VALUES in the INSERT statement (lines 35-40). After `experience_months` in the column list, add `training_start_month`. Same in the VALUES line.

Column list becomes:
```
INSERT INTO users (id, email, password_hash, name, belt_rank, experience_months, training_start_month, preferred_game_style,
```

VALUES becomes:
```
VALUES (@id, @email, @password_hash, @name, @belt_rank, @experience_months, @training_start_month, @preferred_game_style,
```

- [ ] **Step 4: Add field to updateUser allowed list**

In `bjj-coach/server/src/db/queries/users.ts`, add `'training_start_month'` to the `allowed` array (line 52), after `'experience_months'`.

- [ ] **Step 5: Verify server compiles**

Run: `cd bjj-coach/server && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 6: Commit**

```bash
git add bjj-coach/server/src/db/migrations.ts bjj-coach/server/src/db/types.ts bjj-coach/server/src/db/queries/users.ts
git commit -m "Adds training_start_month column to users table"
```

---

### Task 2: Experience Calculation Helper

**Files:**
- Create: `bjj-coach/server/src/utils/experience.ts`

- [ ] **Step 1: Create the helper**

Create `bjj-coach/server/src/utils/experience.ts`:

```ts
/**
 * Compute experience in months from training_start_month (YYYY-MM).
 * Falls back to static experience_months if start month is not set.
 */
export function getExperienceMonths(user: {
  training_start_month?: string | null;
  experience_months?: number | null;
}): number | null {
  if (user.training_start_month) {
    const match = user.training_start_month.match(/^(\d{4})-(\d{2})$/);
    if (match) {
      const startYear = parseInt(match[1], 10);
      const startMonth = parseInt(match[2], 10);
      const now = new Date();
      const nowYear = now.getUTCFullYear();
      const nowMonth = now.getUTCMonth() + 1;
      const months = (nowYear - startYear) * 12 + (nowMonth - startMonth);
      return Math.max(0, months);
    }
  }
  return user.experience_months ?? null;
}

/**
 * Validate a training_start_month string.
 * Must be YYYY-MM format and not in the future.
 */
export function isValidTrainingStartMonth(value: string): boolean {
  const match = value.match(/^(\d{4})-(\d{2})$/);
  if (!match) return false;
  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  if (month < 1 || month > 12 || year < 1900) return false;
  const now = new Date();
  const nowYear = now.getUTCFullYear();
  const nowMonth = now.getUTCMonth() + 1;
  if (year > nowYear || (year === nowYear && month > nowMonth)) return false;
  return true;
}
```

- [ ] **Step 2: Verify server compiles**

Run: `cd bjj-coach/server && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add bjj-coach/server/src/utils/experience.ts
git commit -m "Adds experience calculation helper with validation"
```

---

### Task 3: AI Prompts — Profile Section + Onboarding Schema

**Files:**
- Modify: `bjj-coach/server/src/ai/prompts.ts:33-36` (buildProfileSection experience display)
- Modify: `bjj-coach/server/src/ai/prompts.ts:236` (onboarding known/missing field check)
- Modify: `bjj-coach/server/src/ai/prompts.ts:269-284` (onboarding DATA schema + field rules)

- [ ] **Step 1: Update buildProfileSection to use helper**

In `bjj-coach/server/src/ai/prompts.ts`, add import at line 1:

```ts
import { getExperienceMonths } from '../utils/experience.js';
```

Replace lines 33-37 (the experience display block):

```ts
  if (user.experience_months != null) {
    const years = Math.floor(user.experience_months / 12);
    const months = user.experience_months % 12;
    parts.push(`Experience: ${years > 0 ? `${years}y ` : ''}${months}m`);
  }
```

With:

```ts
  const expMonths = getExperienceMonths(user);
  if (expMonths != null) {
    const years = Math.floor(expMonths / 12);
    const months = expMonths % 12;
    parts.push(`Experience: ${years > 0 ? `${years}y ` : ''}${months}m`);
  }
```

- [ ] **Step 2: Update onboarding field check**

Replace line 236:
```ts
  check('experience (months training)', user.experience_months);
```

With:
```ts
  check('experience / training start date', user.training_start_month || user.experience_months);
```

- [ ] **Step 3: Update onboarding DATA schema**

In the `---DATA---` JSON block (around line 271), replace `"experience_months": number or null,` with:

```
  "training_start_month": "YYYY-MM or null",
```

In the field rules section (around line 282), replace the `experience_months` rule:
```
- experience_months: Convert naturally. "3 years" = 36. "about a year and a half" = 18. "6 months" = 6. "just started" = 1.
```

With:
```
- training_start_month: Convert to YYYY-MM. "3 years" → subtract 3 years from current date. "about a year and a half" → subtract 18 months. "just started" → current month. "started in March 2022" → "2022-03". Always produce YYYY-MM format.
```

- [ ] **Step 4: Verify server compiles**

Run: `cd bjj-coach/server && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add bjj-coach/server/src/ai/prompts.ts
git commit -m "Updates AI prompts to use auto-calculated experience"
```

---

### Task 4: Onboarding Handler — Extract + Validate training_start_month

**Files:**
- Modify: `bjj-coach/server/src/core/handlers/onboarding.ts:58-60` (replace experience_months extraction)

- [ ] **Step 1: Add import**

In `bjj-coach/server/src/core/handlers/onboarding.ts`, add import:

```ts
import { isValidTrainingStartMonth } from '../../utils/experience.js';
```

- [ ] **Step 2: Add training_start_month extraction**

After the `belt_rank` extraction block (after line 57), add:

```ts
    if (data.training_start_month && typeof data.training_start_month === 'string') {
      if (isValidTrainingStartMonth(data.training_start_month)) {
        updates.training_start_month = data.training_start_month;
      }
    }
```

Note: The spec says to drop `experience_months` from the onboarding AI schema, but we deliberately keep the existing `experience_months` extraction (lines 58-60) as a fallback. This is a conscious trade-off: it won't hurt and maintains backward compat if the AI provides it (e.g., from users who reply with a number rather than a date).

- [ ] **Step 3: Verify server compiles**

Run: `cd bjj-coach/server && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add bjj-coach/server/src/core/handlers/onboarding.ts
git commit -m "Extracts training_start_month from onboarding conversation"
```

---

### Task 5: Free Chat Handler — Profile Updates Schema

**Files:**
- Modify: `bjj-coach/server/src/ai/prompts.ts:437-443` (free chat profile_updates schema)
- Modify: `bjj-coach/server/src/core/handlers/freeChat.ts:101-119` (profile_updates processing)

- [ ] **Step 1: Add training_start_month to free chat DATA schema**

In `bjj-coach/server/src/ai/prompts.ts`, in the `buildFreeChatPrompt` function's profile_updates schema (around line 438), add after `"training_schedule"`:

```
  "training_start_month": "YYYY-MM or null",
```

- [ ] **Step 2: Add extraction in free chat handler**

In `bjj-coach/server/src/core/handlers/freeChat.ts`, add import:

```ts
import { isValidTrainingStartMonth } from '../../utils/experience.js';
```

In the profile_updates processing block (after line 112, after `current_focus_area`), add:

```ts
      if (p.training_start_month && typeof p.training_start_month === 'string') {
        if (isValidTrainingStartMonth(p.training_start_month)) {
          updates.training_start_month = p.training_start_month;
        }
      }
```

- [ ] **Step 3: Verify server compiles**

Run: `cd bjj-coach/server && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add bjj-coach/server/src/ai/prompts.ts bjj-coach/server/src/core/handlers/freeChat.ts
git commit -m "Adds training_start_month to free chat profile updates"
```

---

### Task 6: Dashboard API — Profile Endpoint

**Files:**
- Modify: `bjj-coach/server/src/api/routes/dashboard.ts:82-86` (PUT /profile allowed list)

- [ ] **Step 1: Add training_start_month to allowed fields + validation**

In `bjj-coach/server/src/api/routes/dashboard.ts`, add `'training_start_month'` to the `allowed` array (line 83), after `'experience_months'`.

Add import at the top of the file:

```ts
import { isValidTrainingStartMonth } from '../../utils/experience.js';
```

Then add validation after the profile_picture validation block (after line 119):

```ts
    if ('training_start_month' in fields) {
      const tsm = fields.training_start_month;
      if (tsm !== null) {
        if (typeof tsm !== 'string' || !isValidTrainingStartMonth(tsm as string)) {
          res.status(400).json({ error: 'training_start_month must be YYYY-MM format and not in the future' });
          return;
        }
      }
    }
```

- [ ] **Step 2: Verify server compiles**

Run: `cd bjj-coach/server && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add bjj-coach/server/src/api/routes/dashboard.ts
git commit -m "Adds training_start_month to profile API with validation"
```

---

### Task 7: Auth Signup — Accept training_start_month

**Files:**
- Modify: `bjj-coach/server/src/api/routes/auth.ts:22` (destructure from body)
- Modify: `bjj-coach/server/src/api/routes/auth.ts:61-72` (pass to createUser)

- [ ] **Step 1: Add to signup**

In `bjj-coach/server/src/api/routes/auth.ts` line 22, add `training_start_month` to the destructured body:

```ts
      const { email, password, name, belt_rank, experience_months, training_days, goals, telegram_bot_token, training_start_month } = req.body;
```

In the `createUser` call (around line 61-72), add after `experience_months`:

```ts
        training_start_month: training_start_month || null,
```

- [ ] **Step 2: Verify server compiles**

Run: `cd bjj-coach/server && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add bjj-coach/server/src/api/routes/auth.ts
git commit -m "Accepts training_start_month on signup"
```

---

### Task 8: Frontend — User Model + Profile Component

**Files:**
- Modify: `bjj-coach/web/src/app/shared/models/index.ts:6` (add to User interface)
- Modify: `bjj-coach/web/src/app/features/profile/profile.component.ts:87-91` (replace experience input)
- Modify: `bjj-coach/web/src/app/features/profile/profile.component.ts:741` (add form field)
- Modify: `bjj-coach/web/src/app/features/profile/profile.component.ts:883-887` (add to save)
- Modify: `bjj-coach/web/src/app/features/profile/profile.component.ts:988` (add to populateForm)

- [ ] **Step 1: Add to frontend User model**

In `bjj-coach/web/src/app/shared/models/index.ts`, add after `experience_months: number | null;` (line 6):

```ts
  training_start_month: string | null;
```

- [ ] **Step 2: Add form field to profile component**

In the component class (around line 741), add after `experienceMonths`:

```ts
  trainingStartMonth: string | null = null;
```

- [ ] **Step 3: Replace experience input in template**

In the template (lines 87-91), replace the experience field:

```html
            <!-- Experience -->
            <div class="field">
              <label class="field-label">Experience (months)</label>
              <input type="number" class="field-input field-input--short" [(ngModel)]="experienceMonths" min="0" placeholder="e.g. 18" />
            </div>
```

With:

```html
            <!-- Training start date -->
            <div class="field">
              <label class="field-label">When did you start training?</label>
              <input type="month" class="field-input field-input--short" [(ngModel)]="trainingStartMonth" [max]="maxMonth" />
              <span class="field-hint" *ngIf="trainingStartMonth">{{ computedExperience }}</span>
            </div>
```

- [ ] **Step 4: Add computed experience getter and maxMonth**

In the component class, add:

```ts
  get maxMonth(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  get computedExperience(): string {
    if (!this.trainingStartMonth) return '';
    const match = this.trainingStartMonth.match(/^(\d{4})-(\d{2})$/);
    if (!match) return '';
    const startYear = parseInt(match[1], 10);
    const startMonth = parseInt(match[2], 10);
    const now = new Date();
    const totalMonths = Math.max(0, (now.getFullYear() - startYear) * 12 + (now.getMonth() + 1 - startMonth));
    const years = Math.floor(totalMonths / 12);
    const months = totalMonths % 12;
    if (years > 0) return `${years}y ${months}m training`;
    return `${months}m training`;
  }
```

- [ ] **Step 5: Update save() to include training_start_month**

In the `save()` method (around line 883), add to the `updates` object after `experience_months`:

```ts
      training_start_month: this.trainingStartMonth,
```

- [ ] **Step 6: Update populateForm() to load training_start_month**

In `populateForm()` (around line 988), add after `this.experienceMonths = user.experience_months;`:

```ts
    this.trainingStartMonth = user.training_start_month;
```

- [ ] **Step 7: Commit**

```bash
git add bjj-coach/web/src/app/shared/models/index.ts bjj-coach/web/src/app/features/profile/profile.component.ts
git commit -m "Adds training start date picker to profile page"
```

---

### Task 9: Frontend — Dashboard Experience Display

**Files:**
- Modify: `bjj-coach/web/src/app/features/dashboard/dashboard.component.ts:37-39` (update experience display)

- [ ] **Step 1: Update dashboard profile card**

In `bjj-coach/web/src/app/features/dashboard/dashboard.component.ts`, replace lines 37-39:

```html
              <span *ngIf="profile.experience_months" class="meta-item">
                {{ profile.experience_months }} mo training
              </span>
```

With:

```html
              <span *ngIf="profile.training_start_month || profile.experience_months" class="meta-item">
                {{ formatExperience(profile) }}
              </span>
```

Add a `formatExperience` method to the component class:

```ts
  formatExperience(profile: User): string {
    if (profile.training_start_month) {
      const match = profile.training_start_month.match(/^(\d{4})-(\d{2})$/);
      if (match) {
        const now = new Date();
        const totalMonths = Math.max(0, (now.getFullYear() - parseInt(match[1])) * 12 + (now.getMonth() + 1 - parseInt(match[2])));
        const years = Math.floor(totalMonths / 12);
        const months = totalMonths % 12;
        return years > 0 ? `${years}y ${months}m training` : `${months}m training`;
      }
    }
    if (profile.experience_months) {
      return `${profile.experience_months} mo training`;
    }
    return '';
  }
```

- [ ] **Step 2: Commit**

```bash
git add bjj-coach/web/src/app/features/dashboard/dashboard.component.ts
git commit -m "Updates dashboard to show auto-calculated experience"
```

---

### Task 10: Smoke Test

- [ ] **Step 1: Verify server compiles**

Run: `cd bjj-coach/server && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 2: Start server and verify migration runs**

Run: `cd bjj-coach/server && npm run dev`
Expected: Console shows `[db] Running migration v17: Add training_start_month column to users`

- [ ] **Step 3: Verify Angular builds**

Run: `cd bjj-coach/web && npx ng build`
Expected: Build succeeds

- [ ] **Step 4: Final commit if any fixups needed**

```bash
git add -A && git commit -m "Fixes any build issues from training start date feature"
```
