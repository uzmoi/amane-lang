import { describe, expect, test } from "vitest";
import { Lexer, type Token, type TokenType } from "./lexer";

const MAX_LENGTH = 10000;

const lex = (source: string): Token[] => {
  const tokens = [];
  for (const token of new Lexer(source)) {
    if (tokens.push(token) > MAX_LENGTH) break;
  }
  return tokens;
};

const tokens = (...tokens: [type: TokenType, value: string][]): Token[] => {
  let i = 0;
  return tokens.map((token): Token => {
    const [type, value] = token;
    const loc = { start: i, end: (i += value.length) } as const;
    return { type, value, loc };
  });
};

test("empty", () => {
  expect(lex("")).toEqual([]);
});

test("Whitespace", () => {
  const wsChars = " \t\r\n\v\f";
  expect(lex(wsChars)).toEqual(tokens(["Whitespace", wsChars]));
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
    ],
  )("%s", (_, source) => {
    expect(lex(source)).toEqual(tokens(["Ident", source]));
  });
  test("keyword", () => {
    expect(lex("if")).toEqual(tokens(["Keyword", "if"]));
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
