import { Lexer } from "../..";

export class ReplExecuter {
  reset() {
    // TODO: impl
  }
  async complete(source: string): Promise<string[]> {
    const _lexer = new Lexer(source);

    // TODO: impl

    return [];
  }
  async execute(source: string): Promise<void> {
    const _lexer = new Lexer(source);

    // TODO: impl
  }
}
