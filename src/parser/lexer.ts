import type { SourceLocation } from "./location";

export type Keyword = typeof keywords extends Set<infer T> ? T : never;

export const keywords = new Set([
  "true",
  "false",
  "if",
  "then",
  "else",
  "loop",
  "break",
  "let",
  "do",
  "fn",
  "return",
] as const);

export type TokenType = "Ident" | "Keyword" | "Whitespace" | "Comment";

export interface Token {
  type: TokenType;
  value: string;
  loc: SourceLocation;
}

export class Lexer implements IterableIterator<Token> {
  constructor(readonly source: string) {}

  #index = 0;
  #prevTokenEndIndex = 0;
  #token(type: TokenType): Token {
    const start = this.#prevTokenEndIndex;
    const end = this.#index;
    if (start === end) {
      throw new Error("An empty token is invalid.");
    }
    this.#prevTokenEndIndex = end;
    const value = this.source.slice(start, end);
    return { type, value, loc: { start, end } };
  }

  #peek(): string | undefined {
    return this.source[this.#index];
  }
  #isAhead(string: string): boolean {
    return this.source.startsWith(string, this.#index);
  }

  #readRe(re: RegExp): string {
    if (!(re.sticky || re.global)) {
      throw new Error("Requires sticky or global flag.");
    }

    re.lastIndex = this.#index;
    const result = re.exec(this.source);

    if (result == null) {
      throw new Error(`Could not match ${re} at index ${this.#index}.`);
    }

    this.#index = re.lastIndex;
    return result[0];
  }

  static #identStartRe = /[A-Za-z\\]/;
  static #identRe = /([\dA-Za-z_]|\\.)*\\?/uy;
  #readIdent() {
    const value = this.#readRe(Lexer.#identRe);
    const isKeyword = keywords.has(value as Keyword);
    return this.#token(isKeyword ? "Keyword" : "Ident");
  }

  #readLine() {
    this.#readRe(/.*/y);
  }

  #readMultiLineComment() {
    let depth = 1;
    do {
      const value = this.#readRe(/\/\*|\*\/|$/g);

      if (value === "") break; // EOF

      if (value === "/*") depth++;
      else depth--;
    } while (depth > 0);
  }

  static isWhitespace(char: string) {
    return /\p{White_Space}/u.test(char);
  }
  #readWhitespace() {
    this.#readRe(/\p{White_Space}*/uy);
  }

  #readToken(): Token | undefined {
    const char = this.#peek();
    if (char === undefined) return;

    if (Lexer.isWhitespace(char)) {
      this.#index++;
      this.#readWhitespace();
      return this.#token("Whitespace");
    }

    if (this.#isAhead("//")) {
      this.#readLine();
      return this.#token("Comment");
    }

    if (this.#isAhead("/*")) {
      this.#index += 2;
      this.#readMultiLineComment();
      return this.#token("Comment");
    }

    if (Lexer.#identStartRe.test(char)) {
      return this.#readIdent();
    }

    throw new Error("Unknown character.");
  }

  next(): IteratorResult<Token, undefined> {
    const token = this.#readToken();
    return {
      done: token === undefined,
      value: token,
    } as IteratorResult<Token, undefined>;
  }
  [Symbol.iterator]() {
    return this;
  }
}
