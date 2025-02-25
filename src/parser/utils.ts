/** 0-9 */
// biome-ignore format: ()で囲わないとlintのyodaの警告が出る
export const isDigit = (char: string) => ("\x2f" < char && char < "\x3a");

/** A-Z | a-z */
export const isAlphabet = (char: string) =>
  ("\x40" < char && char < "\x5b") || ("\x60" < char && char < "\x7b");

// https://www.unicode.org/reports/tr31/#Default_Identifier_Syntax
// REVIEW: フラグvにする？stringに添え字でアクセスして文字取ってきてるから意味ない？
const idStartRe = /\p{ID_Start}/u;
const idContinueRe = /\p{ID_Continue}/u;

/** `ID_Start` + `\` */
export const isIdentStart = (char: string) =>
  // NOTE: 全ての文字ごとに正規表現で判定するのは重いので、ascii文字はそのまま判定する。
  // https://util.unicode.org/UnicodeJsps/list-unicodeset.jsp?a=[[:ASCII:]%26[:ID_Start:]]
  isAlphabet(char) || char === "\\" || (char > "\x7f" && idStartRe.test(char));

/** `ID_Continue` + `\` */
export const isIdentContinue = (char: string) =>
  // 上のNOTE:と同じく。
  // https://util.unicode.org/UnicodeJsps/list-unicodeset.jsp?a=[[:ASCII:]%26[:ID_Continue:]]
  isDigit(char) ||
  isAlphabet(char) ||
  char === "\\" ||
  char === "_" ||
  (char > "\x7f" && idContinueRe.test(char));

// REVIEW: Pattern_White_Spaceにする？
// REVIEW: フラグvにする？
const wsRe = /\p{White_Space}/u;
export const isWhitespace = (char: string) =>
  // 上のNOTE:と同じく。
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
  string.replace(/\\(.)/g, (_, mat: string) => escapeCharMap.get(mat) ?? mat);
