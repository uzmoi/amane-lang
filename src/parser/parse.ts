import { parseA } from "parsea";
import { Lexer, type Token, TokenType } from "./lexer";
import { Expression, Module } from "./parser";

export const lex = (source: string, start_index?: number): Token[] =>
  [...new Lexer(source, start_index)].filter(
    (token) =>
      token.type !== TokenType.Whitespace && token.type !== TokenType.Comment,
  );

export const parse_module = (tokens: ArrayLike<Token>) =>
  parseA(Module, tokens);

export const parse_expression = (tokens: ArrayLike<Token>) =>
  parseA(Expression, tokens);
