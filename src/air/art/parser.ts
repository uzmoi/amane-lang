import * as P from "parsea";
import { error } from "parsea/internal";
import type { Air, AirStatement, Id } from "../air";
import type { Ty } from "../ty";
import { Lexer, type Token } from "./lexer";

const token = (type: Token["type"]) =>
  P.satisfy((token: Token) => token.type === type, {
    error: error.expected(type),
  });

const keyword = (keyword: string) =>
  P.satisfy(
    (token: Token) => token.type === "keyword" && token.content === keyword,
    { error: error.expected(`${keyword} keyword`) },
  );

const delimiter = (delimiter: string) =>
  P.satisfy(
    (token: Token) => token.type === "delimiter" && token.content === delimiter,
    { error: error.expected(`delimiter '${delimiter}'`) },
  );

const id = token("id").map(
  ({ content }) => parseInt(content.slice(1), 10) as Id,
);

const ty = P.lazy((): P.Parser<Ty, Token> => {
  return P.choice([
    id.map((id): Ty => ({ type: "ref", id })),

    ...(["i32", "i64", "f32", "f64"] as const).map((t) =>
      keyword(t).return<Ty>({ type: t }),
    ),

    P.seq([
      keyword("fn"),
      P.choice([
        P.sepBy(ty, delimiter(","), { trailing: "allow" }).between(
          delimiter("("),
          delimiter(")"),
        ),
        P.pure([]),
      ]),
      delimiter(":").then(ty),
    ]).map(([, params, ret]): Ty => ({ type: "fn", params, ret })),
  ]);
});

const air = P.lazy((): P.Parser<Air, Token> => {
  return P.choice([
    id.map((id): Air => ({ type: "ref", id })),

    P.seq([
      keyword("fn"),
      P.choice([
        P.sepBy(
          P.seq([id, delimiter(":"), ty]).map(([id, , ty]) => ({ id, ty })),
          delimiter(","),
          { trailing: "allow" },
        ).between(delimiter("("), delimiter(")")),
        P.pure([]),
      ]),
      air,
    ]).map(([, params, body]): Air => ({ type: "fn", params, body })),

    keyword("return")
      .then(air)
      .map((value): Air => ({ type: "return", value })),

    P.seq([
      keyword("call").then(air),
      P.choice([
        P.sepBy(air, delimiter(","), { trailing: "allow" }).between(
          delimiter("("),
          delimiter(")"),
        ),
        P.pure([]),
      ]),
    ]).map(([callee, args]): Air => ({ type: "call", callee, args })),

    P.seq([
      P.many(statement.skip(delimiter(";"))),
      P.choice([air, P.pure(null)]),
    ])
      .between(delimiter("{"), delimiter("}"))
      .map(([body, last]): Air => ({ type: "block", body, last })),

    keyword("loop")
      .then(air)
      .map((body): Air => ({ type: "loop", body })),

    keyword("break").return<Air>({ type: "break" }),

    P.seq([
      keyword("if").then(air),
      keyword("then").then(air),
      keyword("else").then(air),
    ]).map(([cond, then, els]): Air => ({ type: "if", cond, then, else: els })),

    token("number").map(
      ({ content }): Air => ({ type: "const.int", value: BigInt(+content) }),
    ),
  ]);
});

const statement = P.choice([
  keyword("let")
    .then(P.seq([id, delimiter("=").then(air)]))
    .map(([id, init]): AirStatement => ({ type: "def", id, init })),

  P.seq([id, delimiter("=").then(air)]).map(
    ([id, val]): AirStatement => ({ type: "assign", id, val }),
  ),

  air,
]);

export const parse_ty = (string: string): Ty => P.parseA(ty, Lexer.lex(string));

export const parse_art = (string: string): AirStatement =>
  P.parseA(statement, Lexer.lex(string));
