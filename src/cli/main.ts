import { cac } from "cac";
import { version } from "..";
import { startRepl } from "./repl";

export const main = () => {
  const cli = cac("amane");

  cli.command("repl").action(async () => {
    await startRepl();
  });

  cli.help();
  cli.version(version);
  cli.parse();
};

main();
