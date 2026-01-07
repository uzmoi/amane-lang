import { describe, expect, test } from "vitest";
import { run_length_encoding } from "./utils";

describe("run_length_encoding", () => {
  test("empty", () => {
    expect(run_length_encoding([])).toEqual([]);
  });

  test("Run Length Encoding", () => {
    expect(run_length_encoding([0, 0, 0, 1, 1, 0, 0, 2, 3, 3, 3, 3])).toEqual([
      [3, 0],
      [2, 1],
      [2, 0],
      [1, 2],
      [4, 3],
    ]);
  });
});
