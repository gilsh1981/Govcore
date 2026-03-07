import type { RecurrenceRule } from "@prisma/client";

/** ISO date string "YYYY-MM-DD" representing one occurrence */
export type OccurrenceDate = string;

const ROLLING_DAYS = 90;

/**
 * Expand a RecurrenceRule into occurrence dates within a rolling window.
 *
 * @param rule  - Prisma RecurrenceRule row
 * @param from  - window start (defaults to today)
 * @param days  - window size in days (defaults to ROLLING_DAYS = 90)
 * @returns     - sorted array of ISO date strings "YYYY-MM-DD"
 */
export function expandRule(
  rule: RecurrenceRule,
  from: Date = new Date(),
  days: number = ROLLING_DAYS,
): OccurrenceDate[] {
  const windowEnd = new Date(from);
  windowEnd.setDate(windowEnd.getDate() + days);

  const ruleEnd = rule.endDate ?? windowEnd;
  const end = ruleEnd < windowEnd ? ruleEnd : windowEnd;

  const results: OccurrenceDate[] = [];
  let cursor = new Date(rule.startDate);

  // Normalise cursor to midnight UTC
  cursor.setUTCHours(0, 0, 0, 0);

  const MAX_ITERATIONS = 10_000;
  let i = 0;

  while (cursor <= end && i++ < MAX_ITERATIONS) {
    if (cursor >= from && matchesRule(cursor, rule)) {
      results.push(toISO(cursor));
    }
    cursor = advance(cursor, rule);
  }

  return results;
}

// ─── Private helpers ─────────────────────────────────────────────────────────

function matchesRule(date: Date, rule: RecurrenceRule): boolean {
  const dow = date.getUTCDay(); // 0=Sun … 6=Sat
  const dom = date.getUTCDate();
  const moy = date.getUTCMonth() + 1; // 1-based

  switch (rule.frequency) {
    case "DAILY":
      return true;

    case "WEEKLY":
    case "BIWEEKLY":
      return rule.daysOfWeek.length === 0 || rule.daysOfWeek.includes(dow);

    case "MONTHLY":
      if (rule.daysOfWeek.length > 0) return rule.daysOfWeek.includes(dow);
      return rule.dayOfMonth != null ? dom === rule.dayOfMonth : dom === 1;

    case "YEARLY":
      if (rule.monthOfYear != null && moy !== rule.monthOfYear) return false;
      if (rule.dayOfMonth != null && dom !== rule.dayOfMonth) return false;
      return true;

    default:
      return false;
  }
}

function advance(date: Date, rule: RecurrenceRule): Date {
  const next = new Date(date);
  const interval = rule.interval ?? 1;

  switch (rule.frequency) {
    case "DAILY":
      next.setUTCDate(next.getUTCDate() + interval);
      break;
    case "WEEKLY":
      next.setUTCDate(next.getUTCDate() + 1); // walk day-by-day within weekly
      break;
    case "BIWEEKLY":
      next.setUTCDate(next.getUTCDate() + 1);
      break;
    case "MONTHLY":
      if (rule.daysOfWeek.length > 0) {
        next.setUTCDate(next.getUTCDate() + 1);
      } else {
        next.setUTCMonth(next.getUTCMonth() + interval);
      }
      break;
    case "YEARLY":
      next.setUTCFullYear(next.getUTCFullYear() + interval);
      break;
  }

  return next;
}

function toISO(date: Date): OccurrenceDate {
  return date.toISOString().slice(0, 10);
}
