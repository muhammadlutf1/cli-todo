import { group, isCancel, text } from "@clack/prompts";
import chalk from "chalk";

const label = chalk.gray(
  "(Optional)\n   format: YYYY-MM-DD\n   you can use keywords: 'today', 'tomorrow', 'yesterday'",
);

export async function dayInput() {
  const result = await text({
    message: "Day date? " + label,
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
        message: "Start Date? " + label,
      }),
    endDate: () =>
      text({
        message: "End Date? " + label,
      }),
  });

  if (isCancel(result)) {
    return { startDate: "", endDate: "" };
  }

  return result;
}
