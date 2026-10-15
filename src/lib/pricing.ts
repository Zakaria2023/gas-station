import { CylinderState, CylinderType, MovementKind, movementKinds } from "@/db/enum";
import { MOVEMENT_EFFECTS, StockDelta } from "./movement-rules";

/**
 * Money: the price list, what a movement is worth, and what the stock on hand
 * is worth. Pure, so it is tested without a database.
 *
 * - Only the sales have a price per type (the price list); adding stock costs nothing here.
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

/** Money comes in, is lent, or is paid back; the day's account groups by this. */
export type MoneyFlow = "income" | "credit" | "settlement";

/** Null for a movement that moves no money: adding stock. */
export const MONEY_FLOW: Record<MovementKind, MoneyFlow | null> = {
  exchange: "income",
  sell_full: "income",
  sell_empty: "income",
  debt_full: "credit",
  debt_empty: "credit",
  return_full: "settlement",
  return_empty: "settlement",
  stock_in: null,
  cash_debt: "credit",
  cash_return: "settlement",
};

/** Which price values the stock still in the shop, and the debts. */
export const STOCK_PRICE_KIND: Record<CylinderState, MovementKind> = {
  full: "sell_full",
  empty: "sell_empty",
};

/** The kinds the price list sets: the sales. Debts take the stock's prices, money is typed, adding is free. */
export type PricedKind = "exchange" | "sell_full" | "sell_empty";

export const pricedKinds = movementKinds.filter(
  (kind): kind is PricedKind => MOVEMENT_EFFECTS[kind].group === "sales",
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

export type DayAccount = Record<MoneyFlow, number>;

/** The day's money by flow, from the amount of each kind. */
export const dayAccount = (amounts: Record<MovementKind, number>): DayAccount => {
  const account: DayAccount = { income: 0, credit: 0, settlement: 0 };
  for (const kind of movementKinds) {
    const flow = MONEY_FLOW[kind];
    if (flow) {
      account[flow] = roundMoney(account[flow] + amounts[kind]);
    }
  }
  return account;
};

/** Money to the piastre: avoids 0.1 + 0.2 drifting in sums. */
export const roundMoney = (value: number): number => Math.round(value * 100) / 100;
