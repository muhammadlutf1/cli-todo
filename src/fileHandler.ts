import fs from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import type { Task, TaskUpdate } from "./types.ts";

const storageFileName = "tasks.json" as const;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const storagePath = path.join(__dirname, "..", storageFileName);

export function getAllTasks(): Task[] {
  const filesList = fs.readdirSync(path.join(__dirname, ".."));

  if (!filesList.includes(storageFileName)) {
    fs.writeFileSync(storagePath, "[]");
    return [];
  }

  const fileContent = fs.readFileSync(storagePath, { encoding: "utf-8" });
  return JSON.parse(fileContent);
}

function writeToStorage(data: Task[]) {
  try {
    fs.writeFileSync(storagePath, JSON.stringify(data));
    return data.length;
  } catch (e) {
    throw new Error(String(e));
  }
}

export function getTask(id: number) {
  const tasks = getAllTasks();

  return tasks.find((task) => task.id === id) ?? null;
}

export function addTask(
  title: string,
  description?: string,
  category?: string,
) {
  const tasks = getAllTasks();

  tasks.push({
    id: tasks.length + 1,
    title,
    description,
    category,
    status: "todo",
    createdAtTimestamp: Date.now(),
  });

  return writeToStorage(tasks);
}

export function updateTask(id: number, data: TaskUpdate) {
  if (!Object.keys(data).length)
    throw new Error("Expected 1 Update Field At Least");

  const tasks = getAllTasks();

  writeToStorage(
    tasks.map((task) =>
      task.id === id
        ? { ...task, ...data, updatedAtTimestamp: Date.now() }
        : task,
    ),
  );

  return id;
}

export function deleteTask(id: number) {
  const tasks = getAllTasks();

  return tasks.filter((task) => task.id != id);
}

export function listCategories() {
  const tasks = getAllTasks();
  const list: Record<string, number> = {};

  tasks.forEach((task) =>
    task.category
      ? (list[task.category] = (list[task.category] || 0) + 1)
      : null,
  );

  return list;
}
