import type { Interface as ReadlineInterface } from "node:readline/promises";
import type { Repl } from "./repl";

export interface ReplCommand {
  name: string;
  description: string;
  run(repl: Repl, argument: string | undefined): void | Promise<void>;
  complete?(arg: string): Promise<readonly string[]>;
}

interface ReplCommandParseResult {
  commandName: string;
  argument?: string;
}

export const parseReplCommand = (line: string): ReplCommandParseResult => {
  const i = line.indexOf(" ", 1);
  return i === -1
    ? { commandName: line.slice(1) }
    : { commandName: line.slice(1, i), argument: line.slice(i + 1) };
};

export const commands = (rli: ReadlineInterface): ReplCommand[] => [
  {
    name: "help",
    description: "Print this help.",
    run(_repl) {
      // TODO: impl
      // repl.println(repl.help().join("\n"));
    },
  },
  {
    name: "quit",
    description: "Quit REPL.",
    run() {
      rli.close();
    },
  },
];
