import type { SourceLocation } from "#parser";
import type { BlockId } from "../air";

export interface Block {
  id: BlockId;
  label: string | null;
  loc: SourceLocation;
  refs: BlockRef[];
}

export interface BlockRef {
  type: "break" | "continue";
  loc: SourceLocation;
}

export class BlockAnalyzer {
  readonly blocks: Block[] = [];
  readonly #block_stack: Block[] = [];

  #block_id = 0;
  push_block(loc: SourceLocation, label: string | undefined): BlockId {
    const id = this.#block_id++ as BlockId;
    const block: Block = { id, label: label ?? null, loc, refs: [] };
    this.blocks.push(block);
    this.#block_stack.push(block);
    return id;
  }
  pop() {
    this.#block_stack.pop();
  }

  ref(
    type: "break" | "continue",
    loc: SourceLocation,
    label: string | undefined,
  ): BlockId {
    const block =
      label == null
        ? this.#block_stack.at(-1)
        : this.#block_stack.findLast((block) => block.label === label);

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
