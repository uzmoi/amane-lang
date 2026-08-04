import {
  type Air,
  type BlockId,
  type Id,
  InferenceContext,
  infer_type,
  ref_ty,
  type Ty,
} from "#air";
import { parse_art } from "#art";
import { type W, walk_air } from "../../src/air/walk";

const collect_breaks = (air: Air, w?: W<Set<BlockId>>) => {
  w ??= { air: collect_breaks, context: new Set() };
  if (air.type === "break") w.context.add(air.id);
  walk_air(air, w);
  return w.context;
};

export const art_infer = (source: string, vars: Ty[] = []) => {
  const air = parse_art(source);
  const mod = { items: [air] };

  const ctx = new InferenceContext({
    breaks: collect_breaks(air),
  });
  for (const [index, ty] of vars.entries()) {
    ctx.unify(ref_ty(index as Id), ty);
  }

  infer_type(mod, ctx);
  return air;
};
