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
  test("zero", () => {
    expect(lex("0")).toEqual(tokens(["Number", "0"]));
  });
  test("integer", () => {
    expect(lex("42")).toEqual(tokens(["Number", "42"]));
  });
  test("float", () => {
    expect(lex("6.28")).toEqual(tokens(["Number", "6.28"]));
  });
  describe.each`
    name             | prefix  | max
    ${"Binary"}      | ${"0b"} | ${"1"}
    ${"Octal"}       | ${"0o"} | ${"7"}
    ${"Decimal"}     | ${""}   | ${"9"}
    ${"Hexadecimal"} | ${"0x"} | ${"f"}
  `("$name", ({ prefix, max }: { prefix: string; max: string }) => {
    test.skipIf(prefix === "")("prefix only", () => {
      expect(lex(prefix)).toEqual(tokens(["Number", prefix]));
    });
    test.skipIf(prefix === "")("uppercase prefix", () => {
      const source = `${prefix.toUpperCase()}0`;
      expect(lex(source)).toEqual(tokens(["Number", source]));
    });
    test("max", () => {
      const source = `${prefix}0${max}`;
      expect(lex(source)).toEqual(tokens(["Number", source]));
    });
    test("Separate with underscores", () => {
      const source = `${prefix}1_000`;
      expect(lex(source)).toEqual(tokens(["Number", source]));
    });
  });
  test("uppercase hexadecimal", () => {
    expect(lex("0xF")).toEqual(tokens(["Number", "0xF"]));
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
