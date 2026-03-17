import type { TaskFilters, Task, DateKey } from "../types.ts";
import { checkDateRange, Dates } from "../utils.ts";
import {
  dateRangeInput,
  dayInput,
  logSuccess,
  newTaskView,
} from "../cli/views.ts";
import { createTask } from "../store.ts";

export async function addTask() {
  const task = await newTaskView();

  const id = createTask(task.title, task.description, task.category);

  logSuccess(`✅ Added '${task.title}' (ID: ${id})`);
}

export function filterTasks(tasks: Task[], filter: TaskFilters) {
  if (filter.category !== "_")
    tasks = tasks.filter((t) => t.category === filter.category);

  if (filter.status !== "_")
    tasks = tasks.filter((t) => t.status === filter.status);

  if (Array.isArray(filter.date)) {
    const range: (number | null)[] = filter.date;
    tasks = tasks.filter((t) => {
      return checkDateRange(t.createdAtTimestamp, null, range[0], range[1]);
    });
  } else if (typeof filter.date === "number")
    tasks = tasks.filter((t) =>
      checkDateRange(t.createdAtTimestamp, filter.date as number),
    );

  return tasks;
}

export async function dateFilterHandler(dateInput: string) {
  if (dateInput === "_") return "_";

  if (dateInput === "today") return Date.now();

  if (dateInput === "day") {
    const day = await dayInput();

    if (day in Dates) {
      return Date.now() + Dates[day as DateKey];
    }

    const date = new Date(day);
    if (date.toString() === "Invalid Date") return null;
    else return date.getTime();
  }

  if (dateInput === "range") {
    const dateArr = [];

    const range = await dateRangeInput();

    range.startDate = range.startDate.trim();
    range.endDate = range.endDate.trim();
    const startDate = new Date(range.startDate);
    const endDate = new Date(range.endDate);

    if (range.startDate in Dates)
      dateArr.push(Date.now() + Dates[range.startDate as DateKey]);
    else if (startDate.toString() === "Invalid Date") dateArr.push(null);
    else dateArr.push(startDate.getTime());

    if (range.endDate in Dates)
      dateArr.push(Date.now() + Dates[range.endDate as DateKey]);
    else if (endDate.toString() === "Invalid Date") dateArr.push(null);
    else dateArr.push(endDate.getTime());

    return dateArr;
  }
}
