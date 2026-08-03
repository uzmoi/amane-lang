export interface Token {
  readonly type:
    | "delimiter"
    | "ref_id"
    | "block_id"
    | "keyword"
    | "string"
    | "number";
  readonly content: string;
}

export class Lexer {
  static lex(source: string): Token[] {
    const lexer = new Lexer(source);
    const tokens: Token[] = [];
    for (;;) {
      const token = lexer.read_token();
      if (token == null) break;
      tokens.push(token);
    }
    if (lexer.index < source.length) {
      throw new Error(`Unknown character at ${lexer.index}`);
    }
    return tokens;
  }

  constructor(private readonly source: string) {}
  private index = 0;

  private read_token(): Token | undefined {
    this.read_re(/\s+/y, "ws");
    return (
      this.read_re(/[(){},:;=]/y, "delimiter") ??
      this.read_re(/\d+(\.\d+)?/y, "number") ??
      this.read_re(/"([^"\\]|\\.)+"/y, "string") ??
      this.read_re(/\w+/y, "keyword") ??
      this.read_re(/%\d+/y, "ref_id") ??
      this.read_re(/#\d+/y, "block_id")
    );
  }

  private read_re<const T extends string>(re: RegExp, type: T) {
    const start = this.index;
    re.lastIndex = start;
    const result = re.exec(this.source);
    if (result == null) return;
    if (re.lastIndex <= start) {
      throw new Error("hoge");
    }
    this.index = re.lastIndex;
    return { type, content: result[0] } as const;
  }
}
