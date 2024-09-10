/** 0-9 */
export const isDigit = (char: string) => "\x2f" < char && char < "\x3a";

/** A-Z | a-z */
export const isAlphabet = (char: string) =>
  ("\x40" < char && char < "\x5b") || ("\x60" < char && char < "\x7b");

const wsRe = /\p{White_Space}/u;
export const isWhitespace = (char: string) =>
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

export const unescapeStringContent = (string: string): string =>
  string.replace(/\\(.)/g, (_, mat: string) => escapeCharMap.get(mat) ?? mat);
