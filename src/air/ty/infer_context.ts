import type { BlockId, Id } from "../air";
import { TypeMismatchError } from "./error";
import { equals_ty, type Ty } from "./ty";

export class InferenceContext {
  #refs = new Map<Id, Ty>();

  #breaks: Set<BlockId>;
  constructor(options?: { breaks: Set<BlockId> }) {
    this.#breaks = options?.breaks ?? new Set();
  }

  deref(ty: Ty): Ty {
    switch (ty.type) {
      case "fn": {
        return {
          type: "fn",
          params: ty.params.map((param) => this.deref(param)),
          ret: this.deref(ty.ret),
        };
      }
      case "ref": {
        const ref = this.#refs.get(ty.id);
        return ref ? this.deref(ref) : ty;
      }
      default: {
        return ty;
      }
    }
  }

  unify(a: Ty, b: Ty) {
    a = this.deref(a);
    b = this.deref(b);

    if (equals_ty(a, b)) return;

    if (a.type === "ref" && b.type === "ref") {
      this.#refs.set(a.id, b);
      this.#refs.set(b.id, a);
    } else if (a.type === "ref") {
      this.#refs.set(a.id, b);
    } else if (b.type === "ref") {
      this.#refs.set(b.id, a);
    } else {
      throw new TypeMismatchError(a, b);
    }
  }

  #ty_id = -1;
  new_ty_id(): Id {
    return this.#ty_id-- as Id;
  }

  exists_breaks_for(block_id: BlockId): boolean {
    return this.#breaks.has(block_id);
  }
}
