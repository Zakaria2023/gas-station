import { CylinderState, CylinderType, MovementKind, movementKinds } from "@/db/enum";
import { MOVEMENT_EFFECTS, StockDelta } from "./movement-rules";

/**
 * Money: the price list, what a movement is worth, and what the stock on hand
 * is worth. Pure, so it is tested without a database.
 *
 * - Every movement kind but the debts has its own price per type (the price list).
 * - A movement keeps the price it was entered with; changing the list later
 *   never rewrites a past sale.
 * - The stock on hand is worth today's prices: full cylinders at the بيع مليان
 *   price (the cylinder and its gas), empty ones at the بيع فاضي price.
 *   Raising a price raises the value of the cylinders still in the shop.
 * - A debt or its return has no price of its own: it is worth the cylinder it
 *   moves, full or empty, at the price that values the stock.
 */

export type PriceList = Record<CylinderType, Partial<Record<MovementKind, number | null>>>;

export const emptyPriceList = (): PriceList => ({ household: {}, industrial: {} });

/** Money comes in, goes out, or is lent; the day's account groups by this. */
export type MoneyFlow = "income" | "expense" | "credit" | "settlement";

export const MONEY_FLOW: Record<MovementKind, MoneyFlow> = {
  exchange: "income",
  sell_full: "income",
  sell_empty: "income",
  debt_full: "credit",
  debt_empty: "credit",
  return_full: "settlement",
  return_empty: "settlement",
  customer_empty_in: "expense",
  refill: "expense",
  cash_debt: "credit",
  cash_return: "settlement",
};

/** Which price values the stock still in the shop, and the debts. */
export const STOCK_PRICE_KIND: Record<CylinderState, MovementKind> = {
  full: "sell_full",
  empty: "sell_empty",
};

/** The kinds the price list sets; the debts take the stock's prices, and money is typed. */
export type PricedKind = Exclude<
  MovementKind,
  "debt_full" | "debt_empty" | "return_full" | "return_empty" | "cash_debt" | "cash_return"
>;

export const pricedKinds = movementKinds.filter(
  (kind): kind is PricedKind => !MOVEMENT_EFFECTS[kind].debt && !MOVEMENT_EFFECTS[kind].cash,
);

/** The list's price for one cylinder of a movement, or null when it has none. */
export const priceFor = (list: PriceList, cylinderType: CylinderType, kind: MovementKind): number | null => {
  const debt = MOVEMENT_EFFECTS[kind].debt;
  return list[cylinderType][debt ? STOCK_PRICE_KIND[debt.state] : kind] ?? null;
};

/** A movement's worth: quantity × the price it was entered with. */
export const amountOf = (quantity: number, unitPrice: number | null): number =>
  unitPrice === null ? 0 : roundMoney(quantity * unitPrice);

/** What the cylinders on hand are worth at the list's prices; null parts have no price yet. */
export const stockValue = (
  stock: StockDelta,
  list: PriceList,
  cylinderType: CylinderType,
): { full: number | null; empty: number | null; total: number } => {
  const fullPrice = priceFor(list, cylinderType, STOCK_PRICE_KIND.full);
  const emptyPrice = priceFor(list, cylinderType, STOCK_PRICE_KIND.empty);
  const full = fullPrice === null ? null : roundMoney(Math.max(stock.full, 0) * fullPrice);
  const empty = emptyPrice === null ? null : roundMoney(Math.max(stock.empty, 0) * emptyPrice);
  return { full, empty, total: (full ?? 0) + (empty ?? 0) };
};

export type DayAccount = Record<MoneyFlow, number> & { net: number };

/** The day's money by flow, from the amount of each kind; net is cash in minus cash out. */
export const dayAccount = (amounts: Record<MovementKind, number>): DayAccount => {
  const account: DayAccount = { income: 0, expense: 0, credit: 0, settlement: 0, net: 0 };
  for (const kind of movementKinds) {
    account[MONEY_FLOW[kind]] = roundMoney(account[MONEY_FLOW[kind]] + amounts[kind]);
  }
  account.net = roundMoney(account.income - account.expense);
  return account;
};

/** Money to the piastre: avoids 0.1 + 0.2 drifting in sums. */
export const roundMoney = (value: number): number => Math.round(value * 100) / 100;
