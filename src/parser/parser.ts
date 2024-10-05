import * as P from "parsea";
import { error } from "parsea/internal";
import type { Delimiter, Keyword, Operator, Token, TokenType } from "./lexer";
import { type Loc, loc } from "./location";
import type * as N from "./node";
import { unescapeStringContent } from "./utils";

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
const operator = <T extends string>(operator: Operator<T>) =>
  tokenWith("Operator", operator);

type ParserExt = Loc;

// #region Expression

export const Expression: P.Parser<N.Expression<ParserExt>, Token> = P.lazy(() =>
  P.choice([
    Bool,
    Number,
    String,
    Tuple,
    Ident,
    Block,
    If,
    Loop,
    Break,
    Fn,
    Return,
  ]),
);

const Bool = P.choice([keyword("true"), keyword("false")]).map(
  ({ value, loc }): N.BoolExpression<ParserExt> => ({
    type: "Bool",
    value: value === "true",
    loc,
  }),
);

// biome-ignore lint/suspicious/noShadowRestrictedNames:
const Number = P.choice([keyword("inf"), keyword("nan"), token("Number")]).map(
  ({ value, loc }): N.NumberExpression<ParserExt> => ({
    type: "Number",
    // biome-ignore lint/performance/useTopLevelRegex: for readability
    value: value.replace(/_/g, "").replace(/^(0[box])?0+\B/, "$1"),
    loc,
  }),
);

// biome-ignore lint/suspicious/noShadowRestrictedNames:
const String = token("String").map(
  ({ value, loc }): N.StringExpression<ParserExt> => ({
    type: "String",
    value: unescapeStringContent(value.slice(1, -1)),
    loc,
  }),
);

const Tuple = P.seq([
  delimiter("("),
  Expression.apply(P.sepBy, delimiter(","), { trailing: "allow" }),
  delimiter(")"),
]).map<N.TupleExpression<ParserExt>>(([start, elements, end]) => ({
  type: "Tuple",
  elements,
  loc: loc(start, end),
}));

const Ident = token("Ident").map(
  ({ value, loc }): N.IdentExpression<ParserExt> => {
    const isStringIdent = value.startsWith('\\"') && value.endsWith('"');
    const name = isStringIdent
      ? unescapeStringContent(value.slice(2, -1))
      : value.replace(/\\(.?)/g, "$1");
    return {
      type: "Ident",
      name,
      loc,
    };
  },
);

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

const Loop = P.seq([keyword("loop"), Expression]).map(
  ([loopToken, body]): N.LoopExpression<ParserExt> => ({
    type: "Loop",
    body,
    loc: loc(loopToken, body),
  }),
);

const Break = keyword("break").map<N.BreakExpression<ParserExt>>((token) => ({
  type: "Break",
  loc: token.loc,
}));

const Fn = P.seq([
  keyword("fn"),
  Tuple.skip(operator("=>")).option(null),
  Expression,
]).map<N.FnExpression<ParserExt>>(([fnToken, params, body]) => ({
  type: "Fn",
  params,
  body,
  loc: loc(fnToken, body),
}));

const Return = P.seq([keyword("return"), Expression.option(null)]).map(
  ([returnToken, body]): N.ReturnExpression<ParserExt> => ({
    type: "Return",
    body,
    loc: loc(returnToken, body ?? returnToken),
  }),
);

// #endregion

// #region Statement

export const Statement: P.Parser<N.Statement<ParserExt>, Token> = P.lazy(() =>
  P.choice([Let, ExpressionStatement]),
);

const Let = P.seq([keyword("let"), Ident, operator("="), Expression]).map(
  ([letToken, dest, , init]): N.LetStatement<ParserExt> => ({
    type: "Let",
    dest,
    init,
    loc: loc(letToken, init),
  }),
);

const ExpressionStatement = Expression.map(
  (expr): N.ExpressionStatement<ParserExt> => ({
    type: "Expression",
    expr,
    loc: expr.loc,
  }),
);

// #endregion
