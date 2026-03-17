import chalk from "chalk";
import terminalLink from "terminal-link";
import { listMenu, mainMenu } from "./cli/views.ts";
import { addTask } from "./services/tasks.ts";

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

// TODO: task list functionalities
// TODO: make task creation possible inside list view

let i = 0;
async function main() {
  while (true) {
    const menu = await mainMenu(i);

    if (menu === "exit") process.exit(0);

    if (menu === "add") await addTask();

    if (menu === "list") await listMenu();

    i++;
  }
}

main();
