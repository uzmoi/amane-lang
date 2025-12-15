export const leb128size = (n: number) => {
  let size = 0;
  do {
    n >>>= 7;
    size++;
  } while (n !== 0);
  return size;
};
