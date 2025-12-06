/** 0 | 1 */
export const isBinDigit = (char: string) => char === "0" || char === "1";

/** 0-9 */
export const isDigit = (char: string) => "\x2f" < char && char < "\x3a";

/** 0-9 | A-F | a-f */
export const isHexDigit = (char: string) =>
  ("\x40" < char && char < "\x47") || // A-F
  ("\x60" < char && char < "\x67") || // a-f
  isDigit(char);

/** A-Z | a-z */
export const isAlphabet = (char: string) =>
  ("\x40" < char && char < "\x5b") || ("\x60" < char && char < "\x7b");

// https://www.unicode.org/reports/tr31/#Default_Identifier_Syntax
const idStartRe = /\p{ID_Start}/vy;
const idContinueRe = /\p{ID_Continue}/vy;

// 全ての文字ごとに正規表現で判定するのは重いので、ascii文字はそのまま判定する。

/** `ID_Start` + `\` */
export const isIdentStart = (source: string, index: number) => {
  const char = source[index]!;

  // is ascii
  if (char < "\x80") {
    // https://util.unicode.org/UnicodeJsps/list-unicodeset.jsp?a=[[:ASCII:]%26[:ID_Start:]]
    return isAlphabet(char) || char === "\\";
  }

  idStartRe.lastIndex = index;
  return idStartRe.test(source);
};

/** `ID_Continue` + `\` */
export const isIdentContinue = (source: string, index: number) => {
  const char = source[index]!;

  // is ascii
  if (char < "\x80") {
    // https://util.unicode.org/UnicodeJsps/list-unicodeset.jsp?a=[[:ASCII:]%26[:ID_Continue:]]
    return isDigit(char) || isAlphabet(char) || char === "\\" || char === "_";
  }

  idContinueRe.lastIndex = index;
  return idContinueRe.test(source);
};

// REVIEW: Pattern_White_Spaceにする？
// REVIEW: フラグvにする？
const wsRe = /\p{White_Space}/u;
export const isWhitespace = (char: string) =>
  // https://util.unicode.org/UnicodeJsps/list-unicodeset.jsp?a=[[:ASCII:]%26[:White_Space:]]
  ("\x08" < char && char < "\x0e") || // "\t" | "\n" | "\v" | "\f" | "\r"
  char === " " ||
  (char > "\x7f" && wsRe.test(char));

const escapeCharMap = new Map([
  ["0", "\0"],
  ["n", "\n"],
  ["r", "\r"],
  ["t", "\t"],
  ["v", "\v"],
]);

// REVIEW: uかvフラグ付ける？
export const unescapeStringContent = (string: string): string =>
  string.replace(
    /\\(.)/g,
    (_, mat) => escapeCharMap.get(mat as string) ?? (mat as string),
  );
