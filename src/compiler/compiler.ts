import {
  type Block,
  type BlockId,
  InferenceContext,
  infer_ty_module_items,
  infer_ty_module_root,
  LowerContext,
  lower,
} from "#air";
import { lex, parse_module } from "#parser";
import { emit_wasm } from "../emitter/wasm/emit";

export class Compiler {
  compile(source: string): Uint8Array<ArrayBuffer> {
    const tokens = lex(source);

    const module = parse_module(tokens);

    const lower_context = new LowerContext();
    const air_module = lower(module, lower_context);

    const breaks = new Set<BlockId>();
    {
      const exists_breaks_for_block = (block: Block) =>
        block.refs.some((ref) => ref.type === "break");

      const blocks = lower_context.block.blocks;
      for (const block of blocks.filter(exists_breaks_for_block)) {
        breaks.add(block.id);
      }
    }

    const infer_context = new InferenceContext({ breaks });

    infer_ty_module_root(air_module, infer_context);
    infer_ty_module_items(air_module, infer_context);

    const binary = emit_wasm(air_module);

    return binary;
  }
}
