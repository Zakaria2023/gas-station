import { CylinderState, MovementKind, movementKinds } from "@/db/enum";

/**
 * What one cylinder of each movement does — the single place the rules of the
 * daily sheet live. Everything else (the day's stock, a customer's debt, the
 * hints on the movement form) reads this table, so changing a rule here
 * changes it everywhere.
 *
 * From the sheet's notes:
 * - تبديل: an empty comes in, a full goes out; the total does not change.
 * - بيع مليان: the full and the total go down.
 * - بيع فاضي: the empty and the total go down.
 * - فاضي دخل زبون: the empty goes up.
 *
 * Not written in the sheet, so these are the reading the app goes with:
 * - دين مليان / دين فاضي: a full / empty leaves on credit; the customer now
 *   owes that cylinder.
 * - رجع دين مليان / رجع دين فاضي: the customer brings that cylinder back;
 *   the stock gets it back and the debt goes down.
 * - تعبئة: empties go to the filling plant and come back full.
 * - دين مصاري / رجع دين مصاري: not in the sheet either; the customer borrows
 *   money from the shop and pays it back. No cylinder moves.
 */

export type StockDelta = {
  full: number;
  empty: number;
};

export type MovementEffect = {
  /** Change to the shop's stock per cylinder. */
  stock: StockDelta;
  /** Change to the customer's debt per cylinder; null when no customer owes cylinders. */
  debt: { state: CylinderState; sign: 1 | -1 } | null;
  /** Change to the money the customer borrowed, per ل.س; null when no money is lent or paid back. */
  cash: 1 | -1 | null;
  /** Which group the movement form shows it under. */
  group: MovementGroup;
};

export const movementGroups = ["sales", "debts", "cash", "stock"] as const;

export type MovementGroup = (typeof movementGroups)[number];

export const MOVEMENT_EFFECTS: Record<MovementKind, MovementEffect> = {
  exchange: { stock: { full: -1, empty: 1 }, debt: null, cash: null, group: "sales" },
  sell_full: { stock: { full: -1, empty: 0 }, debt: null, cash: null, group: "sales" },
  sell_empty: { stock: { full: 0, empty: -1 }, debt: null, cash: null, group: "sales" },
  debt_full: { stock: { full: -1, empty: 0 }, debt: { state: "full", sign: 1 }, cash: null, group: "debts" },
  debt_empty: { stock: { full: 0, empty: -1 }, debt: { state: "empty", sign: 1 }, cash: null, group: "debts" },
  return_full: { stock: { full: 1, empty: 0 }, debt: { state: "full", sign: -1 }, cash: null, group: "debts" },
  return_empty: { stock: { full: 0, empty: 1 }, debt: { state: "empty", sign: -1 }, cash: null, group: "debts" },
  cash_debt: { stock: { full: 0, empty: 0 }, debt: null, cash: 1, group: "cash" },
  cash_return: { stock: { full: 0, empty: 0 }, debt: null, cash: -1, group: "cash" },
  customer_empty_in: { stock: { full: 0, empty: 1 }, debt: null, cash: null, group: "stock" },
  refill: { stock: { full: 1, empty: -1 }, debt: null, cash: null, group: "stock" },
};

/** Money lent or paid back: no cylinder type, and the amount is typed instead of a count and a price. */
export const isCash = (kind: MovementKind): boolean => MOVEMENT_EFFECTS[kind].cash !== null;

/** The debt kinds, of cylinders or of money, need a customer; the rest may name one or not. */
export const needsCustomer = (kind: MovementKind): boolean =>
  MOVEMENT_EFFECTS[kind].debt !== null || isCash(kind);

/** A return lowers a debt, so it can never be more than the customer owes. */
export const isReturn = (kind: MovementKind): boolean =>
  MOVEMENT_EFFECTS[kind].debt?.sign === -1 || MOVEMENT_EFFECTS[kind].cash === -1;

export const kindsInGroup = (group: MovementGroup): MovementKind[] =>
  movementKinds.filter((kind) => MOVEMENT_EFFECTS[kind].group === group);

/** The stock after applying `quantity` cylinders of a movement. */
export const applyToStock = (stock: StockDelta, kind: MovementKind, quantity: number): StockDelta => {
  const { full, empty } = MOVEMENT_EFFECTS[kind].stock;
  return { full: stock.full + full * quantity, empty: stock.empty + empty * quantity };
};
