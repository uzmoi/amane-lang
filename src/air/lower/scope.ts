import type { Id } from "../air";

export interface ScopeEntry {
  id: Id;
  name: string;
}

export class Scope {
  readonly vars: ScopeEntry[] = [];
  readonly #scopes: Map<string, ScopeEntry>[] = [];
  constructor(readonly root_scope: Map<string, ScopeEntry> = new Map()) {}

  push() {
    this.#scopes.push(new Map());
  }
  pop() {
    this.#scopes.pop();
  }

  def(name: string): ScopeEntry {
    const current_scope = this.#scopes.at(-1) ?? this.root_scope;

    const entry: ScopeEntry = {
      id: this.vars.length as Id,
      name,
    };
    this.vars.push(entry);
    current_scope.set(name, entry);
    return entry;
  }

  ref(name: string): ScopeEntry | undefined {
    for (const scope of [this.root_scope, ...this.#scopes].reverse()) {
      const entry = scope.get(name);
      if (entry != null) {
        return entry;
      }
    }
  }
}
