import { CylinderState, CylinderType, MovementKind } from "@/db/enum";
import { MOVEMENT_EFFECTS } from "./movement-rules";
import { roundMoney } from "./pricing";

/**
 * What a customer owes — the debt summary sheet's four columns (household
 * full, household empty, industrial full, industrial empty), their total in
 * cylinders, and the money: each debt at the price it was given at, less each
 * return at the price it came back at, plus the cash they borrowed and have
 * not paid back. Pure, so it is tested without a database.
 */

export type Balance = Record<CylinderType, Record<CylinderState, number>> & {
  total: number;
  /** Everything owed in money: the cylinders' worth and the cash. */
  money: number;
  /** Of `money`, the cash borrowed and not yet paid back. */
  cash: number;
};

export type BalanceRow = {
  kind: MovementKind;
  /** Null for money lent or paid back. */
  cylinderType: CylinderType | null;
  quantity: number;
  /** quantity × the price each movement was entered with. */
  amount: number;
};

export const emptyBalance = (): Balance => ({
  household: { full: 0, empty: 0 },
  industrial: { full: 0, empty: 0 },
  total: 0,
  money: 0,
  cash: 0,
});

export const foldBalance = (rows: BalanceRow[]): Balance => {
  const balance = emptyBalance();
  for (const row of rows) {
    const { debt, cash } = MOVEMENT_EFFECTS[row.kind];
    if (cash) {
      balance.cash = roundMoney(balance.cash + cash * row.amount);
      balance.money = roundMoney(balance.money + cash * row.amount);
      continue;
    }
    if (!debt || !row.cylinderType) {
      continue;
    }
    const change = debt.sign * row.quantity;
    balance[row.cylinderType][debt.state] += change;
    balance.total += change;
    balance.money = roundMoney(balance.money + debt.sign * row.amount);
  }
  return balance;
};

/** Add one balance into another, for the total across customers. */
export const addBalance = (into: Balance, from: Balance): Balance => {
  for (const type of ["household", "industrial"] as const) {
    into[type].full += from[type].full;
    into[type].empty += from[type].empty;
  }
  into.total += from.total;
  into.money = roundMoney(into.money + from.money);
  into.cash = roundMoney(into.cash + from.cash);
  return into;
};

/** What a return settles: cylinders of one type and state, or the money borrowed. */
export type OwedBucket = { cylinderType: CylinderType; state: CylinderState } | "cash";

/** How much of one bucket is owed: cylinders, or ل.س for cash. */
export const owedIn = (balance: Balance, bucket: OwedBucket): number =>
  bucket === "cash" ? balance.cash : balance[bucket.cylinderType][bucket.state];

/** The bucket a debt or return of this kind moves; null for kinds that owe nothing. */
export const bucketOf = (kind: MovementKind, cylinderType: CylinderType | null): OwedBucket | null => {
  const { debt, cash } = MOVEMENT_EFFECTS[kind];
  if (cash) {
    return "cash";
  }
  return debt && cylinderType ? { cylinderType, state: debt.state } : null;
};

/** True when the customer owes nothing, in cylinders or in money. */
export const isSettled = (balance: Balance): boolean => balance.total === 0 && balance.money === 0;

/** The non-zero buckets, for showing a customer's debt as a few chips. */
export const balanceEntries = (
  balance: Balance,
): { cylinderType: CylinderType; state: CylinderState; quantity: number }[] =>
  (["household", "industrial"] as const).flatMap((cylinderType) =>
    (["full", "empty"] as const)
      .map((state) => ({ cylinderType, state, quantity: balance[cylinderType][state] }))
      .filter((entry) => entry.quantity !== 0),
  );
