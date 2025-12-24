import { parseA } from "parsea";
import type { Token } from "./lexer";
import { Expression } from "./parser";

export const parse_expression = (tokens: ArrayLike<Token>) =>
  parseA(Expression, tokens);
