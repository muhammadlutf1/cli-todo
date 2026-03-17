import type { Task } from "./types.ts";

export const Dates = {
  today: 0,
  yesterday: -86400000,
  tomorrow: 86400000,
} as const;

export function sortTasksByStatus(tasks: Task[]) {
  const doneTasks: Task[] = [];
  const inProgressTasks: Task[] = [];
  const todoTasks: Task[] = [];

  tasks.forEach((task) => {
    if (task.status === "done") doneTasks.push(task);
    if (task.status === "in-progress") inProgressTasks.push(task);
    if (task.status === "todo") todoTasks.push(task);
  });

  return doneTasks.concat(inProgressTasks, todoTasks);
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
