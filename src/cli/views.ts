import chalk from "chalk";
import { group, select, log, text, isCancel } from "@clack/prompts";
import type { Option } from "@clack/prompts";
type SelectOption = Option<string> & { label: string };
import type { Task, TaskFilters } from "../types.ts";
import stringWidth from "string-width";
import { getAllTasks, getCategories } from "../store.ts";
import { filterTasks, dateFilterHandler } from "../services/tasks.ts";
import Duration from "duration-relativetimeformat";
const d = new Duration("en");

export async function mainMenu(i: number) {
  const result = await select({
    message: chalk.magenta(
      i === 0
        ? ">> Ready to check some boxes?"
        : ">> What's next on the agenda?",
    ),
    options: [
      {
        value: "list",
        label: chalk.green("📂 View Tasks"),
        hint: getAllTasks().length.toString(),
      },
      { value: "add", label: chalk.green("➕ Add a new task") },
      { value: "exit", label: chalk.redBright("Exit") },
    ],
  });

  if (isCancel(result)) {
    process.exit(0);
  }

  return result;
}

export async function listMenu() {
  while (true) {
    const filterType = await select({
      message: "How do you want to see your tasks?",
      options: [
        { value: "all", label: "📄 View All" },
        { value: "filters", label: "🛠  Filters" },
        { value: "backToMainMenu", label: chalk.gray("<- Main Menu") },
      ],
    });

    if (isCancel(filterType)) {
      return true;
    }

    if (filterType === "backToMainMenu") return true; // exit

    let selectedTaskId: number | null = null;

    if (filterType === "all") {
      const tasks = getAllTasks();
      const selectedTaskOpt = await listTasks(
        chalk.magenta.underline("All tasks:") +
          chalk.gray(` (${tasks.length})`),
        tasks,
        true,
      );

      if (isCancel(selectedTaskOpt)) {
        continue;
      }

      if (selectedTaskOpt === "__back") continue;
      if (selectedTaskOpt === "backToMainMenu") return true;

      selectedTaskId = parseInt(selectedTaskOpt as string);
    }

    if (filterType === "filters") {
      const filter = await group({
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
      });

      const tasks = filterTasks(getAllTasks(), filter as TaskFilters);

      const filteredDateString =
        typeof filter.date === "number"
          ? `day: (${new Date(filter.date).toDateString()})`
          : Array.isArray(filter.date)
            ? `Range: (${filter.date[0] !== null ? new Date(filter.date[0]).toDateString() : ""} - ${filter.date[1] !== null ? new Date(filter.date[1]).toDateString() : ""})`
            : "";

      const message =
        chalk.magenta.underline("Filtered tasks: ") +
        chalk.gray(
          `${filter.status !== "_" ? `status: (${filter.status})` : ""}${filter.category !== "_" ? `category: (${filter.category})` : ""} ${filteredDateString}`,
        );

      if (tasks.length === 0) log.info(chalk.red("No tasks found!"));
      else {
        const selectedTask = await listTasks(message, tasks, true);
        if (isCancel(selectedTask)) {
          break;
        }
        if (selectedTask === "backToMainMenu") break;
        selectedTaskId = parseInt(selectedTask as string);
      }
    }

    return selectedTaskId;
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
  const task = await group({
    title: async () => {
      const result = await text({
        message: chalk.magenta("What's the new task?"),
        validate(value) {
          if (!value?.length) return "It can't be empty!";
        },
      });

      if (isCancel(result)) {
        log.warn("Task creation will be cancelled");
        return "";
      }

      return result;
    },

    description: async () => {
      const result = await text({
        message: chalk.magenta("More details? ") + chalk.gray("(Optional)"),
      });

      if (isCancel(result)) {
        return "";
      }

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
}

export function logSuccess(message: string) {
  log.success(chalk.green(message));
}
