import { log } from "@clack/prompts";
import chalk from "chalk";
import terminalLink from "terminal-link";

export function printHeader() {
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
}

export function clearConsole() {
  console.clear();
  printHeader();
}

export function logSuccess(message: string) {
  log.success(chalk.green(message));
}

export function logError(message: string) {
  log.success(chalk.red(message));
}
