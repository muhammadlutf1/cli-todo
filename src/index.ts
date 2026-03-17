import chalk from "chalk";
import terminalLink from "terminal-link";
import { mainMenu } from "./cli/views.ts";
import { addTaskHandler, listTasksHandler } from "./services/tasks.ts";

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



let firstAccess = true;
async function main() {
  while (true) {
    const menu = await mainMenu(firstAccess);

    if (menu === "exit") process.exit(0);

    if (menu === "add") await addTaskHandler();

    if (menu === "list") await listTasksHandler();

    firstAccess = false;
  }
}

main();
