import { todo } from "@uzmoi/ut/ils";
import type { Id } from "../air";
import type { Ty } from "./ty";

export class InferenceContext {
  ap(_ty: Ty): Ty {
    todo();
  }

  unify(_a: Ty, _b: Ty) {
    todo();
  }

  #ty_id = -1;
  new_ty_id(): Id {
    return this.#ty_id-- as Id;
  }
}
