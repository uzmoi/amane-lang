import { describe, expect, test } from "vitest";
import type { Id } from "../air";
import { parse_art, parse_ty as ty } from "../art";
import { TypeMismatchError, VoidVariableError } from "./error";
import { infer_type } from "./infer";
import { InferenceContext } from "./infer_context";
import { ref_ty, type Ty } from "./ty";

const infer = (source: string, vars: Ty[] = []) => {
  const air = parse_art(source);
  const mod = { items: [air] };

  const ctx = new InferenceContext();
  for (const [index, ty] of vars.entries()) {
    ctx.unify(ref_ty(index as Id), ty);
  }

  infer_type(mod, ctx);
  return air;
};

const tyof = (source: string, vars?: Ty[]) => infer(source, vars).ty;

describe("constant", () => {
  test("bool", () => {
    expect(tyof("true")).toEqual(ty("i32"));
  });

  test("int", () => {
    expect(tyof("0")).toEqual(ty("i32"));
  });

  test("annotated int", () => {
    expect(infer("%0 = 0", [ty("i32")])).toHaveProperty("val.ty", ty("i32"));
  });

  test("float", () => {
    expect(tyof("0.0")).toEqual(ty("f32"));
  });

  test("annotated float", () => {
    expect(infer("%0 = 0.0", [ty("f32")])).toHaveProperty("val.ty", ty("f32"));
  });

  test.todo("string", () => {
    expect(tyof('""')).toEqual(ty("string"));
  });
});

describe("block", () => {
  test("空ブロックの型はvoid", () => {
    expect(tyof("{}")).toEqual(ty("void"));
  });

  test("last expressionが存在するならブロックはその型になる", () => {
    expect(tyof("{ 0 }")).toEqual(ty("i32"));
  });

  test("never型の文を含むならブロック全体もnever型になる", () => {
    expect(tyof("{ %0; 0 }", [ty("never")])).toEqual(ty("never"));
  });
});

describe("if", () => {
  test("condition requires bool type", () => {
    expect(() => infer("if 0.0 then {} else {}")).toThrow(
      new TypeMismatchError(ty("f32"), ty("i32")),
    );
  });

  test("conditionがnever型ならif式もnever型になる", () => {
    expect(tyof("if %0 then {} else {}", [ty("never")])).toEqual(ty("never"));
  });

  test("thenとelseの型をif式の型とする", () => {
    expect(tyof("if true then 1 else 2")).toEqual(ty("i32"));
  });

  test("thenとelseのどちらかがnever型なら、そうでない方の型をif式の型とする", () => {
    expect(tyof("if true then %0 else 0", [ty("never")])).toEqual(ty("i32"));
    expect(tyof("if true then 0 else %0", [ty("never")])).toEqual(ty("i32"));
  });

  test("then and else branches must have same type", () => {
    expect(() => infer("if true then 0 else {}")).toThrow(
      new TypeMismatchError(ty("i32"), ty("void")),
    );
  });
});

describe("loop", () => {
  test("break is never type", () => {
    expect(tyof("break")).toEqual(ty("never"));
  });

  test("loop with break", () => {
    expect(tyof("loop break")).toEqual(ty("void"));
  });

  test("loop with break and other types body", () => {
    expect(tyof("loop { break; return }")).toEqual(ty("void"));
    expect(tyof("loop if true then break else return")).toEqual(ty("void"));
    expect(tyof("loop if true then break else {}")).toEqual(ty("void"));
  });

  test("loop without break", () => {
    expect(tyof("loop {}")).toEqual(ty("never"));
  });

  test("loop with nested loop-break", () => {
    expect(tyof("loop loop break")).toEqual(ty("never"));
  });

  test("loop with break within fn", () => {
    expect(tyof("loop fn break")).toEqual(ty("never"));
  });

  test("through never type of non-break", () => {
    expect(tyof("loop return")).toEqual(ty("never"));
  });

  test("body requires void type", () => {
    expect(() => infer("loop 0")).toThrow(
      new TypeMismatchError(ty("i32"), ty("void")),
    );
  });
});

describe("variable", () => {
  test("let requires non void type", () => {
    expect(() => infer("let %0 = {}")).toThrow(VoidVariableError);
  });

  test("let-ref", () => {
    expect(tyof("{ let %0 = 0; %0 }")).toEqual(ty("i32"));
  });

  test("param-ref", () => {
    expect(infer("fn (%0: i32) %0")).toHaveProperty("body.ty", ty("i32"));
  });

  test("return-ref", () => {
    expect(infer("fn (%0): i32 %0")).toHaveProperty("params.0.ty", "i32");
  });

  test.todo("type mismatch", () => {
    expect(infer("fn (%0: i32, %1: i64) { %1 = 0; %0 = %1; }")).toHaveProperty(
      "body.ty",
      "i32",
    );
  });
});
