import fs from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import type { Storage, Task, TaskStatus, TaskUpdate } from "./types.ts";

const storageFileName = "tasks.json" as const;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const storagePath = path.join(__dirname, "..", storageFileName);

let tasksMap: Map<Task["id"], Task> | null = null;
let nextId: number | null = null;

function writeToStorage(data: Storage) {
  try {
    fs.writeFileSync(storagePath, JSON.stringify(data));
    return data.tasks.length;
  } catch (e) {
    throw new Error(String(e));
  }
}

function readStorage(): Storage {
  const filesList = fs.readdirSync(path.join(__dirname, ".."));

  try {
    if (!filesList.includes(storageFileName)) throw new Error();
    const fileContent = fs.readFileSync(storagePath, { encoding: "utf-8" });
    const content = JSON.parse(fileContent);
    if (!content.tasks) throw new Error();

    return content;
  } catch (error) {
    const init = { next: 1, tasks: [] };
    fs.writeFileSync(storagePath, JSON.stringify(init));
    return init;
  }
}

// ---  API ---

export function getAllTasks(): Task[] {
  return [...getTasksMap().values()];
}

export function getTask(id: number) {
  return getTasksMap().get(id);
}

export function getTasksByCategory(category: string) {
  const tasks = getAllTasks();

  return tasks.filter((task) => task.category === category);
}

export function getTasksByStatus(status: TaskStatus) {
  const tasks = getAllTasks();

  return tasks.filter((task) => task.status === status);
}

export function createTask(
  title: string,
  description?: string,
  category?: string,
) {
  const id = getNextId();
  const tasks = getTasksMap();

  tasks.set(id, {
    id,
    title,
    description,
    category,
    status: "todo",
    createdAtTimestamp: Date.now(),
  });

  nextId = id + 1;

  writeToStorage({ next: nextId, tasks: [...tasks.values()] });
  return id;
}

export function updateTask(id: number, data: TaskUpdate) {
  if (!Object.keys(data).length)
    throw new Error("Expected 1 Update Field At Least");

  const next = getNextId();
  const tasks = getTasksMap();

  const task = getTask(id);
  if (!task) throw new Error(`Task Not Found (ID: ${id})`);
  tasks.set(id, { ...task, ...data, updatedAtTimestamp: Date.now() });

  writeToStorage({
    next,
    tasks: [...tasks.values()],
  });

  return id;
}

export function deleteTask(id: number) {
  const next = getNextId();
  const tasks = getTasksMap();

  tasks.delete(id);

  return writeToStorage({
    next,
    tasks: [...tasks.values()],
  });
}

export function getCategories() {
  const tasks = getAllTasks();
  const list: Record<string, number> = {};

  tasks.forEach((task) =>
    task.category
      ? (list[task.category] = (list[task.category] || 0) + 1)
      : null,
  );

  return list;
}

// --- Utils ---

function getTasksMap(): Map<Task["id"], Task> {
  if (!tasksMap) {
    const map = new Map<Task["id"], Task>();
    const storage = readStorage();
    storage.tasks.forEach((task) => map.set(task.id, task));
    tasksMap = map;
  }
  return tasksMap;
}

function getNextId(): number {
  if (!nextId) nextId = readStorage().next;
  return nextId;
}
