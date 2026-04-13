import chalk from "chalk";
import { cancel, confirm, group, isCancel, select, text } from "@clack/prompts";
import Duration from "duration-relativetimeformat";
import stringWidth from "string-width";
import { sortTasksByNewest, sortTasksByStatus } from "../utils.ts";
import { categoryMenu } from "./menus.ts";
import type { Task } from "../types.ts";
import { clearConsole } from "./logs.ts";

const d = new Duration("en");

export async function listTasks(
  message: string,
  tasks: Task[],
  showCategory?: boolean,
) {
  tasks = sortTasksByStatus(sortTasksByNewest(tasks));

  const digits = tasks.length > 100 ? 3 : tasks.length > 10 ? 2 : 1;

  const lengths: number[] = [];
  const lines = tasks.map((task, i) => {
    let line = `${chalk.gray(`#${String(i + 1).padStart(digits, "0")}.`)} ${
      task.status === "in-progress" ? "⌛" : task.status === "done" ? "✅ " : ""
    }${task.category && showCategory ? chalk.magentaBright(`[${task.category}] `) : ""}${task.title}`;

    line = task.status === "done" ? chalk.strikethrough(line) : line;

    lengths.push(stringWidth(line));
    return line;
  });

  const maxWidthLine = Math.max(...lengths);

  const status = {
    todo: 0,
    "in-progress": 0,
    done: 0,
  };

  let options = tasks.map((task, i) => {
    status[task.status] += 1;

    const line = lines[i];
    const label =
      line +
      " ".repeat(maxWidthLine - stringWidth(line) + 3) +
      chalk.gray(`[${d.format(task.createdAtTimestamp)}]`);

    return {
      value: task.id.toString(),
      label,
      disabled: false,
    };
  });

  const completionLine = `── ${Math.round((status.done / tasks.length) * 100)}% of all tasks complete ──`;
  const statusLine = `─── ${chalk.greenBright(status.done)} done • ${chalk.yellow(status["in-progress"])} in progress • ${chalk.blue(status.todo)} not started ───`;

  options = options.concat([
    {
      value: "_",
      disabled: true,
      label: "",
    },
    {
      value: "_",
      disabled: true,
      label:
        " ".repeat(
          Math.floor(
            (stringWidth(statusLine) - stringWidth(completionLine)) / 2,
          ),
        ) + completionLine,
    },
    {
      value: "_",
      disabled: true,
      label: statusLine,
    },
    {
      value: "_",
      disabled: true,
      label: "",
    },
    {
      disabled: false,
      value: "add",
      label: chalk.green("➕ Add a new task"),
    },
    {
      value: "__back",
      label: chalk.dim("<- Back"),
      disabled: false,
    },
    {
      value: "backToMainMenu",
      label: chalk.dim("<- Main Menu"),
      disabled: false,
    },
  ]);

  const result = await select({
    message,
    options,
  });

  if (isCancel(result)) {
    return "_";
  }

  return result;
}

export async function taskView(
  task: Task,
): Promise<
  | { type: "title" | "description" | "category" | "status"; value: string }
  | { type: "delete" }
  | undefined
> {
  clearConsole();

  const action = await select({
    message:
      `"${chalk.bold.magenta(`${task.title}`)}"` +
      `${task.category ? chalk.gray(` [@${task.category}]`) : ""}\n` +
      `Status: [ ${
        task.status === "in-progress"
          ? chalk.yellow("In Progress")
          : task.status === "todo"
            ? chalk.magenta("Todo")
            : chalk.green("Done")
      } ]\n` +
      `${task.description ? `${chalk.dim(task.description)}\n` : ""}` +
      `${chalk.gray(
        `${d.format(task.createdAtTimestamp)} (${new Date(
          task.createdAtTimestamp,
        ).toDateString()})`,
      )}\n\n───────────────\n`,
    options: [
      { value: "edit_status", label: chalk.green("⌛ Edit Status") },
      { value: "edit_task", label: chalk.green("✏️ Edit Task") },
      { value: "delete", label: chalk.red("🗑️ Delete") },
      { value: "back", label: chalk.gray("<- Back") },
    ],
  });

  if (isCancel(action)) return;

  if (action === "back") return;

  if (action === "edit_status") {
    const options = [];
    if (task.status !== "todo")
      options.push({ value: "todo", label: "🔳 Todo" });
    if (task.status !== "in-progress")
      options.push({ value: "in-progress", label: "⌛ In Progress" });
    if (task.status !== "done")
      options.push({ value: "done", label: "✅ Done" });

    const result = await select({
      message: "Change status to? ",
      options,
    });

    if (isCancel(result)) return;

    return { type: "status", value: result.toString() };
  }

  if (action === "edit_task") {
    const selected = await select({
      message: "What do you want to change? ",
      options: [
        { value: "title", label: "Title" },
        { value: "description", label: "Description" },
        { value: "category", label: "Category" },
      ],
    });

    if (isCancel(selected)) return;

    if (selected === "title" || selected === "description") {
      const result = await text({
        message: "New " + selected + "? ",
      });

      if (isCancel(result)) return;

      return { type: selected, value: result.toString() };
    }

    if (selected === "category") {
      const categoryChoice = await categoryMenu("New category?", [
        { value: "__new-category", label: chalk.green("➕ Add new") },
      ]);

      if (isCancel(categoryChoice)) return undefined;

      if (categoryChoice === "__new-category") {
        const result = await text({
          message: chalk.magenta("Where should we file this?"),
        });

        if (isCancel(result)) return { type: "category", value: "" };
        else return { type: "category", value: result };
      }

      return typeof categoryChoice === "undefined"
        ? categoryChoice
        : { type: "category", value: categoryChoice };
    }
  }

  if (action === "delete") {
    const result = await confirm({
      message: "Are you sure? You won't be able to undo this.",
    });

    if (!result || isCancel(result)) return;

    return { type: "delete" };
  }
}

export async function newTaskView() {
  try {
    const task = await group({
      title: async () => {
        while (true) {
          const result = await text({
            message: chalk.magenta("What's the new task?"),
            validate(value) {
              if (!value?.length) return "It can't be empty!";
            },
          });

          if (isCancel(result)) {
            const isCanceled = await confirm({
              message: "Do you want to cancel?",
              initialValue: true,
            });

            if (isCancel(isCanceled) || isCanceled)
              throw new Error(); // cancel
            else continue;
          }

          return result;
        }
      },

      description: async () => {
        const result = await text({
          message: chalk.magenta("More details? ") + chalk.gray("(Optional)"),
        });

        if (isCancel(result)) throw new Error(); // cancel

        return result;
      },

      selectedCategory: async () =>
        categoryMenu(
          chalk.magenta("Tag it! Which category? ") + chalk.gray("(Optional)"),
          [
            { value: "__new-category", label: chalk.green("➕ Add new") },
            { value: "__skip-category", label: chalk.gray("(No category)") },
          ],
        ),
    });

    let category = task.selectedCategory;
    if (task.selectedCategory === "__new-category") {
      const result = await text({
        message: chalk.magenta("Where should we file this?"),
      });

      if (isCancel(result)) {
        category = "";
      } else {
        category = result as string;
      }
    }

    return {
      title: task.title,
      description: task.description,
      category: task.selectedCategory === "__skip-category" ? "" : category,
    };
  } catch (error) {
    cancel("Canceled new task");

    return {};
  }
}
