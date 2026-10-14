import { CylinderType, cylinderTypes, MovementKind, movementKinds } from "@/db/enum";
import { addDays } from "@/utils/dates";
import { applyToStock, StockDelta } from "./movement-rules";
import { roundMoney } from "./pricing";

/**
 * The daily sheet, rebuilt from the movements: for every day, what the shop
 * opened with, how many of each movement happened, and what it closed with.
 * Pure, so it is tested without a database.
 *
 * A day opens with the previous day's closing — unless somebody counted the
 * stock that morning, in which case the count is the opening.
 */

export type KindTotals = Record<MovementKind, number>;

export type CountRow = {
  countedOn: string;
  full: number;
  empty: number;
};

/** One day's movements of one kind, added up. */
export type MovementTotalRow = {
  businessDate: string;
  kind: MovementKind;
  quantity: number;
  /** Their money: the sum of quantity × the price each was entered with. */
  amount: number;
  /** How many movements went into the sums. */
  count: number;
};

export type LedgerDay = {
  date: string;
  opening: StockDelta;
  closing: StockDelta;
  /** What the opening would have been without a count that day. */
  expectedOpening: StockDelta;
  counted: boolean;
  /** Cylinders per kind, like the sheet's columns. */
  totals: KindTotals;
  /** Money per kind. */
  amounts: KindTotals;
  movementCount: number;
};

export const emptyTotals = (): KindTotals =>
  Object.fromEntries(movementKinds.map((kind) => [kind, 0])) as KindTotals;

export const stockTotal = (stock: StockDelta): number => stock.full + stock.empty;

/**
 * Every day from `start` to `end` (inclusive, "YYYY-MM-DD"), given the counts
 * and movements inside that window and the stock just before it (`initial`,
 * zero when nothing came before). Only the window is walked, so a month ten
 * years in is as quick as this one.
 */
export const buildLedger = (
  start: string,
  end: string,
  counts: CountRow[],
  movements: MovementTotalRow[],
  initial: StockDelta = { full: 0, empty: 0 },
): LedgerDay[] => {
  const countByDay = new Map(counts.map((count) => [count.countedOn, count]));
  const movementsByDay = new Map<string, MovementTotalRow[]>();
  for (const row of movements) {
    const list = movementsByDay.get(row.businessDate) ?? [];
    list.push(row);
    movementsByDay.set(row.businessDate, list);
  }

  const days: LedgerDay[] = [];
  let stock: StockDelta = initial;

  for (let date = start; date <= end; date = addDays(date, 1)) {
    const expectedOpening = stock;
    const count = countByDay.get(date);
    const opening = count ? { full: count.full, empty: count.empty } : stock;

    const totals = emptyTotals();
    const amounts = emptyTotals();
    let closing = opening;
    let movementCount = 0;
    for (const row of movementsByDay.get(date) ?? []) {
      totals[row.kind] += row.quantity;
      amounts[row.kind] = roundMoney(amounts[row.kind] + row.amount);
      closing = applyToStock(closing, row.kind, row.quantity);
      movementCount += row.count;
    }

    days.push({
      date,
      opening,
      closing,
      expectedOpening,
      counted: Boolean(count),
      totals,
      amounts,
      movementCount,
    });
    stock = closing;
  }
  return days;
};

/**
 * The stock at the start of a day from what came before it: the last count
 * before the day plus every movement since — the same walk as the ledger,
 * folded into totals per kind so it needs no day-by-day loop.
 */
export const stockBefore = (
  lastCount: { full: number; empty: number } | null,
  movementsSince: { kind: MovementKind; quantity: number }[],
): StockDelta =>
  movementsSince.reduce(
    (stock, row) => applyToStock(stock, row.kind, row.quantity),
    lastCount ? { full: lastCount.full, empty: lastCount.empty } : { full: 0, empty: 0 },
  );

/** Both types' money for the same day, kind by kind. */
export const sumAmounts = (days: LedgerDay[]): KindTotals => {
  const amounts = emptyTotals();
  for (const day of days) {
    for (const kind of movementKinds) {
      amounts[kind] = roundMoney(amounts[kind] + day.amounts[kind]);
    }
  }
  return amounts;
};

/** One kind of one type over a period: how many cylinders, how much money, how many entries. */
export type KindSummaryRow = {
  kind: MovementKind;
  /** Null for money lent or paid back. */
  cylinderType: CylinderType | null;
  quantity: number;
  amount: number;
  count: number;
};

/** A run of ledger days, per type, added up into summary rows — the same shape the log's totals use. */
export const summaryRowsOf = (days: Record<CylinderType, LedgerDay[]>): KindSummaryRow[] =>
  cylinderTypes.flatMap((cylinderType) =>
    movementKinds.map((kind) => ({
      kind,
      cylinderType,
      quantity: days[cylinderType].reduce((sum, day) => sum + day.totals[kind], 0),
      amount: roundMoney(days[cylinderType].reduce((sum, day) => sum + day.amounts[kind], 0)),
      count: 0,
    })),
  );
