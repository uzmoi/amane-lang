/** biome-ignore-all lint/style/useNamingConvention: Node */
import * as P from "parsea";
import { error } from "parsea/internal";
import {
  type Delimiter,
  type Keyword,
  type Operator,
  type Token,
  TokenType,
  token_type_names,
} from "./lexer";
import { type Loc, loc } from "./location";
import type * as N from "./node";
import {
  normalize_number,
  unescape_ident,
  unescape_string_content,
} from "./utils";

const token = <T extends TokenType>(type: T) =>
  P.satisfy<Token & { type: T }, Token>((token) => token.type === type, {
    error: error.expected(token_type_names[type]),
  });

const token_with = <T extends TokenType, U extends string>(type: T, value: U) =>
  P.satisfy<Token & { type: T; value: U }, Token>(
    (token) => token.type === type && token.value === value,
    { error: error.expected(`${token_type_names[type]}("${value}")`) },
  );

const keyword = <T extends Keyword>(word: T) =>
  token_with(TokenType.Keyword, word);

const delimiter = <T extends Delimiter>(delimiter: T) =>
  token_with(TokenType.Delimiter, delimiter);

const operator = <T extends string>(operator: Operator<T>) =>
  token_with(TokenType.Operator, operator);

type ParserExt = Loc;

// #region Expression

export const Expression: P.Parser<N.Expression<ParserExt>, Token> = P.lazy(() =>
  P.choice([
    BoolLiteral,
    NumberLiteral,
    StringLiteral,
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

const BoolLiteral = P.choice([keyword("true"), keyword("false")]).map(
  (token): N.BoolExpression<ParserExt> => ({
    type: "Bool",
    value: token.value === "true",
    loc: token,
  }),
);

const NumberLiteral = P.choice([
  keyword("inf"),
  keyword("nan"),
  token(TokenType.Number),
]).map(
  (token): N.NumberExpression<ParserExt> => ({
    type: "Number",
    value: normalize_number(token.value),
    loc: token,
  }),
);

const StringLiteral = token(TokenType.String).map(
  (token): N.StringExpression<ParserExt> => ({
    type: "String",
    value: unescape_string_content(token.value.slice(1, -1)),
    loc: token,
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

const Ident = token(TokenType.Ident).map(
  (token): N.IdentExpression<ParserExt> => ({
    type: "Ident",
    name: unescape_ident(token.value),
    loc: token,
  }),
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
  loc: loc(ifToken, else_.loc),
}));

const Loop = P.seq([keyword("loop"), Expression]).map(
  ([loopToken, body]): N.LoopExpression<ParserExt> => ({
    type: "Loop",
    body,
    loc: loc(loopToken, body.loc),
  }),
);

const Break = keyword("break").map<N.BreakExpression<ParserExt>>((token) => ({
  type: "Break",
  loc: token,
}));

const Fn = P.seq([
  keyword("fn"),
  Tuple.skip(operator("=>")).option(null),
  Expression,
]).map<N.FnExpression<ParserExt>>(([fnToken, params, body]) => ({
  type: "Fn",
  params,
  body,
  loc: loc(fnToken, body.loc),
}));

const Return = P.seq([keyword("return"), Expression.option(null)]).map(
  ([returnToken, body]): N.ReturnExpression<ParserExt> => ({
    type: "Return",
    body,
    loc: loc(returnToken, body?.loc ?? returnToken),
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
    loc: loc(letToken, init.loc),
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
