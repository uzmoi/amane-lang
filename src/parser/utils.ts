const escapeCharMap = new Map([
  ["0", "\0"],
  ["n", "\n"],
  ["r", "\r"],
  ["t", "\t"],
  ["v", "\v"],
]);

export const unescapeStringContent = (string: string): string =>
  string.replace(/\\(.)/g, (_, mat: string) => escapeCharMap.get(mat) ?? mat);
