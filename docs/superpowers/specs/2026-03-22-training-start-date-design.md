# Training Start Date — Auto-Calculated Experience

## Problem

Experience is stored as a static `experience_months` integer that never updates. Users must manually correct it over time. A BJJ start date allows the system to always compute current experience automatically.

## Decision Summary

| Question | Decision |
|----------|----------|
| Where to set it | Both onboarding (conversational) and web profile (date picker) |
| Backward compatibility | `training_start_month` takes priority; fall back to static `experience_months` if not set |
| Precision | Month and year only (`"YYYY-MM"` string) |
| Storage format | `TEXT` column, `"YYYY-MM"` format (e.g., `"2022-03"`) |

## Design

### 1. Database

New migration (v17):

```sql
ALTER TABLE users ADD COLUMN training_start_month TEXT;
```

No changes to `experience_months` — it remains as a fallback.

### 2. Experience Calculation Helper

New function in `src/utils/experience.ts`:

```ts
function getExperienceMonths(user: { training_start_month?: string | null; experience_months?: number | null }): number | null
```

- If `training_start_month` is set: parse `"YYYY-MM"`, diff against current UTC year/month, return total months. Returns `0` for current month (not `null`).
- Else: return `experience_months` (may be `null`)
- Uses UTC month arithmetic — acceptable given month-only precision.

Used everywhere experience is needed — replaces direct reads of `experience_months`.

### 3. Onboarding

In `src/ai/prompts.ts` — onboarding `---DATA---` JSON schema:

- Add `"training_start_month": "YYYY-MM or null"` to the extraction schema
- Update prompt guidance: "Convert 'about 3 years' to approximate YYYY-MM based on current date. 'Just started' = current month."

In `src/core/handlers/onboarding.ts`:

- Extract and save `training_start_month` from AI-parsed data
- Validate format (`YYYY-MM`) and reject future months before saving
- Drop `experience_months` from the onboarding AI extraction schema — the helper function makes it redundant for new users. Existing users who already have `experience_months` set keep it as a fallback.

### 4. Web Profile

API — extend `PUT /api/dashboard/profile`:

- Accept `training_start_month` in request body
- Validate format matches `YYYY-MM` and is not in the future
- Save to user record

Frontend — in the profile component:

- Add month/year selector (two dropdowns or an `<input type="month">`)
- Pre-populate from existing `training_start_month` if set
- On save, send to profile API

### 5. AI Prompts

In `src/ai/prompts.ts` `buildUserProfileSection()`:

- Replace direct `user.experience_months` read with `getExperienceMonths(user)`
- Display format stays the same: "Experience: 2y 3m"

### 6. Dashboard API

In `src/api/routes/dashboard.ts`:

- Include `training_start_month` in profile response
- Use `getExperienceMonths()` wherever computed experience is returned

### 7. User Types

In `src/db/types.ts`:

- Add `training_start_month: string | null` to `User` interface

In `src/db/queries/users.ts`:

- Add `training_start_month` to the `INSERT` column list in `createUser()` and to the `allowed` array in `updateUser()`

## Files Changed

| File | Change |
|------|--------|
| `src/db/migrations.ts` | Add v17 migration |
| `src/db/types.ts` | Add `training_start_month` to User |
| `src/db/queries/users.ts` | Add field to create/update |
| `src/utils/experience.ts` | New file — `getExperienceMonths()` helper |
| `src/ai/prompts.ts` | Use helper in profile section; update onboarding schema |
| `src/core/handlers/onboarding.ts` | Save `training_start_month` from extracted data |
| `src/api/routes/dashboard.ts` | Include in profile response, use helper |
| `src/api/routes/auth.ts` | Accept `training_start_month` on signup |
| `src/ai/prompts.ts` (free chat) | Add `training_start_month` to `profile_updates` in free chat `---DATA---` schema |
| `web/src/app/shared/models/index.ts` | Add `training_start_month` to frontend `User` model |
| `web/src/app/features/profile/profile.component.ts` | Add month/year picker; replace legacy numeric experience input; add field to `save()` updates object |

## Out of Scope

- Migrating existing `experience_months` data to `training_start_month` (users can set it themselves)
- Belt promotion tracking or automatic belt updates
- Displaying experience differently based on precision
