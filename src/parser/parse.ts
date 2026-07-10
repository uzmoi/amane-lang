import { parseA } from "parsea";
import type { Token } from "./lexer";
import { Expression, Module } from "./parser";

export const parse_module = (tokens: ArrayLike<Token>) =>
  parseA(Module, tokens);

export const parse_expression = (tokens: ArrayLike<Token>) =>
  parseA(Expression, tokens);
