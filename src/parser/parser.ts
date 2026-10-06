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

// Expression

export const Expression: P.Parser<N.Expression<ParserExt>, Token> = P.lazy(() =>
  P.choice([
    BoolLiteral,
    NumberLiteral,
    StringLiteral,
    Tuple,
    Ident,
    BlockExpression,
    IfExpression,
    LoopExpression,
    BreakExpression,
    ReturnExpression,
  ]).flatMap(tail),
);

const tail = (
  expr: N.Expression<ParserExt>,
): P.Parser<N.Expression<ParserExt>, Token> =>
  CallExpression(expr).flatMap(tail).option(expr);

const BoolLiteral = P.choice([keyword("true"), keyword("false")]).map(
  (token): N.BoolLiteral<ParserExt> => ({
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
  (token): N.NumberLiteral<ParserExt> => ({
    type: "Number",
    value: normalize_number(token.value),
    loc: token,
  }),
);

const StringLiteral = token(TokenType.String).map(
  (token): N.StringLiteral<ParserExt> => ({
    type: "String",
    value: unescape_string_content(token.value.slice(1, -1)),
    loc: token,
  }),
);

const Tuple = P.seq([
  delimiter("("),
  Expression.apply(P.sepBy, delimiter(","), { trailing: "allow" }),
  delimiter(")"),
]).map(
  ([start, elements, end]): N.TupleExpression<ParserExt> => ({
    type: "Tuple",
    elements,
    loc: loc(start, end),
  }),
);

const Ident = token(TokenType.Ident).map(
  (token): N.IdentExpression<ParserExt> => ({
    type: "Ident",
    name: unescape_ident(token.value),
    loc: token,
  }),
);

const Ty = Ident;
const TyAnno = operator(":").then(Ty);

const BlockExpression = P.seq([
  delimiter("{"),
  P.lazy(() => Statement).apply(P.many),
  Expression.option(null),
  delimiter("}"),
]).map(
  ([start, stmts, last, end]): N.BlockExpression<ParserExt> => ({
    type: "Block",
    stmts,
    last,
    loc: loc(start, end),
  }),
);

const IfExpression = P.seq([
  keyword("if"),
  Expression,
  keyword("then").then(Expression),
  keyword("else").then(Expression),
]).map(
  ([ifToken, cond, then_body, else_body]): N.IfExpression<ParserExt> => ({
    type: "If",
    cond,
    then: then_body,
    else: else_body,
    loc: loc(ifToken, else_body.loc),
  }),
);

const LoopExpression = P.seq([keyword("loop"), Expression]).map(
  ([loopToken, body]): N.LoopExpression<ParserExt> => ({
    type: "Loop",
    body,
    loc: loc(loopToken, body.loc),
  }),
);

const BreakExpression = keyword("break").map(
  (token): N.BreakExpression<ParserExt> => ({
    type: "Break",
    loc: token,
  }),
);

const ReturnExpression = P.seq([
  keyword("return"),
  Expression.option(null),
]).map(
  ([returnToken, body]): N.ReturnExpression<ParserExt> => ({
    type: "Return",
    body,
    loc: loc(returnToken, body?.loc ?? returnToken),
  }),
);

const CallExpression = (expr: N.Expression<ParserExt>) =>
  P.seq([
    delimiter("("),
    Expression.apply(P.sepBy, delimiter(","), { trailing: "allow" }),
    delimiter(")"),
  ]).map(
    ([, args, endToken]): N.CallExpression<ParserExt> => ({
      type: "Call",
      callee: expr,
      args,
      loc: loc(expr.loc, endToken),
    }),
  );

// Statement

const LetStatement = P.seq([
  keyword("let"),
  Ident,
  TyAnno.option(null),
  operator("=").then(Expression),
]).map(
  ([letToken, dest, ty, init]): N.LetStatement<ParserExt> => ({
    type: "Let",
    dest,
    ty,
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

export const Statement: P.Parser<N.Statement<ParserExt>, Token> = P.choice([
  LetStatement,
  ExpressionStatement,
]);

// ModuleItem

const FnModuleItem = P.seq([
  keyword("fn"),
  Ident,
  P.seq([Ident, TyAnno])
    .apply(P.sepBy, delimiter(","), { trailing: "allow" })
    .between(delimiter("("), delimiter(")"))
    .option<[]>([]),
  TyAnno,
  operator("=>").then(Expression),
]).map(
  ([fnToken, name, params, ret_ty, body]): N.FnModuleItem<ParserExt> => ({
    type: "Fn",
    name,
    params,
    ret_ty,
    body,
    loc: loc(fnToken, body.loc),
  }),
);

export const ModuleItem: P.Parser<N.ModuleItem<ParserExt>, Token> = P.choice([
  FnModuleItem,
  Statement.map(
    (stmt): N.StatementModuleItem<ParserExt> => ({
      type: "Statement",
      stmt,
      loc: stmt.loc,
    }),
  ),
]);

export const Module = P.many(ModuleItem).map(
  (items): N.Module<ParserExt> => ({
    type: "Module",
    items,
    loc:
      items.length === 0
        ? { start: 0, end: 0 }
        : loc(items[0]!.loc, items.at(-1)!.loc),
  }),
);
