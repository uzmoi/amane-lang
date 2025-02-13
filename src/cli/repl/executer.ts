import { Lexer } from "../..";

export class ReplExecuter {
  reset() {
    // TODO: impl
  }
  // biome-ignore lint/suspicious/useAwait:
  async complete(source: string): Promise<string[]> {
    const _lexer = new Lexer(source);

    // TODO: impl

    return [];
  }
  // biome-ignore lint/suspicious/useAwait:
  async execute(source: string): Promise<void> {
    const _lexer = new Lexer(source);

    // TODO: impl
  }
}
