import { type Id, InferenceContext, infer_type, ref_ty, type Ty } from "#air";
import { parse_art } from "#art";

export const art_infer = (source: string, vars: Ty[] = []) => {
  const air = parse_art(source);
  const mod = { items: [air] };

  const ctx = new InferenceContext();
  for (const [index, ty] of vars.entries()) {
    ctx.unify(ref_ty(index as Id), ty);
  }

  infer_type(mod, ctx);
  return air;
};
