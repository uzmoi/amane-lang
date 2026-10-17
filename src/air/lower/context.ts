import type { AirImport } from "../air";
import { BlockAnalyzer } from "./block";
import { Scope } from "./scope";

export class LowerContext {
  scope = new Scope();
  block = new BlockAnalyzer();
  imports: AirImport[] = [];
}
