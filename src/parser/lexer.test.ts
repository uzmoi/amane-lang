import { describe, expect, test } from "vitest";
import { Lexer, Token, type TokenType } from "./lexer";

const lex = (source: string): Token[] => [...new Lexer(source)];

const tokens = (...tokens: [type: TokenType, value: string][]): Token[] => {
  let i = 0;
  return tokens.map(
    ([type, value]) => new Token(type, value, i, (i += value.length)),
  );
};

test("empty", () => {
  expect(lex("")).toEqual([]);
});

test("Whitespace", () => {
  const wsChars = " \t\r\n\v\f";
  expect(lex(wsChars)).toEqual(tokens(["Whitespace", wsChars]));
});

test("Delimiter", () => {
  expect(lex("()")).toEqual(tokens(["Delimiter", "("], ["Delimiter", ")"]));
});

test("Operator", () => {
  expect(lex("==")).toEqual(tokens(["Operator", "=="]));
});

describe("Ident / Keyword", () => {
  test.each(
    /* biome-ignore format: table */ [
      ["lowercase alphabet",     "az"],
      ["uppercase alphabet",     "AZ"],
      ["non-leading digits",     "a1"],
      ["non-leading underscore", "a_"],
      ["escape",                 "a\\!"],
      ["leading escape",         "\\!"],
      ["trailing escape",        "a\\"],
      ["escape only",            "\\"],
      ["escaped keyword",        "\\if"],
      ["string ident",           '\\"+"'],
    ],
  )("%s", (_, source) => {
    expect(lex(source)).toEqual(tokens(["Ident", source]));
  });
  test("keyword", () => {
    expect(lex("if")).toEqual(tokens(["Keyword", "if"]));
  });
});

describe("Number", () => {
  describe.each`
    name             | cases
    ${"Decimal"}     | ${["0", "0123456789", "1_000", "0__", "6.28", "1."]}
    ${"Binary"}      | ${["0b", "0b0", "0B0", "0b01", "0b1_000", "0b__"]}
    ${"Hexadecimal"} | ${["0x", "0x0", "0X0", "0x0123456789abcdefABCDEF", "0x1_000", "0x__"]}
  `("$name", ({ cases }: { cases: string[] }) => {
    test.each(cases)("%s", (source) => {
      expect(lex(source)).toEqual(tokens(["Number", source]));
    });
  });
});

describe("String", () => {
  test("empty", () => {
    const source = '""';
    expect(lex(source)).toEqual(tokens(["String", source]));
  });
  test("string", () => {
    const source = '"Hello world!"';
    expect(lex(source)).toEqual(tokens(["String", source]));
  });
  test("escape", () => {
    const source = '"\\""';
    expect(lex(source)).toEqual(tokens(["String", source]));
  });
  test("not closed", () => {
    const source = '"';
    expect(lex(source)).toEqual(tokens(["String", source]));
  });
  test("not closed + trailing escape", () => {
    const source = '"\\';
    expect(lex(source)).toEqual(tokens(["String", source]));
  });
});

describe("Comment", () => {
  describe("single line", () => {
    test("with newline", () => {
      expect(lex("// comment\n")).toEqual(
        tokens(["Comment", "// comment"], ["Whitespace", "\n"]),
      );
    });
    test("without newline", () => {
      expect(lex("// comment")).toEqual(tokens(["Comment", "// comment"]));
    });
    test("empty", () => {
      expect(lex("//")).toEqual(tokens(["Comment", "//"]));
    });
  });

  describe("multi line", () => {
    test("multiline comment", () => {
      const comment = "/*\n  comment\n*/";
      expect(lex(`${comment} `)).toEqual(
        tokens(["Comment", comment], ["Whitespace", " "]),
      );
    });
    test("not closed", () => {
      expect(lex("/* ")).toEqual(tokens(["Comment", "/* "]));
    });
    test("nested", () => {
      const comment = "/* /* comment */ */";
      expect(lex(`${comment} `)).toEqual(
        tokens(["Comment", comment], ["Whitespace", " "]),
      );
    });
    test("continuous", () => {
      expect(lex("/**//**/")).toEqual(
        tokens(["Comment", "/**/"], ["Comment", "/**/"]),
      );
    });
    test("starts with '/*/'", () => {
      expect(lex("/*/ ")).toEqual(tokens(["Comment", "/*/ "]));
    });
  });
});
