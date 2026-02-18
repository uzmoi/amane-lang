import type { Air, AirStatement } from "./air";

export interface W {
  air(air: Air, w: W): void;
  air_statement(air: AirStatement, w: W): void;
}

export const walk_air = (air: Air, w: W) => {
  switch (air.type) {
    case "ref": {
      break;
    }
    case "fn": {
      w.air(air.body, w);
      break;
    }
    case "return": {
      w.air(air.value, w);
      break;
    }
    case "apply": {
      break;
    }
    case "block": {
      for (const stmt of air.body) {
        w.air_statement(stmt, w);
      }
      if (air.last != null) {
        w.air(air.last, w);
      }
      break;
    }
    case "loop": {
      w.air(air.body, w);
      break;
    }
    case "break": {
      break;
    }
    case "if": {
      w.air(air.cond, w);
      w.air(air.then, w);
      w.air(air.else, w);
      break;
    }
    case "lit.num.int": {
      break;
    }
  }
};

export const walk_air_statement = (air: AirStatement, w: W) => {
  switch (air.type) {
    case "def": {
      w.air(air.init, w);
      break;
    }
    case "assign": {
      w.air(air.val, w);
      break;
    }
    default: {
      walk_air(air, w);
      break;
    }
  }
};
