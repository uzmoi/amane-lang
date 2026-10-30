import { todo, unreachable } from "@uzmoi/ut/ils";
import { zip } from "#common/utils";
import type { Air, AirModule } from "../air";
import { TypeMismatchError, VoidVariableError } from "./error";
import type { InferenceContext } from "./infer_context";
import {
  equals_ty,
  is_fn_ty,
  is_never_ty,
  is_ref_ty,
  is_void_ty,
  type Ty,
  ty,
} from "./ty";

const infer_ty = (air: Air, ctx: InferenceContext): Ty => {
  if (air.ty != null) return air.ty;

  // biome-ignore lint/suspicious/noConfusingLabels: 何でswitch文に対応していないんですか？
  outer: switch (air.type) {
    case "def": {
      const init_ty = infer_ty(air.init, ctx);
      if (is_never_ty(init_ty)) {
        air.ty = ty.never;
        break;
      }

      const ref_ty = is_ref_ty(air.ref_ty) ? init_ty : air.ref_ty;

      if (is_void_ty(ref_ty)) {
        throw new VoidVariableError();
      }

      ctx.unify(air.ref_ty, init_ty);
      air.ref_ty = ctx.deref(air.ref_ty);

      air.ty = ty.void;
      break;
    }
    case "assign": {
      const value_ty = infer_ty(air.value, ctx);
      if (is_never_ty(value_ty)) {
        air.ty = ty.never;
        break;
      }

      const ref_ty = ctx.deref(ty.ref(air.id));
      if (is_never_ty(ref_ty)) {
        air.ty = ty.never;
        break;
      }
      if (!equals_ty(ref_ty, value_ty)) {
        throw new TypeMismatchError(value_ty, ref_ty);
      }

      air.ty = ty.void;
      break;
    }
    case "ref": {
      air.ty = ctx.deref(ty.ref(air.id));
      break;
    }
    case "return": {
      const value_ty = air.value == null ? ty.void : infer_ty(air.value, ctx);
      if (is_never_ty(value_ty)) {
        air.ty = ty.never;
        break;
      }

      const fn_ret_ty = ctx.get_current_fn_ret_ty();
      ctx.unify(fn_ret_ty, value_ty);

      air.ty = ty.never;
      break;
    }
    case "call": {
      const callee_ty = infer_ty(air.callee, ctx);
      if (is_never_ty(callee_ty)) {
        air.ty = ty.never;
        break;
      }
      if (!is_fn_ty(callee_ty)) {
        throw new Error(`Cannot call ${callee_ty.type}`);
      }

      if (air.args.length !== callee_ty.params.length) {
        throw new Error(
          `Expected ${callee_ty.params.length} arguments, but got ${air.args.length}.`,
        );
      }

      for (const [param_ty, arg] of zip(callee_ty.params, air.args)) {
        const arg_ty = infer_ty(arg, ctx);
        if (is_never_ty(arg_ty)) {
          air.ty = ty.never;
          break outer;
        }

        ctx.unify(arg_ty, param_ty);
      }

      air.ty = callee_ty.ret;
      break;
    }
    case "block": {
      for (const body of air.body) {
        const body_ty = infer_ty(body, ctx);
        if (is_never_ty(body_ty)) {
          air.ty = ty.never;
          break outer;
        }
      }

      air.ty = air.last == null ? ty.void : infer_ty(air.last, ctx);
      break;
    }
    case "loop": {
      const body_ty = infer_ty(air.body, ctx);

      if (!is_never_ty(body_ty) && !is_void_ty(body_ty)) {
        throw new TypeMismatchError(body_ty, ty.void);
      }

      air.ty = ctx.exists_breaks_for(air.id) ? ty.void : ty.never;
      break;
    }
    case "continue":
    case "break": {
      air.ty = ty.never;
      break;
    }
    case "if": {
      const cond_ty = infer_ty(air.cond, ctx);
      if (is_never_ty(cond_ty)) {
        air.ty = ty.never;
        break;
      }
      if (!equals_ty(cond_ty, ty.bool)) {
        throw new TypeMismatchError(cond_ty, ty.bool);
      }

      const then_ty = infer_ty(air.then_body, ctx);
      const else_ty = infer_ty(air.else_body, ctx);

      if (is_never_ty(then_ty)) {
        air.ty = else_ty;
        break;
      }

      if (is_never_ty(else_ty)) {
        air.ty = then_ty;
        break;
      }

      if (!equals_ty(then_ty, else_ty)) {
        throw new TypeMismatchError(else_ty, then_ty);
      }

      air.ty = then_ty;
      break;
    }
    case "const.bool": {
      air.ty = ty.bool;
      break;
    }
    case "const.int": {
      // FIXME: i32に対応する。
      air.ty = ty.i64;
      break;
    }
    case "const.float": {
      // FIXME: f32に対応する。
      air.ty = ty.f64;
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

  return air.ty;
};

export const infer_ty_module_root = (
  module: AirModule,
  ctx: InferenceContext,
): void => {
  for (const air_import of module.imports) {
    for (const _import_entry of air_import.imports) {
      // ctx.unify(ty.ref(import_entry.id), import_entry.ty);
    }
  }

  for (const item of module.items) {
    switch (item.type) {
      case "def": {
        if (is_void_ty(item.ref_ty)) {
          throw new VoidVariableError();
        }

        ctx.unify(ty.ref(item.id), item.ref_ty);
        break;
      }
      case "fn": {
        const fn_ty = ty.fn(
          item.params.map((param) => param.ty),
          item.ret_ty,
        );
        ctx.unify(ty.ref(item.id), fn_ty);
        break;
      }
      default: {
        unreachable<typeof item>();
      }
    }
  }
};

export const infer_ty_module_items = (
  module: AirModule,
  ctx: InferenceContext,
): void => {
  for (const item of module.items) {
    switch (item.type) {
      case "def": {
        const init_ty = infer_ty(item.init, ctx);
        if (is_never_ty(init_ty)) break;

        ctx.unify(item.ref_ty, init_ty);
        break;
      }
      case "fn": {
        for (const param of item.params) {
          ctx.unify(ty.ref(param.id), param.ty);
        }

        ctx.set_current_fn_ret_ty(item.ret_ty);
        const body_ty = infer_ty(item.body, ctx);
        ctx.set_current_fn_ret_ty(null);
        if (is_never_ty(body_ty)) break;
        if (!equals_ty(item.ret_ty, body_ty)) {
          throw new TypeMismatchError(body_ty, item.ret_ty);
        }
        break;
      }
      default: {
        unreachable<typeof item>();
      }
    }
  }
};
