import type { Interface as ReadlineInterface } from "node:readline/promises";

export class Repl {
  async complete(_input: string): Promise<readonly string[]> {
    await Promise.resolve();

    return [];
  }
  async run(_input: string, _rli: ReadlineInterface): Promise<void> {
    await Promise.resolve();
  }
}
