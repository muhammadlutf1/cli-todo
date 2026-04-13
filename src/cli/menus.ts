import chalk from "chalk";
import { group, select, log, text, isCancel } from "@clack/prompts";
import { getAllTasks, getCategories } from "../store.ts";
import { filterTasks, dateFilterHandler } from "../services/tasks.ts";
import { listTasks } from "./tasks.ts";

import type { Option } from "@clack/prompts";
import type { TaskFilters } from "../types.ts";
import { clearConsole } from "./logs.ts";
type SelectOption = Option<string> & { label: string };

export async function mainMenu(firstAccess: boolean) {
  clearConsole();

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
      { value: "add", label: chalk.green("➕ Add a new task") },
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
    clearConsole();

    const filterType = prompt
      ? await select({
          message: "How do you want to see your tasks?",
          options: [
            { value: "today", label: "📅 View Today" },
            { value: "all", label: "📄 View All" },
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
        date: Date.now(),
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
      value: category,
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
    return undefined;
  }

  return result;
}
