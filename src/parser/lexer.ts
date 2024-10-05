import type { SourceLocation } from "./location";
import { isAlphabet, isDigit, isWhitespace } from "./utils";

export type Keyword = typeof keywords extends Set<infer T> ? T : never;

export const keywords = new Set([
  "true",
  "false",
  "inf",
  "nan",
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

export type Delimiter = "(" | ")" | "[" | "]" | "{" | "}" | ";" | ",";

const isDelimiter: (char: string) => char is Delimiter = (char) =>
  char === "(" ||
  char === ")" ||
  char === "[" ||
  char === "]" ||
  char === "{" ||
  char === "}" ||
  char === ";" ||
  char === ",";

export type OperatorChar = typeof operatorChars extends Set<infer T>
  ? T
  : never;

export type Operator<T, U = T> = T extends `${infer S}${infer Rest}`
  ? S extends OperatorChar
    ? Operator<Rest, U>
    : never
  : U;

export const operatorChars = new Set([
  "!",
  "#",
  "$",
  "%",
  "&",
  "*",
  "+",
  "-",
  ".",
  "/",
  ":",
  "<",
  "=",
  ">",
  "?",
  "@",
  "^",
  "|",
  "~",
] as const);

export type TokenType =
  | "Whitespace"
  | "Delimiter"
  | "Operator"
  | "Ident"
  | "Keyword"
  | "Number"
  | "String"
  | "Comment";

export class Token {
  constructor(
    readonly type: TokenType,
    readonly value: string,
    readonly loc: SourceLocation,
  ) {}
}

export class Lexer implements IterableIterator<Token> {
  constructor(readonly source: string) {}

  #index = 0;

  #peek(): string | undefined {
    return this.source[this.#index];
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

  static #isIdentChar(char: string) {
    return isDigit(char) || isAlphabet(char) || char === "\\" || char === "_";
  }
  #readIdentOrKeyword() {
    if (this.source.startsWith('\\"', this.#index)) {
      this.#index += 2;
      this.#readString();
      return "Ident";
    }

    const start = this.#index;

    while (this.#index < this.source.length) {
      const char = this.#peek()!;
      if (!Lexer.#isIdentChar(char)) break;
      this.#index++;
      if (char === "\\" && this.#index < this.source.length) {
        this.#index++;
      }
    }

    const value = this.source.slice(start, this.#index);
    const isKeyword = keywords.has(value as Keyword);
    return isKeyword ? "Keyword" : "Ident";
  }

  static #numberRe = /0[bo][\d_]*|0x[\da-f_]*|[\d_]+(\.[\d_]*)?/iy;
  #readNumber() {
    this.#readRe(Lexer.#numberRe);
  }

  #readString() {
    while (this.#index < this.source.length) {
      const char = this.#peek()!;
      this.#index++;
      switch (char) {
        case "\\": {
          if (this.#index < this.source.length) {
            this.#index++;
          }
          break;
        }
        case '"': {
          return;
        }
        // TODO: case "$": embed ident
        // TODO: case "{": embed expression
        default: {
          // noop
        }
      }
    }
  }

  static #isOperatorChar(char: string) {
    return operatorChars.has(char as OperatorChar);
  }
  #readOperator() {
    while (this.#index < this.source.length) {
      const char = this.#peek()!;
      if (!Lexer.#isOperatorChar(char)) break;
      this.#index++;
    }
  }

  #readLine() {
    const lineEndIndex = this.source.indexOf("\n", this.#index);
    this.#index = lineEndIndex === -1 ? this.source.length : lineEndIndex;
  }

  static #mlcRe = /\/\*|\*\/|$/g;
  #readMultiLineComment() {
    let depth = 1;
    do {
      const value = this.#readRe(Lexer.#mlcRe);

      if (value === "") break; // EOF

      if (value === "/*") depth++;
      else depth--;
    } while (depth > 0);
  }

  #readWhitespace() {
    while (this.#index < this.source.length) {
      const char = this.#peek()!;
      if (!isWhitespace(char)) break;
      this.#index++;
    }
  }

  #readToken(): TokenType {
    const char = this.#peek()!;

    if (isWhitespace(char)) {
      this.#index++;
      this.#readWhitespace();
      return "Whitespace";
    }

    if (isAlphabet(char) || char === "\\" || char === "_") {
      return this.#readIdentOrKeyword();
    }

    if (isDelimiter(char)) {
      this.#index++;
      return "Delimiter";
    }

    if (Lexer.#isOperatorChar(char)) {
      if (this.source.startsWith("//", this.#index)) {
        this.#readLine();
        return "Comment";
      }

      if (this.source.startsWith("/*", this.#index)) {
        this.#index += 2;
        this.#readMultiLineComment();
        return "Comment";
      }

      this.#index++;
      this.#readOperator();
      return "Operator";
    }

    if (char === '"') {
      this.#index++;
      this.#readString();
      return "String";
    }

    if (isDigit(char)) {
      this.#readNumber();
      return "Number";
    }

    throw new Error("Unknown character.");
  }

  next(): IteratorResult<Token, undefined> {
    const start = this.#index;

    if (start >= this.source.length) {
      return { done: true, value: undefined };
    }

    const type = this.#readToken();

    const end = this.#index;
    if (start === end) {
      throw new Error("An empty token is invalid.");
    }

    const value = this.source.slice(start, end);
    const token = new Token(type, value, { start, end });

    return { done: false, value: token };
  }
  [Symbol.iterator]() {
    return this;
  }
}
