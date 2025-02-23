import { stdin, stdout } from "node:process";
import { createInterface } from "node:readline/promises";
import pc from "picocolors";
import { version } from "../..";
import { commands } from "./commands";
import { Repl } from "./repl";

export const startRepl = async () => {
  stdout.write(`Welcome to amane v${version}. For help, enter :help.\n`);

  const repl = new Repl();

  const rli = createInterface({
    input: stdin,
    output: stdout,
    prompt: pc.yellow("> "),
    async completer(line: string) {
      const completions = await repl.complete(line);
      return [completions, line];
    },
    tabSize: 2,
  });

  repl.registerCommands(commands(rli));

  let shouldExit = false;

  rli.on("SIGINT", () => {
    if (shouldExit) {
      stdout.write("\n");
      rli.close();
    } else {
      shouldExit = true;
      stdout.write("\nTo exit, press ctrl-c again or enter :quit.\n");
      rli.prompt();
    }
  });

  rli.prompt();

  for await (const line of rli) {
    shouldExit = false;

    if (line === "") {
      rli.prompt();
      continue;
    }

    rli.pause();

    await repl.run(line);

    rli.prompt();
  }

  rli.close();
};
