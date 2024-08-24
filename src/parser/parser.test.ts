import { EOI, type Parser } from "parsea";
import { describe, expect, test } from "vitest";
import { Lexer, type Token } from "./lexer";
import type { Loc, SourceLocation } from "./location";
import type * as N from "./node";
import { Expression } from "./parser";

const parse = (parser: Parser<unknown, Token>, source: string) => {
  const tokens = [...new Lexer(source)].filter(
    (token) => token.type !== "Whitespace",
  );
  const result = parser.skip(EOI).parse(tokens);
  if (result.success) return result.value;
  throw result;
};

const loc: SourceLocation = {
  start: expect.any(Number),
  end: expect.any(Number),
};

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

test("Number", () => {
  expect(parse(Expression, "0")).toEqual(node("Number", { value: "0" }));
});

test("String", () => {
  expect(parse(Expression, '""')).toEqual(node("String", { value: '""' }));
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

test("Ident", () => {
  expect(parse(Expression, "hoge")).toEqual(node("Ident", { name: "hoge" }));
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
