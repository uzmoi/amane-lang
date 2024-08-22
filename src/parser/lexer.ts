import type { SourceLocation } from "./location";

export type TokenType = "Ident" | "Keyword" | "Whitespace" | "Comment";

export interface Token {
  type: TokenType;
  value: string;
  loc: SourceLocation;
}

export class Lexer implements IterableIterator<Token> {
  constructor(readonly source: string) {}

  next(): IteratorResult<Token, undefined> {
    throw new Error("Method not implemented.");
  }
  [Symbol.iterator]() {
    return this;
  }
}
