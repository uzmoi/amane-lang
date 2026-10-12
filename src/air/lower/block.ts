import type { SourceLocation } from "#parser";
import type { BlockId } from "../air";

export interface Block {
  id: BlockId;
  label: string | null;
  loc: SourceLocation;
  refs: { type: "break" | "continue"; loc: SourceLocation }[];
}

export class BlockAnalyzer {
  #blocks: (Block | null)[] = [];

  push_fn() {
    this.#blocks.push(null);
  }
  #block_id = 0;
  push_block(loc: SourceLocation, label: string | undefined) {
    const id = this.#block_id++ as BlockId;
    this.#blocks.push({ id, label: label ?? null, loc, refs: [] });
    return id;
  }
  pop() {
    this.#blocks.pop();
  }

  ref(
    type: "break" | "continue",
    loc: SourceLocation,
    label: string | undefined,
  ): BlockId {
    const block =
      label == null
        ? this.#blocks.at(-1)
        : // null (fn) に到達したら null を返す。
          this.#blocks.findLast(
            (block) => block == null || block.label === label,
          );

    if (block == null) {
      throw new Error(
        label == null
          ? `${type} can only be used within a block.`
          : `Block labeled '${label}' was not found.`,
      );
    }

    block.refs.push({ type, loc });
    return block.id;
  }
}
