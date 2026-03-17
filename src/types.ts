export type Task = {
  readonly id: number;
  title: string;
  description?: string;
  category?: string;
  status: "done" | "in-progress" | "todo";
  readonly createdAtTimestamp: number;
  readonly updatedAtTimestamp?: number;
};

export type TaskUpdate = Partial<
  Omit<Task, "id" | "createdAtTimestamp" | "updatedAtTimestamp">
>;
