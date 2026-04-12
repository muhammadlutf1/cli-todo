import type { Task } from "./types.ts";

export const Dates = {
  today: 0,
  yesterday: -86400000,
  tomorrow: 86400000,
} as const;

export function sortTasksByStatus(tasks: Task[]) {
  const priority = { todo: 0, "in-progress": 1, done: 2 } as const;

  return tasks.sort((a, b) => priority[a.status] - priority[b.status]);
}

export function sortTasksByNewest(tasks: Task[]) {
  // currently using creation date
  return tasks.sort((a, b) => b.createdAtTimestamp - a.createdAtTimestamp);
}

/**
 * Check if a task date is within a certain range.
 * If targetDay is given, check if the task date is the same day.
 * If targetStart and/or targetEnd is given, and targetDay is null ,check if the task date is within the range.
 * targeDay has higher priority
 */
export function checkDateRange(
  taskDate: number,
  targetDay: null,
  targetStart: number | null,
  targetEnd: number | null,
): boolean;
export function checkDateRange(
  taskDate: number,
  targetDay: number | null,
): boolean;
export function checkDateRange(
  taskDate: number,
  targetDay: number | null,
  targetStart?: number | null,
  targetEnd?: number | null,
): boolean {
  const date = new Date(taskDate);

  // is same day
  if (targetDay === null && !targetStart && !targetEnd) return false;
  if (targetDay) {
    const targetDayDate = new Date(targetDay);

    return (
      date.getFullYear() === targetDayDate.getFullYear() &&
      date.getMonth() === targetDayDate.getMonth() &&
      date.getDate() === targetDayDate.getDate()
    );
  }

  // is in range
  let result = true;
  if (targetStart != null) result = date >= new Date(targetStart);
  if (targetEnd != null) result = result && date <= new Date(targetEnd);
  return result;
}
