import { Dates } from "./utils.ts";

export type TaskStatus = "done" | "in-progress" | "todo";

export type Storage = { next: number; tasks: Task[] };

export type Task = {
  readonly id: number;
  title: string;
  description?: string;
  category?: string;
  status: TaskStatus;
  readonly createdAtTimestamp: number;
  readonly updatedAtTimestamp?: number;
};

export type TaskUpdate = Partial<
  Omit<Task, "id" | "createdAtTimestamp" | "updatedAtTimestamp">
>;

export type DateKey = keyof typeof Dates;

export type TaskFilters = {
  status: TaskStatus | "_";
  category: "_" | string;
  date: null | (null | number)[] | number | "_";
  //    ^^^^      ^^^^^^^^^         ^^^
  // type: none       range         day
};
