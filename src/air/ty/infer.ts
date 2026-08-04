import { todo, unreachable } from "@uzmoi/ut/ils";
import type { Air, AirModule } from "../air";
import { type W, walk_air } from "../walk";
import { InferenceContext } from "./infer_context";
import { ty } from "./ty";

// TODO: neverを含む式/文をneverにする。
export const infer_air_type = (air: Air, ctx: InferenceContext) => {
  switch (air.type) {
    case "def": {
      ctx.unify(ty.ref(air.id), air.init.ty!);
      break;
    }
    case "assign": {
      ctx.unify(ty.ref(air.id), air.val.ty!);
      break;
    }
    case "ref": {
      air.ty = ty.ref(air.id);
      break;
    }
    case "fn": {
      const params = air.params.map((param) => {
        ctx.unify(ty.ref(param.id), param.ty);
        return param.ty;
      });
      air.ty = ty.fn(params, air.body.ty!);
      break;
    }
    case "return": {
      // const fn_ty = ctx.get_fn_ty(air.id);
      // ctx.unify(fn_ty.ret, air.value.ty);
      air.ty = ty.never;
      throw todo();
      // break;
    }
    case "call": {
      const ret_ty = ty.ref(ctx.new_ty_id());
      air.ty = ret_ty;
      const fn_ty = ty.fn(
        air.args.map((arg) => arg.ty!),
        ret_ty,
      );
      ctx.unify(air.callee.ty!, fn_ty);
      break;
    }
    case "block": {
      air.ty = air.last?.ty ?? ty.void;
      break;
    }
    case "loop": {
      ctx.unify(air.body.ty!, ty.void);
      air.ty = ctx.exists_breaks_for(air.id) ? ty.void : ty.never;
      break;
    }
    case "break": {
      air.ty = ty.never;
      break;
    }
    case "if": {
      ctx.unify(air.cond.ty!, ty.bool);
      ctx.unify(air.then.ty!, air.else.ty!);
      air.ty = air.then.ty;
      // air.ty = union(air.then.ty!, air.else.ty!);
      // ctx.unify(air.ty!, air.else.ty!);
      break;
    }
    case "const.bool": {
      air.ty = ty.bool;
      break;
    }
    case "const.int": {
      // FIXME: i64...
      air.ty = ty.i32;
      break;
    }
    case "const.float": {
      // FIXME: f64...
      air.ty = ty.f32;
      break;
    }
    case "const.string": {
      // air.ty = ty.string;
      return todo();
    }
    default: {
      unreachable<typeof air>();
    }
  }
};

export const infer_type = (
  module: AirModule,
  ctx = new InferenceContext(),
): AirModule => {
  const infer: W<InferenceContext> = {
    air(air, w) {
      walk_air(air, w);
      infer_air_type(air, w.context);
    },
    context: ctx,
  };

  for (const item of module.items) {
    infer.air(item, infer);
  }

  const ap: W<InferenceContext> = {
    air(air, w) {
      walk_air(air, w);
      if ("ty" in air) {
        air.ty = w.context.deref(air.ty!);
      }
    },
    context: ctx,
  };

  for (const item of module.items) {
    ap.air(item, ap);
  }

  return module;
};
