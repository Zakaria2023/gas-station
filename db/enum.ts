// Every enum in the app lives here, as a const array; the schema files import
// the arrays and the union types are derived from them.

/** The two kinds of cylinder the shop sells — the sheet's "الصنف" column. */
export const cylinderTypes = ["household", "industrial"] as const satisfies readonly string[];

export type CylinderType = (typeof cylinderTypes)[number];

/** A cylinder is either full of gas or an empty shell. */
export const cylinderStates = ["full", "empty"] as const satisfies readonly string[];

export type CylinderState = (typeof cylinderStates)[number];

/**
 * Everything that moves cylinders in or out of the shop. The sales and debts
 * are columns of the daily sheet; `stock_in` (إضافة) is full cylinders
 * arriving, which the sheet covered by re-typing the morning counts by hand.
 * `cash_debt` and `cash_return` move money, not cylinders: a customer borrows
 * cash from the shop and pays it back.
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
  "stock_in",
  "cash_debt",
  "cash_return",
] as const satisfies readonly string[];

export type MovementKind = (typeof movementKinds)[number];

/** An admin also manages the users; staff do the daily work. */
export const userRoles = ["admin", "staff"] as const satisfies readonly string[];

export type UserRole = (typeof userRoles)[number];

/** The kinds that lend or pay back money: they have no cylinder type, and their amount is the price of one. */
export const cashKinds = ["cash_debt", "cash_return"] as const satisfies readonly MovementKind[];

export type CashKind = (typeof cashKinds)[number];
