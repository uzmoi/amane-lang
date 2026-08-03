import type { SourceLocation } from "#parser";
import type { BlockId } from "../air";

export interface Block {
  id: BlockId;
  loc: SourceLocation;
  breaks: SourceLocation[];
}

export class BlockAnalyzer {
  #blocks: (Block | null)[] = [];

  push_fn() {
    this.#blocks.push(null);
  }
  #block_id = 0;
  push_block(loc: SourceLocation) {
    const id = this.#block_id++ as BlockId;
    this.#blocks.push({ id, loc, breaks: [] });
    return id;
  }
  pop() {
    this.#blocks.pop();
  }

  break(loc: SourceLocation): BlockId | undefined {
    const block = this.#blocks.at(-1);
    block?.breaks.push(loc);
    return block?.id;
  }
}
