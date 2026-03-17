import { group, select, text, log, note } from "@clack/prompts";
import chalk from "chalk";
import {
  getAllTasks,
  addTask,
  listCategories,
  getTasksByCategory,
  getTasksByStatus,
} from "./fileHandler.ts";
import type { Task, TaskStatus, DateKey } from "./types.ts";
import type { Option } from "@clack/prompts";
type SelectOption = Option<string> & { label: string };
import stringWidth from "string-width";
import terminalLink from "terminal-link";
import Duration from "duration-relativetimeformat";
import { checkDateRange, Dates } from "./utils.ts";
const d = new Duration("en");

const logo = ` ____  _     _    _____ ____  ____  ____ 
/   _\\/ \\   / \\  /__ __Y  _ \\/  _ \\/  _ \\
|  /  | |   | |    / \\ | / \\|| | \\|| / \\|
|  \\__| |_\\/| |    | | | \\_/|| |_/|| \\_/|
\\____/\\____/\\_/    \\_/ \\____/\\____/\\____/
`;

console.log(chalk.magentaBright(logo));
console.log(
  `  By ${terminalLink("Muhammad Lutfi", "https://github.com/muhammadlutf1")}`,
);
console.log(chalk.greenBright("  [✓]") + " Get things done.");
console.log(chalk.greenBright("  [✓]") + " Stop procrastinating.");

// TODO: handle isCancel
// TODO: make task creation possible inside list view
// TODO:
let i = 0;
async function main() {
  while (true) {
    const mainMenu = await select({
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

    if (mainMenu === "exit") process.exit(0);

    if (mainMenu === "add") {
      const task = await group({
        title: () =>
          text({
            message: chalk.magenta("What's the new task?"),
            validate(value) {
              if (!value?.length) return "It can't be empty!";
            },
          }),

        description: () =>
          text({
            message: chalk.magenta("More details? ") + chalk.gray("(Optional)"),
          }),

        selectedCategory: () =>
          categoryMenu(
            chalk.magenta("Tag it! Which category? ") +
              chalk.gray("(Optional)"),
            [
              { value: "__new-category", label: chalk.green("➕ Add new") },
              { value: "__skip-category", label: chalk.gray("(No category)") },
            ],
          ),
      });

      let category = task.selectedCategory;
      if (task.selectedCategory === "__new-category") {
        category = (await text({
          message: chalk.magenta("Where should we file this?"),
        })) as string;
      }

      const id = addTask(
        task.title,
        task.description,
        task.selectedCategory === "__skip-category" ? "" : category,
      );

      log.success(chalk.green(`✅ Added '${task.title}' (ID: ${id})`));
    }

    if (mainMenu === "list") {
      if (await listMenu()) continue;
    }

    i++;
  }
}

async function listTasks(
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

  return await select({
    message,
    options,
  });
}

async function categoryMenu(
  message: string,
  additionalOptions?: SelectOption[],
) {
  const categoriesList = listCategories();

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

  return await select({
    message,
    options: catOptionsArr.concat(additionalOptions || []),
  });
}

async function listMenu() {
  while (true) {
    const filterType = await select({
      message: "How do you want to see your tasks?",
      options: [
        { value: "all", label: "📄 View All" },
        { value: "filters", label: "🛠  Filters" },
        { value: "backToMainMenu", label: chalk.gray("<- Main Menu") },
      ],
    });

    if (filterType === "backToMainMenu") return true; // exit

    let selectedTaskId: number;

    if (filterType === "all") {
      const tasks = getAllTasks();
      const selectedTaskOpt = await listTasks(
        chalk.magenta.underline("All tasks:") +
          chalk.gray(` (${tasks.length})`),
        tasks,
        true,
      );

      if (selectedTaskOpt === "__back") continue;
      if (selectedTaskOpt === "backToMainMenu") return true;

      selectedTaskId = parseInt(selectedTaskOpt as string);
    }

    if (filterType === "filters") {
      const filter = await group({
        status: () =>
          select({
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
          }),

        category: () =>
          categoryMenu("Which category? " + chalk.gray("(Optional)"), [
            {
              value: "_",
              label: chalk.gray("Skip"),
            },
          ]),

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

          if (type === "_") return type;

          if (type === "today") return Date.now();

          if (type === "day") {
            const day = (
              (await text({
                message:
                  "Day date? " +
                  chalk.gray(
                    "(Optional)\n   format: YYYY-MM-DD\n   you can use keywords: 'today', 'tomorrow', 'yesterday'",
                  ),
              })) as string
            ).trim();

            if (day in Dates) {
              return Date.now() + Dates[day as DateKey];
            }

            const date = new Date(day);
            if (date.toString() === "Invalid Date") return null;
            else return date.getTime();
          }

          if (type === "range") {
            const dateArr = [];

            const range = await group({
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
                      "(Optional)\n   format: YYYY-MM-DD\n   you can use keywords: 'today', 'tomorrow', 'yesterday'",
                    ),
                }),
            });

            range.startDate = range.startDate.trim();
            range.endDate = range.endDate.trim();
            const startDate = new Date(range.startDate);
            const endDate = new Date(range.endDate);

            if (range.startDate in Dates)
              dateArr.push(Date.now() + Dates[range.startDate as DateKey]);
            else if (startDate.toString() === "Invalid Date")
              dateArr.push(null);
            else dateArr.push(startDate.getTime());

            if (range.endDate in Dates)
              dateArr.push(Date.now() + Dates[range.endDate as DateKey]);
            else if (endDate.toString() === "Invalid Date") dateArr.push(null);
            else dateArr.push(endDate.getTime());

            return dateArr;
          }
        },
      });

      let tasks = getAllTasks();

      if (filter.category !== "_")
        tasks = tasks.filter((t) => t.category === filter.category);

      if (filter.status !== "_")
        tasks = tasks.filter((t) => t.status === filter.status);

      if (filter.date === "_") {
      } else if (Array.isArray(filter.date)) {
        const range: (number | null)[] = filter.date;
        tasks = tasks.filter((t) => {
          return checkDateRange(t.createdAtTimestamp, null, range[0], range[1]);
        });
      } else
        tasks = tasks.filter((t) =>
          checkDateRange(t.createdAtTimestamp, filter.date as number | null),
        );

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
        if (selectedTask === "backToMainMenu") break;
      }
    }
  }
}

main();
