import { type Parser, parseA } from "parsea";
import { describe, expect, test } from "vitest";
import type { Token } from "./lexer";
import type { Loc, SourceLocation } from "./location";
import type * as N from "./node";
import { lex } from "./parse";
import { Expression, Statement } from "./parser";

const parse = (parser: Parser<unknown, Token>, source: string) => {
  const tokens = lex(source);
  return parseA(parser, tokens);
};

const loc: SourceLocation = expect.objectContaining({
  start: expect.any(Number),
  end: expect.any(Number),
});

type SelectNode<T, U = never> = Extract<N.Node<U>, { type: T }>;

const node = <T extends N.Node["type"]>(
  type: T,
  ...[node]: [keyof SelectNode<T>] extends ["type"]
    ? []
    : [node: Omit<SelectNode<T>, "type">]
) => ({ type, ...node, loc }) as SelectNode<T, Loc>;

describe("Bool", () => {
  test("true", () => {
    expect(parse(Expression, "true")).toEqual(node("Bool", { value: true }));
  });
  test("false", () => {
    expect(parse(Expression, "false")).toEqual(node("Bool", { value: false }));
  });
});

describe("Number", () => {
  test("number", () => {
    expect(parse(Expression, "0")).toEqual(node("Number", { value: "0" }));
  });
  test("remove underscores", () => {
    expect(parse(Expression, "1_000")).toEqual(
      node("Number", { value: "1000" }),
    );
  });
  test("remove leading zeros", () => {
    expect(parse(Expression, "0_000.0")).toEqual(
      node("Number", { value: "0.0" }),
    );
  });
  test("nan", () => {
    expect(parse(Expression, "nan")).toEqual(node("Number", { value: "nan" }));
  });
  test("inf", () => {
    expect(parse(Expression, "inf")).toEqual(node("Number", { value: "inf" }));
  });
});

describe("String", () => {
  test("empty", () => {
    expect(parse(Expression, '""')).toEqual(node("String", { value: "" }));
  });
  test("unescape", () => {
    expect(parse(Expression, '"\\\\"')).toEqual(
      node("String", { value: "\\" }),
    );
  });
  test("escape sequence", () => {
    expect(parse(Expression, '"\\n"')).toEqual(node("String", { value: "\n" }));
  });
});

describe("Tuple", () => {
  test("empty", () => {
    expect(parse(Expression, "()")).toEqual(node("Tuple", { elements: [] }));
  });
  test("single element", () => {
    expect(parse(Expression, "(0)")).toEqual(
      node("Tuple", { elements: [node("Number", { value: "0" })] }),
    );
  });
  test("elements", () => {
    expect(parse(Expression, "(0, 1, 2)")).toEqual(
      node("Tuple", {
        elements: [
          node("Number", { value: "0" }),
          node("Number", { value: "1" }),
          node("Number", { value: "2" }),
        ],
      }),
    );
  });
  test("trailing comma", () => {
    expect(parse(Expression, "(0, )")).toEqual(
      node("Tuple", { elements: [node("Number", { value: "0" })] }),
    );
  });
});

describe("Ident", () => {
  test("ident", () => {
    expect(parse(Expression, "hoge")).toEqual(node("Ident", { name: "hoge" }));
  });
  test("unescape", () => {
    expect(parse(Expression, "\\!")).toEqual(node("Ident", { name: "!" }));
  });
  describe("string ident", () => {
    test("empty", () => {
      expect(parse(Expression, '\\""')).toEqual(node("Ident", { name: "" }));
    });
    test("unescape", () => {
      expect(parse(Expression, '\\"\\0"')).toEqual(
        node("Ident", { name: "\0" }),
      );
    });
  });
});

describe("Block", () => {
  test("empty", () => {
    expect(parse(Expression, "{}")).toEqual(
      node("Block", { stmts: [], last: null }),
    );
  });
});

test("If", () => {
  expect(
    parse(Expression, "if condition then then_body else else_body"),
  ).toEqual(
    node("If", {
      cond: node("Ident", { name: "condition" }),
      then: node("Ident", { name: "then_body" }),
      else: node("Ident", { name: "else_body" }),
    }),
  );
});

test("Loop", () => {
  expect(parse(Expression, "loop body")).toEqual(
    node("Loop", { body: node("Ident", { name: "body" }) }),
  );
});

test("Break", () => {
  expect(parse(Expression, "break")).toEqual(node("Break"));
});

describe("Fn", () => {
  test("omit params", () => {
    expect(parse(Expression, "fn body")).toEqual(
      node("Fn", {
        params: [],
        ret_ty: null,
        body: node("Ident", { name: "body" }),
      }),
    );
  });
  test("with params", () => {
    expect(parse(Expression, "fn (param1, param2: ty1): ty2 => {}")).toEqual(
      node("Fn", {
        params: [
          [node("Ident", { name: "param1" }), null],
          [node("Ident", { name: "param2" }), node("Ident", { name: "ty1" })],
        ],
        ret_ty: node("Ident", { name: "ty2" }),
        body: node("Block", { stmts: [], last: null }),
      }),
    );
  });
});

describe("Return", () => {
  test("without value", () => {
    expect(parse(Expression, "return")).toEqual(node("Return", { body: null }));
  });
  test("with value", () => {
    expect(parse(Expression, "return result")).toEqual(
      node("Return", { body: node("Ident", { name: "result" }) }),
    );
  });
});

describe("Let", () => {
  test("without type annotation", () => {
    expect(parse(Statement, 'let hoge = ""')).toEqual(
      node("Let", {
        dest: node("Ident", { name: "hoge" }),
        ty: null,
        init: node("String", { value: "" }),
      }),
    );
  });

  test("with type annotation", () => {
    expect(parse(Statement, "let hoge: i32 = 0")).toEqual(
      node("Let", {
        dest: node("Ident", { name: "hoge" }),
        ty: node("Ident", { name: "i32" }),
        init: node("Number", { value: "0" }),
      }),
    );
  });
});
