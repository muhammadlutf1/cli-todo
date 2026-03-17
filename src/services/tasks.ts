import type { TaskFilters, Task, DateKey } from "../types.ts";
import { checkDateRange, Dates } from "../utils.ts";
import {
  dateRangeInput,
  dayInput,
  listMenu,
  logError,
  logSuccess,
  newTaskView,
  taskView,
} from "../cli/views.ts";
import { createTask, deleteTask, getTask, updateTask } from "../store.ts";

export async function addTaskHandler() {
  const task = await newTaskView();

  if (!task.title) return;

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

export async function listTasksHandler() {
  let firstAccess = true;
  let filters: TaskFilters | undefined;
  while (true) {
    const listSelection = firstAccess ? await listMenu() : await listMenu(false, filters);
    firstAccess = false;

    if (typeof listSelection !== "object") return;

    const { selected, filters: f } = listSelection;
    filters = f

    if (selected === "add") {
      await addTaskHandler();
      continue;
    };

    const taskId = parseInt(selected);
    const task = getTask(taskId);
    if (!task) return logError("Task not found");

    const taskAction = await taskView(task);
    console.log(taskAction)
    if (!taskAction) continue; // TaskView '<- Back' or Canaled

    if (taskAction.type === "delete") {
      deleteTask(task.id);
      logSuccess("Deleted Task");
      continue;
    };

    updateTask(task.id, { ...task, [taskAction.type]: taskAction.value });
    logSuccess(`Updated ${taskAction.type} to '${taskAction.value}'`);
  }
}
