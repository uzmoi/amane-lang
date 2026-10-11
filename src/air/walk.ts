import { unreachable } from "@uzmoi/ut/ils";
import type { Air, AirModule, AirModuleItem } from "./air";

export class Walker<T> {
  constructor(
    readonly air: (air: Air, context: T) => void,
    readonly module_item?: (air_module_item: AirModuleItem, context: T) => void,
  ) {}

  walk_module(module: AirModule, context: T) {
    for (const item of module.items) {
      this.module_item?.(item, context);

      switch (item.type) {
        case "def": {
          this.walk_air(item.init, context);
          break;
        }
        case "fn": {
          this.walk_air(item.body, context);
          break;
        }
        default: {
          unreachable<typeof item>();
        }
      }
    }
  }

  walk_air(air: Air, context: T) {
    switch (air.type) {
      case "def": {
        this.walk_air(air.init, context);
        break;
      }
      case "assign": {
        this.walk_air(air.value, context);
        break;
      }
      case "ref": {
        break;
      }
      case "return": {
        if (air.value != null) {
          this.walk_air(air.value, context);
        }
        break;
      }
      case "call": {
        this.walk_air(air.callee, context);
        for (const arg of air.args) {
          this.walk_air(arg, context);
        }
        break;
      }
      case "block": {
        for (const stmt of air.body) {
          this.walk_air(stmt, context);
        }
        if (air.last != null) {
          this.walk_air(air.last, context);
        }
        break;
      }
      case "loop": {
        this.walk_air(air.body, context);
        break;
      }
      case "continue": {
        break;
      }
      case "break": {
        break;
      }
      case "if": {
        this.walk_air(air.cond, context);
        this.walk_air(air.then_body, context);
        this.walk_air(air.else_body, context);
        break;
      }
      case "const.bool": {
        break;
      }
      case "const.int": {
        break;
      }
      case "const.float": {
        break;
      }
      case "const.string": {
        break;
      }
      default: {
        unreachable<typeof air>();
      }
    }

    this.air(air, context);
  }
}
