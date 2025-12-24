import type { SourceLocation } from "./location";
import {
  is_bin_digit,
  is_digit,
  is_hex_digit,
  is_ident_continue,
  is_ident_start,
  is_whitespace,
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

const is_delimiter: (char: string) => char is Delimiter = (char) =>
  char === "(" ||
  char === ")" ||
  char === "[" ||
  char === "]" ||
  char === "{" ||
  char === "}" ||
  char === ";" ||
  char === ",";

export type OperatorChar =
  typeof operator_chars extends Set<infer T> ? T : never;

export type Operator<T, U = T> = T extends `${infer S}${infer Rest}`
  ? S extends OperatorChar
    ? Operator<Rest, U>
    : never
  : U;

export const operator_chars = new Set([
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

export const enum TokenType {
  Whitespace,
  Delimiter,
  Operator,
  Ident,
  Keyword,
  Number,
  String,
  Comment,
}

export const token_type_names = [
  "Whitespace",
  "Delimiter",
  "Operator",
  "Ident",
  "Keyword",
  "Number",
  "String",
  "Comment",
] as const;

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

  #read_re(re: RegExp): string {
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

  #read_ident_or_keyword() {
    if (this.source.startsWith('\\"', this.#index)) {
      this.#index += 2;
      this.#read_string();
      return TokenType.Ident;
    }

    const start = this.#index;

    while (this.#index < this.source.length) {
      if (!is_ident_continue(this.source, this.#index)) break;
      const char = this.#peek()!;
      this.#index++;
      if (char === "\\" && this.#index < this.source.length) {
        this.#index++;
      }
    }

    const value = this.source.slice(start, this.#index);
    const is_keyword = keywords.has(value as Keyword);
    return is_keyword ? TokenType.Keyword : TokenType.Ident;
  }

  #read_bin_digits() {
    while (this.#index < this.source.length) {
      const char = this.#peek()!;
      if (char !== "_" && !is_bin_digit(char)) break;
      this.#index++;
    }
  }
  #read_digits() {
    while (this.#index < this.source.length) {
      const char = this.#peek()!;
      if (char !== "_" && !is_digit(char)) break;
      this.#index++;
    }
  }
  #read_hex_digits() {
    while (this.#index < this.source.length) {
      const char = this.#peek()!;
      if (char !== "_" && !is_hex_digit(char)) break;
      this.#index++;
    }
  }

  #read_number() {
    if (this.#peek() === "0") {
      this.#index++;
      const char = this.#peek();
      switch (char) {
        case "b": // 2進リテラル
        case "B": {
          this.#index++;
          this.#read_bin_digits();
          break;
        }
        case "x": // 16進リテラル
        case "X": {
          this.#index++;
          this.#read_hex_digits();
          break;
        }
        default:
          if (char == null || !(is_digit(char) || char === "_")) return;
      }
    }

    // 10進リテラル
    this.#read_digits();
    if (this.#peek() === ".") {
      this.#index++;
      this.#read_digits();
    }
  }

  #read_string() {
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

  static #is_operator_char(char: string) {
    return operator_chars.has(char as OperatorChar);
  }
  #read_operator() {
    while (this.#index < this.source.length) {
      const char = this.#peek()!;
      if (!Lexer.#is_operator_char(char)) break;
      this.#index++;
    }
  }

  #read_line() {
    const line_end_index = this.source.indexOf("\n", this.#index);
    this.#index = line_end_index === -1 ? this.source.length : line_end_index;
  }

  static #block_comment_re = /\/\*|\*\/|$/g;
  #read_block_comment() {
    let depth = 1;
    do {
      const value = this.#read_re(Lexer.#block_comment_re);

      if (value === "") break; // EOF

      if (value === "/*") depth++;
      else depth--;
    } while (depth > 0);
  }

  #read_whitespace() {
    while (this.#index < this.source.length) {
      const char = this.#peek()!;
      if (!is_whitespace(char)) break;
      this.#index++;
    }
  }

  #read_token(): TokenType {
    const char = this.#peek()!;

    if (is_whitespace(char)) {
      this.#index++;
      this.#read_whitespace();
      return TokenType.Whitespace;
    }

    if (is_ident_start(this.source, this.#index)) {
      return this.#read_ident_or_keyword();
    }

    if (is_delimiter(char)) {
      this.#index++;
      return TokenType.Delimiter;
    }

    if (Lexer.#is_operator_char(char)) {
      if (this.source.startsWith("//", this.#index)) {
        this.#read_line();
        return TokenType.Comment;
      }

      if (this.source.startsWith("/*", this.#index)) {
        this.#index += 2;
        this.#read_block_comment();
        return TokenType.Comment;
      }

      this.#index++;
      this.#read_operator();
      return TokenType.Operator;
    }

    if (char === '"') {
      this.#index++;
      this.#read_string();
      return TokenType.String;
    }

    if (is_digit(char)) {
      this.#read_number();
      return TokenType.Number;
    }

    throw new Error("Unknown character.");
  }

  next(): IteratorResult<Token, undefined> {
    const start = this.#index;

    if (start >= this.source.length) {
      return { done: true, value: undefined };
    }

    const type = this.#read_token();

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
