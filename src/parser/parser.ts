import * as P from "parsea";
import { error } from "parsea/internal";
import type { Delimiter, Keyword, Token, TokenType } from "./lexer";
import { type Loc, loc } from "./location";
import type * as N from "./node";

const token = <T extends TokenType>(type: T) =>
  P.satisfy<Token & { type: T }, Token>((token) => token.type === type, {
    error: error.expected(type),
  });

const tokenWith = <T extends TokenType, U extends string>(type: T, value: U) =>
  P.satisfy<Token & { type: T; value: U }, Token>(
    (token) => token.type === type && token.value === value,
    { error: error.expected(`${type}("${value}")`) },
  );

const keyword = <T extends Keyword>(word: T) => tokenWith("Keyword", word);
const delimiter = <T extends Delimiter>(delimiter: T) =>
  tokenWith("Delimiter", delimiter);

type ParserExt = Loc;

// #region Expression

export const Expression: P.Parser<N.Expression<ParserExt>, Token> = P.lazy(() =>
  P.choice([Bool, Number, String, Tuple, Ident, Block, If, Loop, Break]),
);

const Bool = P.choice([keyword("true"), keyword("false")]).map(
  (token): N.BoolExpression<ParserExt> => ({
    type: "Bool",
    value: token.value === "true",
    loc: token.loc,
  }),
);

// biome-ignore lint/suspicious/noShadowRestrictedNames:
const Number = token("Number");

// biome-ignore lint/suspicious/noShadowRestrictedNames:
const String = token("String");

const Tuple = P.seq([
  delimiter("("),
  Expression.skip(delimiter(",")).apply(P.many),
  Expression.option(),
  delimiter(")"),
]).map<N.TupleExpression<ParserExt>>(([start, elements, lastElement, end]) => ({
  type: "Tuple",
  elements: lastElement == null ? elements : [...elements, lastElement],
  loc: loc(start, end),
}));

const Ident = token("Ident").map<N.IdentExpression<ParserExt>>((token) => {
  const name = token.value.replace(/\\(.?)/g, "$1");
  return {
    type: "Ident",
    name,
    loc: token.loc,
  };
});

const Block = P.seq([
  delimiter("{"),
  P.lazy(() => Statement).apply(P.many),
  Expression.option(null),
  delimiter("}"),
]).map<N.BlockExpression<ParserExt>>(([start, stmts, last, end]) => ({
  type: "Block",
  stmts,
  last,
  loc: loc(start, end),
}));

const If = P.seq([
  keyword("if"),
  Expression,
  keyword("then").then(Expression),
  keyword("else").then(Expression),
]).map<N.IfExpression<ParserExt>>(([ifToken, cond, then_, else_]) => ({
  type: "If",
  cond,
  then: then_,
  else: else_,
  loc: loc(ifToken, else_),
}));

const Loop = keyword("loop")
  .and(Expression)
  .map<N.LoopExpression<ParserExt>>(([loopToken, body]) => ({
    type: "Loop",
    body,
    loc: loc(loopToken, body),
  }));

const Break = keyword("break").map<N.BreakExpression<ParserExt>>((token) => ({
  type: "Break",
  loc: token.loc,
}));

// #endregion

// #region Statement

export const Statement: P.Parser<N.Statement<ParserExt>, Token> = P.lazy(() =>
  P.choice([ExpressionStatement]),
);

const ExpressionStatement = Expression.map(
  (expr): N.ExpressionStatement<ParserExt> => ({
    type: "Expression",
    expr,
    loc: expr.loc,
  }),
);

// #endregion
