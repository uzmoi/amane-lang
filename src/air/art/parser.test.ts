import { describe, expect, test } from "vitest";
import { parse_art as art } from "./parser";

test("ref", () => {
  expect(art("%0")).toEqual({ type: "ref", id: 0 });
});

describe("fn", () => {
  test("constant", () => {
    expect(art("fn 0")).toEqual({
      type: "fn",
      params: [],
      body: art("0"),
    });
  });

  test("with params", () => {
    expect(art("fn (%0, %1) %2")).toEqual({
      type: "fn",
      params: [0, 1],
      body: art("%2"),
    });
  });

  test("return", () => {
    expect(art("fn return 0")).toEqual({
      type: "fn",
      params: [],
      body: {
        type: "return",
        value: art("0"),
      },
    });
  });
});

describe("block", () => {
  test("empty", () => {
    expect(art("{}")).toEqual({
      type: "block",
      body: [],
      last: null,
    });
  });

  test("statement", () => {
    expect(art("{ 0; }")).toEqual({
      type: "block",
      body: [art("0")],
      last: null,
    });
  });

  test("last", () => {
    expect(art("{ 0 }")).toEqual({
      type: "block",
      body: [],
      last: art("0"),
    });
  });

  test("{ 0; 1; 2 }", () => {
    expect(art("{ 0; 1; 2 }")).toEqual({
      type: "block",
      body: [art("0"), art("1")],
      last: art("2"),
    });
  });
});

test("loop", () => {
  expect(art("loop {}")).toEqual({
    type: "loop",
    body: art("{}"),
  });
});

test("break", () => {
  expect(art("break")).toEqual({ type: "break" });
});

test("if", () => {
  expect(art("if %0 then %1 else %2")).toEqual({
    type: "if",
    cond: art("%0"),
    then: art("%1"),
    else: art("%2"),
  });
});

test("def", () => {
  expect(art("let %0 = 0")).toEqual({
    type: "def",
    id: 0,
    init: art("0"),
  });
});

test("assign", () => {
  expect(art("%0 = 0")).toEqual({
    type: "assign",
    id: 0,
    val: art("0"),
  });
});
