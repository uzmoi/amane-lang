export interface AirModule {
  items: readonly Air[];
}

/**
 * Amane Intermediate Representation
 */
export type Air = { type: "lit.num.int"; value: number };
