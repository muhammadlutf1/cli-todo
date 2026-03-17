import { select, text } from "@clack/prompts";
import chalk from "chalk";
import figlet from "figlet";
import { addTask, listCategories } from "./fileHandler.ts";

const logo = figlet.textSync("CLI TODO", { font: "Small" });
console.log(chalk.magentaBright(logo));
console.log(chalk.magenta("  [✓]") + " Get things done.");
console.log(chalk.magenta("  [✓]") + " Stop procrastinating.");

// TODO: handle isCancel
let i = 0;
async function main() {
  while (true) {
    const mainMenu = await select({
      message: chalk.magenta(i === 0 ? ">> Ready to check some boxes?" : ">>"),
      options: [
        { value: "list", label: chalk.green("📂 View All Tasks"), hint: "10" },
        { value: "add", label: chalk.green("➕ Add a new task") },
        { value: "exit", label: chalk.redBright("Exit") },
      ],
    });

    if (mainMenu === "exit") process.exit(0);

    if (mainMenu === "add") {
      const title = (await text({
        message: chalk.magenta("What's the new task?"),
        validate(value) {
          if (!value?.length) return "It can't be empty!";
        },
      })) as string;

      const description = (await text({
        message: chalk.magenta("More details? ") + chalk.gray("(Optional)"),
      })) as string;

      const categoriesList = listCategories();
      const catOptionsArr: { value: string; label: string; hint?: string }[] = [
        { value: "__new-category", label: chalk.green("➕ Add new") },
      ];
      for (let category in categoriesList) {
        catOptionsArr.push({
          value: category.toLocaleLowerCase(),
          label: category,
          hint: `${categoriesList[category].toString()} tasks`,
        });
      }
      const categoryMenu = (await select({
        message:
          chalk.magenta("Tag it! Which category? ") + chalk.gray("(Optional)"),
        options: [
          ...catOptionsArr,
          { value: "__skip-category", label: chalk.gray("(No category)") },
        ],
      })) as string;

      let category = categoryMenu;
      if (categoryMenu === "__new-category") {
        category = (await text({
          message: chalk.magenta("Where should we file this?"),
        })) as string;
      }

      const id = addTask(
        title,
        description,
        categoryMenu === "__skip-category" ? "" : category,
      );

      console.log(chalk.green(`✅ Added '${title}' (ID: ${id})`));
    }
    i++;
  }
}

main();
