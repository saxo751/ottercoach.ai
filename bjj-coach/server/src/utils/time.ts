export function nowISO(): string {
  return new Date().toISOString();
}

export function todayDate(): string {
  return new Date().toISOString().split('T')[0];
}

export function getUserLocalHour(timezone: string): number {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: 'numeric',
      hour12: false,
    });
    return parseInt(formatter.format(new Date()), 10);
  } catch {
    return new Date().getHours();
  }
}

export interface LocalTime {
  hour: number;
  minute: number;
  dayName: string; // lowercase: 'monday', 'tuesday', etc.
}

const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

export function getUserLocalTime(timezone: string): LocalTime {
  const now = new Date();
  try {
    const hourFmt = new Intl.DateTimeFormat('en-US', { timeZone: timezone, hour: 'numeric', hour12: false });
    const minuteFmt = new Intl.DateTimeFormat('en-US', { timeZone: timezone, minute: 'numeric' });
    const dayFmt = new Intl.DateTimeFormat('en-US', { timeZone: timezone, weekday: 'long' });

    return {
      hour: parseInt(hourFmt.format(now), 10),
      minute: parseInt(minuteFmt.format(now), 10),
      dayName: dayFmt.format(now).toLowerCase(),
    };
  } catch {
    return {
      hour: now.getHours(),
      minute: now.getMinutes(),
      dayName: DAY_NAMES[now.getDay()],
    };
  }
}

export function getUserLocalDate(timezone: string): string {
  try {
    const fmt = new Intl.DateTimeFormat('en-CA', { timeZone: timezone }); // en-CA gives YYYY-MM-DD
    return fmt.format(new Date());
  } catch {
    return new Date().toISOString().split('T')[0];
  }
}

/**
 * Parse a training_days JSON string into a day→time map.
 * Supports new format {"monday":"19:00"} only — legacy array format returns null
 * since scheduling requires specific times.
 */
export function parseTrainingSchedule(trainingDays: string | null): Record<string, string> | null {
  if (!trainingDays) return null;

  try {
    const parsed = JSON.parse(trainingDays);

    // New format: {"monday":"19:00","wednesday":"20:00"}
    if (typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, string>;
    }

    // Legacy format: ["monday","wednesday"] — can't schedule without times
    return null;
  } catch {
    return null;
  }
}

/**
 * Parse a "HH:MM" time string into hour and minute components.
 * Returns null for invalid or "unknown" values.
 */
export function parseTime(time: string): { hour: number; minute: number } | null {
  if (!time || time === 'unknown') return null;

  const parts = time.split(':');
  if (parts.length < 2) return null;

  const hour = parseInt(parts[0], 10);
  const minute = parseInt(parts[1], 10);

  if (isNaN(hour) || isNaN(minute)) return null;
  return { hour, minute };
}
