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
