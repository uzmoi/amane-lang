import {
  type Air,
  type BlockId,
  type Id,
  InferenceContext,
  infer_type,
  type Ty,
  ty,
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
  for (const [index, type] of vars.entries()) {
    ctx.unify(ty.ref(index as Id), type);
  }

  infer_type(mod, ctx);
  return air;
};
