import { expect, test } from "vitest";
import { Lexer, type Token } from "./lexer";

const MAX_LENGTH = 10000;

const lex = (source: string): Token[] => {
  const tokens = [];
  for (const token of new Lexer(source)) {
    if (tokens.push(token) > MAX_LENGTH) break;
  }
  return tokens;
};

test("empty", () => {
  expect(lex("")).toEqual([]);
});
