import { ParseAError } from "parsea";
import { emit_wasm, Lexer, parse_expression } from "../..";

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
    const lexer = new Lexer(source);
    const tokens = [...lexer];

    try {
      const _node = parse_expression(tokens);

      // TODO: ASTをlowingしてAirに変換
      // REPL用にstartを設定するなどの変形を行いemit_wasmに渡す。

      const module = { items: [] };

      const wasm_binary = emit_wasm(module);

      const { instance } = await WebAssembly.instantiate(wasm_binary, {
        // TODO: これまでに定義した変数や依存モジュールの値を渡す。
      });

      // TODO: 定義した変数を保持する。
      instance.exports;
    } catch (error) {
      if (error instanceof ParseAError) {
        const target_token = tokens[error.index];
        // TODO: いい感じにエラーを表示する。
        console.error("ParseError:", source, target_token, error.errors);
        return;
      }

      throw error;
    }
  }
}
