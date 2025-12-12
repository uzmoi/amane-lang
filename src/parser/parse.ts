import { parseA } from "parsea";
import type { Token } from "./lexer";
import { Expression } from "./parser";

export const parseExpression = (tokens: ArrayLike<Token>) =>
  parseA(Expression, tokens);
