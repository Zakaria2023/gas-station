import { MovementKind, movementKinds } from "@/db/enum";
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
 * Every day from `start` to `end` (inclusive, "YYYY-MM-DD"). `start` must be on
 * or before the first count and movement that matter — usually the latest
 * count before the range — and the stock before `start` is taken as zero.
 */
export const buildLedger = (
  start: string,
  end: string,
  counts: CountRow[],
  movements: MovementTotalRow[],
): LedgerDay[] => {
  const countByDay = new Map(counts.map((count) => [count.countedOn, count]));
  const movementsByDay = new Map<string, MovementTotalRow[]>();
  for (const row of movements) {
    const list = movementsByDay.get(row.businessDate) ?? [];
    list.push(row);
    movementsByDay.set(row.businessDate, list);
  }

  const days: LedgerDay[] = [];
  let stock: StockDelta = { full: 0, empty: 0 };

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
