import type { SourceLocation } from "./location";
import {
  isBinDigit,
  isDigit,
  isHexDigit,
  isIdentContinue,
  isIdentStart,
  isWhitespace,
} from "./utils";

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

export class Token implements SourceLocation {
  constructor(
    readonly type: TokenType,
    readonly value: string,
    readonly start: number,
    readonly end: number,
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

  #readIdentOrKeyword() {
    if (this.source.startsWith('\\"', this.#index)) {
      this.#index += 2;
      this.#readString();
      return "Ident";
    }

    const start = this.#index;

    while (this.#index < this.source.length) {
      const char = this.#peek()!;
      if (!isIdentContinue(char)) break;
      this.#index++;
      if (char === "\\" && this.#index < this.source.length) {
        this.#index++;
      }
    }

    const value = this.source.slice(start, this.#index);
    const isKeyword = keywords.has(value as Keyword);
    return isKeyword ? "Keyword" : "Ident";
  }

  #readBinDigits() {
    while (this.#index < this.source.length) {
      const char = this.#peek()!;
      if (char !== "_" && !isBinDigit(char)) break;
      this.#index++;
    }
  }
  #readDigits() {
    while (this.#index < this.source.length) {
      const char = this.#peek()!;
      if (char !== "_" && !isDigit(char)) break;
      this.#index++;
    }
  }
  #readHexDigits() {
    while (this.#index < this.source.length) {
      const char = this.#peek()!;
      if (char !== "_" && !isHexDigit(char)) break;
      this.#index++;
    }
  }

  #readNumber() {
    if (this.#peek() === "0") {
      this.#index++;
      const char = this.#peek();
      switch (char) {
        case "b": // 2進リテラル
        case "B": {
          this.#index++;
          this.#readBinDigits();
          break;
        }
        case "x": // 16進リテラル
        case "X": {
          this.#index++;
          this.#readHexDigits();
          break;
        }
        default:
          if (char == null || !(isDigit(char) || char === "_")) return;
      }
    }

    // 10進リテラル
    this.#readDigits();
    if (this.#peek() === ".") {
      this.#index++;
      this.#readDigits();
    }
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

    if (isIdentStart(char)) {
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
    if (start >= end) {
      throw new Error("An empty token is invalid.");
    }

    const value = this.source.slice(start, end);
    const token = new Token(type, value, start, end);

    return { done: false, value: token };
  }
  [Symbol.iterator]() {
    return this;
  }
}
