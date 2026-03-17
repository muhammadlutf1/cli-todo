import chalk from "chalk";
import {
  group,
  select,
  log,
  text,
  isCancel,
  cancel,
  confirm,
} from "@clack/prompts";
import type { Option } from "@clack/prompts";
type SelectOption = Option<string> & { label: string };
import type { Task, TaskFilters } from "../types.ts";
import stringWidth from "string-width";
import { getAllTasks, getCategories } from "../store.ts";
import { filterTasks, dateFilterHandler } from "../services/tasks.ts";
import Duration from "duration-relativetimeformat";
const d = new Duration("en");

const addNewTaskLabel = chalk.green("➕ Add a new task");
export async function mainMenu(firstAccess: boolean) {
  const result = await select({
    message: chalk.magenta(
      firstAccess
        ? ">> Ready to check some boxes?"
        : ">> What's next on the agenda?",
    ),
    options: [
      {
        value: "list",
        label: chalk.green("📂 View Tasks"),
        hint: getAllTasks().length.toString(),
      },
      { value: "add", label: addNewTaskLabel },
      { value: "exit", label: chalk.redBright("Exit") },
    ],
  });

  if (isCancel(result)) {
    process.exit(0);
  }

  return result;
}

export async function listMenu(prompt = true, filters?: TaskFilters) {
  while (true) {
    const filterType = prompt
      ? await select({
          message: "How do you want to see your tasks?",
          options: [
            { value: "today", label: "📅 View Today" },
            { value: "all", label: "📄 View All" }, // TODO: Add Today View without filter
            { value: "filters", label: "🛠  Filters" },
            { value: "backToMainMenu", label: chalk.gray("<- Main Menu") },
          ],
        })
      : filters
        ? "filters"
        : "all";

    if (isCancel(filterType)) return true;

    if (filterType === "backToMainMenu") return true; // exit

    if (filterType === "all") {
      const tasks = getAllTasks();

      if (tasks.length === 0) return log.info(chalk.red("No tasks found!"));

      const selectedTaskOpt = await listTasks(
        chalk.magenta.underline("All tasks:") +
          chalk.gray(` (${tasks.length})`),
        tasks,
        true,
      );

      if (isCancel(selectedTaskOpt)) {
        continue;
      }

      if (selectedTaskOpt === "__back") {
        prompt = true;
        continue;
      }
      if (selectedTaskOpt === "backToMainMenu") return true;

      return { selected: selectedTaskOpt };
    }

    if (filterType === "filters") {
      const taskFilters =
        filters ||
        (await group({
          status: async () => {
            const result = await select({
              message: "Status? " + chalk.gray("(Optional)"),
              options: [
                {
                  value: "todo",
                  label: "🔳 Todo",
                },
                {
                  value: "in-progress",
                  label: "⌛ In Progress",
                },
                {
                  value: "done",
                  label: "✅ Done",
                },
                {
                  value: "_",
                  label: chalk.gray("Skip"),
                },
              ],
            });

            if (isCancel(result)) {
              return "_";
            }

            return result;
          },

          category: async () => {
            const result = await categoryMenu(
              "Which category? " + chalk.gray("(Optional)"),
              [
                {
                  value: "_",
                  label: chalk.gray("Skip"),
                },
              ],
            );

            if (isCancel(result)) {
              return "_";
            }

            return result;
          },

          date: async () => {
            const type = await select({
              message: "Date? " + chalk.gray("(Optional)"),
              options: [
                {
                  value: "today",
                  label: "⚡ Today",
                },
                {
                  value: "day",
                  label: "📅 Specific date",
                },
                {
                  value: "range",
                  label: "🔀 Between two dates",
                },
                {
                  value: "_",
                  label: chalk.gray("Skip"),
                },
              ],
            });

            if (isCancel(type)) {
              return "_";
            }

            if (typeof type !== "symbol") return dateFilterHandler(type);
            return null;
          },
        }));

      const tasks = filterTasks(getAllTasks(), taskFilters as TaskFilters);

      const filteredDateString =
        typeof taskFilters.date === "number"
          ? `day: (${new Date(taskFilters.date).toDateString()})`
          : Array.isArray(taskFilters.date)
            ? `Range: (${taskFilters.date[0] !== null ? new Date(taskFilters.date[0]).toDateString() : ""} - ${taskFilters.date[1] !== null ? new Date(taskFilters.date[1]).toDateString() : ""})`
            : "";

      const message =
        chalk.magenta.underline("Filtered tasks: ") +
        chalk.gray(
          `${taskFilters.status !== "_" ? `status: (${taskFilters.status})` : ""}${taskFilters.category !== "_" ? `category: (${taskFilters.category})` : ""} ${filteredDateString}`,
        );

      if (tasks.length === 0) return log.info(chalk.red("No tasks found!"));

      const selected = await listTasks(message, tasks, true);
      if (isCancel(selected)) {
        break;
      }
      if (selected === "backToMainMenu") break;

      return {
        selected,
        filters: taskFilters,
      };
    }

    if (filterType === "today") {
      const tasks = filterTasks(getAllTasks(), {
        category: "_",
        status: "_",
        date: 0,
      });

      if (tasks.length === 0) return log.info(chalk.red("No tasks found!"));

      const selected = await listTasks(
        chalk.magenta.underline("Today Tasks:"),
        tasks,
        true,
      );
      if (isCancel(selected)) break;

      if (selected === "backToMainMenu") break;

      return {
        selected,
      };
    }
  }
}

export async function categoryMenu(
  message: string,
  additionalOptions?: SelectOption[],
) {
  const categoriesList = getCategories();

  const catOptionsArr: SelectOption[] = [];

  for (let category in categoriesList) {
    catOptionsArr.push({
      value: category.toLocaleLowerCase(),
      label: category,
      hint: `${categoriesList[category].toString()} tasks`,
    });
  }

  if (!catOptionsArr.length)
    catOptionsArr.push({
      value: "__",
      disabled: true,
      label: "You don't have any categories yet!",
    });

  const result = await select({
    message,
    options: catOptionsArr.concat(additionalOptions || []),
  });

  if (isCancel(result)) {
    return "_";
  }

  return result;
}

export async function listTasks(
  message: string,
  tasks: Task[],
  showCategory?: boolean,
) {
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
      label: addNewTaskLabel,
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

export async function dayInput() {
  const result = await text({
    message:
      "Day date? " +
      chalk.gray(
        "(Optional)\n   format: YYYY-MM-DD\n   you can use keywords: 'today', 'tomorrow', 'yesterday'",
      ),
  });

  if (isCancel(result)) {
    return "";
  }

  return result.trim();
}

export async function dateRangeInput() {
  const result = await group({
    startDate: () =>
      text({
        message:
          "Start Date? " +
          chalk.gray(
            "(Optional)\n   format: YYYY-MM-DD\n   you can use keywords: 'today', 'tomorrow', 'yesterday'",
          ),
      }),
    endDate: () =>
      text({
        message:
          "End Date? " +
          chalk.gray(
            "(Optional)\n   format: YYYY-MM-DD\n   you can use keywords: 'today', 'tomorrow', 'Yesterday'",
          ),
      }),
  });

  if (isCancel(result)) {
    return { startDate: "", endDate: "" };
  }

  return result;
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

export function logSuccess(message: string) {
  log.success(chalk.green(message));
}

export function logError(message: string) {
  log.success(chalk.red(message));
}

export async function taskView(
  task: Task,
): Promise<
  | { type: "title" | "description" | "category" | "status"; value: string }
  | { type: "delete" }
  | undefined
> {
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

      return { type: "category", value: categoryChoice };
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
