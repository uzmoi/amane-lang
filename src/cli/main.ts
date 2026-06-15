import { cac } from "cac";
import { version } from "..";
import { start_repl } from "./repl";

export const main = () => {
  const cli = cac("amane");

  // picocolors が使用している。
  cli.option("--color, --no-color", "color", { type: [Boolean] });

  cli.command("repl").action(async () => {
    await start_repl();
  });

  cli.help();
  cli.version(version);
  cli.parse();
};

main();
