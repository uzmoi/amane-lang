import type { Ty } from "./ty";

export class VoidVariableError extends Error {
  type = "VoidVariableError";
}

export class TypeMismatchError extends Error {
  type = "TypeMismatchError";

  constructor(a: Ty, b: Ty) {
    super(`unify err: ${a.type} is not assignable to ${b.type}`);
  }
}
