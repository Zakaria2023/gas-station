// Every enum in the app lives here, as a const array; the schema files import
// the arrays and the union types are derived from them.

/** The two kinds of cylinder the shop sells — the sheet's "الصنف" column. */
export const cylinderTypes = ["household", "industrial"] as const satisfies readonly string[];

export type CylinderType = (typeof cylinderTypes)[number];

/** A cylinder is either full of gas or an empty shell. */
export const cylinderStates = ["full", "empty"] as const satisfies readonly string[];

export type CylinderState = (typeof cylinderStates)[number];

/**
 * Everything that moves cylinders in or out of the shop. The first eight are
 * the columns of the daily sheet (E to L); `refill` is the trip to the filling
 * plant, which the sheet covered by re-typing the morning counts by hand.
 * What each one does to the stock and to a customer's debt is in
 * src/lib/movement-rules.ts — the one place those rules live.
 */
export const movementKinds = [
  "exchange",
  "sell_full",
  "sell_empty",
  "debt_full",
  "debt_empty",
  "return_full",
  "return_empty",
  "customer_empty_in",
  "refill",
] as const satisfies readonly string[];

export type MovementKind = (typeof movementKinds)[number];
