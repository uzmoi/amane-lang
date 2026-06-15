/** 0 | 1 */
export const is_bin_digit = (char: string) => char === "0" || char === "1";

/** 0-9 */
export const is_digit = (char: string) => "\x2f" < char && char < "\x3a";

/** 0-9 | A-F | a-f */
export const is_hex_digit = (char: string) =>
  ("\x40" < char && char < "\x47") || // A-F
  ("\x60" < char && char < "\x67") || // a-f
  is_digit(char);

/** A-Z | a-z */
export const is_alphabet = (char: string) =>
  ("\x40" < char && char < "\x5b") || ("\x60" < char && char < "\x7b");

// https://www.unicode.org/reports/tr31/#Default_Identifier_Syntax
const id_start_re = /\p{ID_Start}/vy;
const id_continue_re = /\p{ID_Continue}/vy;

// 全ての文字ごとに正規表現で判定するのは重いので、ascii文字はそのまま判定する。

/** `ID_Start` + `\` */
export const is_ident_start = (source: string, index: number) => {
  const char = source[index]!;

  // is ascii
  if (char < "\x80") {
    // https://util.unicode.org/UnicodeJsps/list-unicodeset.jsp?a=[[:ASCII:]%26[:ID_Start:]]
    return is_alphabet(char) || char === "\\";
  }

  id_start_re.lastIndex = index;
  return id_start_re.test(source);
};

/** `ID_Continue` + `\` */
export const is_ident_continue = (source: string, index: number) => {
  const char = source[index]!;

  // is ascii
  if (char < "\x80") {
    // https://util.unicode.org/UnicodeJsps/list-unicodeset.jsp?a=[[:ASCII:]%26[:ID_Continue:]]
    return is_digit(char) || is_alphabet(char) || char === "\\" || char === "_";
  }

  id_continue_re.lastIndex = index;
  return id_continue_re.test(source);
};

// REVIEW: Pattern_White_Spaceにする？
// REVIEW: フラグvにする？
const ws_re = /\p{White_Space}/u;
export const is_whitespace = (char: string) =>
  // https://util.unicode.org/UnicodeJsps/list-unicodeset.jsp?a=[[:ASCII:]%26[:White_Space:]]
  ("\x08" < char && char < "\x0e") || // "\t" | "\n" | "\v" | "\f" | "\r"
  char === " " ||
  (char > "\x7f" && ws_re.test(char));

const escape_char_map = new Map([
  ["0", "\0"],
  ["n", "\n"],
  ["r", "\r"],
  ["t", "\t"],
  ["v", "\v"],
]);

// REVIEW: uかvフラグ付ける？
export const unescape_string_content = (string: string): string =>
  string.replace(
    /\\(.)/g,
    (_, mat) => escape_char_map.get(mat as string) ?? (mat as string),
  );

export const unescape_ident = (value: string): string => {
  const is_string_ident = value.startsWith('\\"') && value.endsWith('"');
  return is_string_ident
    ? unescape_string_content(value.slice(2, -1))
    : value.replace(/\\(.?)/g, "$1");
};

export const normalize_number = (value: string): string => {
  return value.replace(/_/g, "").replace(/^(0[box])?0+\B/, "$1");
};
