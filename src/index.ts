#!/usr/bin/env node

import { mainMenu } from "./cli/menus.ts";
import { printHeader } from "./cli/logs.ts";
import { addTaskHandler, listTasksHandler } from "./services/tasks.ts";
let firstAccess = true;

printHeader();
process.stdout.write("\x1b[s");

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
