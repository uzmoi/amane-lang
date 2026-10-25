import {
  type Air,
  type AirModule,
  type BlockId,
  type Id,
  InferenceContext,
  infer_ty_module_items,
  infer_ty_module_root,
  type Ty,
  ty,
  Walker,
} from "#air";
import { parse_art } from "#art";

const collect_breaks = new Walker((air: Air, breaks: Set<BlockId>) => {
  if (air.type === "break") breaks.add(air.id);
});

export const art_infer = (source: string, vars: Ty[] = []) => {
  const air = parse_art(source);
  const mod: AirModule = {
    imports: [],
    items: [
      {
        type: "fn",
        id: -1 as Id,
        params: [],
        ret_ty: ty.void,
        body: {
          type: "block",
          body: [air],
          last: null,
        },
      },
    ],
  };

  const breaks = new Set<BlockId>();
  collect_breaks.walk_module(mod, breaks);

  const ctx = new InferenceContext({ breaks });
  for (const [index, type] of vars.entries()) {
    ctx.unify(ty.ref(index as Id), type);
  }

  infer_ty_module_root(mod, ctx);
  infer_ty_module_items(mod, ctx);
  return air;
};
