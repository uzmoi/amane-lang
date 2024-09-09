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
    if (this.#isAhead('\\"')) {
      this.#index += 2;
      this.#readString();
      return "Ident";
    }

    const value = this.#readRe(Lexer.#identRe);
    const isKeyword = keywords.has(value as Keyword);
    return isKeyword ? "Keyword" : "Ident";
  }

  #readNumber() {
    this.#readRe(/0[bo][\d_]*|0x[\da-f_]*|[\d_]+(\.[\d_]*)?/iy);
  }

  #readString() {
    this.#readRe(/([^"\\]|\\.)*/uy);

    const char = this.#peek();
    if (char === undefined) return; // end of input

    this.#index++;

    // TODO: (char === "$") embed ident
    // TODO: (char === "{") embed expression
  }

  static operatorRe: RegExp;
  static {
    const chars = /* #__PURE__ */ [...operatorChars].join("");
    Lexer.operatorRe = new RegExp(
      `[${/* #__PURE__ */ chars.replace(/[\\\]]/g, "\\$&")}]*`,
      "y",
    );
  }
  #readOperator() {
    this.#readRe(Lexer.operatorRe);
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

  #readToken(): TokenType {
    const char = this.#peek()!;

    if (Lexer.isWhitespace(char)) {
      this.#index++;
      this.#readWhitespace();
      return "Whitespace";
    }

    if (isDelimiter(char)) {
      this.#index++;
      return "Delimiter";
    }

    if (this.#isAhead("//")) {
      this.#readLine();
      return "Comment";
    }

    if (char === '"') {
      this.#index++;
      this.#readString();
      return "String";
    }

    if (this.#isAhead("/*")) {
      this.#index += 2;
      this.#readMultiLineComment();
      return "Comment";
    }

    if (operatorChars.has(char as OperatorChar)) {
      this.#index++;
      this.#readOperator();
      return "Operator";
    }

    if (/\d/.test(char)) {
      this.#readNumber();
      return "Number";
    }

    if (Lexer.#identStartRe.test(char)) {
      return this.#readIdent();
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
