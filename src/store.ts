import fs from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import type { Storage, Task, TaskStatus, TaskUpdate } from "./types.ts";

const storageFileName = "tasks.json" as const;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const storagePath = path.join(__dirname, "..", storageFileName);

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

// ---  Utils ---

export function getAllTasks(): Task[] {
  return readStorage().tasks;
}

export function getTask(id: number) {
  const tasks = getAllTasks();

  return tasks.find((task) => task.id === id) ?? null;
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
  const { next: id, tasks } = readStorage();

  tasks.push({
    id,
    title,
    description,
    category,
    status: "todo",
    createdAtTimestamp: Date.now(),
  });

  writeToStorage({ next: id + 1, tasks });
  return id;
}

export function updateTask(id: number, data: TaskUpdate) {
  if (!Object.keys(data).length)
    throw new Error("Expected 1 Update Field At Least");

  const { next, tasks } = readStorage();

  writeToStorage({
    next,
    tasks: tasks.map((task) =>
      task.id === id
        ? { ...task, ...data, updatedAtTimestamp: Date.now() }
        : task,
    ),
  });

  return id;
}

export function deleteTask(id: number) {
  const { next, tasks } = readStorage();

  return writeToStorage({
    next,
    tasks: tasks.filter((task) => task.id !== id),
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
