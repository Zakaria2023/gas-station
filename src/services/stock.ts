import "server-only";
import { and, asc, desc, gte, isNotNull, lt, lte, sql } from "drizzle-orm";
import { db } from "@/db";
import { CylinderType } from "@/db/enum";
import { Movements, StockCounts } from "@/db/schema";
import { buildLedger, LedgerDay, stockBefore } from "@/lib/ledger";
import { movementSums } from "./aggregates";

export type Ledger = Record<CylinderType, LedgerDay[]>;

/**
 * Day by day, for both types, from `from` to `to` inclusive. The stock just
 * before `from` comes from each type's last count before it plus the
 * movements since, added up in the database; then only the window itself is
 * walked. Four questions cover both types, all in parallel — the database is
 * far from the server — so a month ten years in costs the same as this one.
 */
export const getLedger = async (from: string, to: string): Promise<Ledger> => {
  // Per row of movements: the day its type was last counted before the window.
  const lastCountDate = sql`(select max(${StockCounts.countedOn}) from ${StockCounts} where ${StockCounts.cylinderType} = ${Movements.cylinderType} and ${StockCounts.countedOn} < ${from})`;

  const [lastCounts, before, counts, totals] = await Promise.all([
    db
      .selectDistinctOn([StockCounts.cylinderType], {
        cylinderType: StockCounts.cylinderType,
        full: StockCounts.full,
        empty: StockCounts.empty,
      })
      .from(StockCounts)
      .where(lt(StockCounts.countedOn, from))
      .orderBy(StockCounts.cylinderType, desc(StockCounts.countedOn)),
    db
      .select({ cylinderType: Movements.cylinderType, kind: Movements.kind, quantity: movementSums.quantity })
      .from(Movements)
      .where(
        and(
          // Money lent or paid back has no type and moves no stock.
          isNotNull(Movements.cylinderType),
          lt(Movements.businessDate, from),
          // Only what came after the last count; with no count, everything.
          sql`${Movements.businessDate} >= coalesce(${lastCountDate}, '0001-01-01'::date)`,
        ),
      )
      .groupBy(Movements.cylinderType, Movements.kind),
    db
      .select({
        cylinderType: StockCounts.cylinderType,
        countedOn: StockCounts.countedOn,
        full: StockCounts.full,
        empty: StockCounts.empty,
      })
      .from(StockCounts)
      .where(and(gte(StockCounts.countedOn, from), lte(StockCounts.countedOn, to)))
      .orderBy(asc(StockCounts.countedOn)),
    db
      .select({
        cylinderType: Movements.cylinderType,
        businessDate: Movements.businessDate,
        kind: Movements.kind,
        quantity: movementSums.quantity,
        amount: movementSums.amount,
        count: movementSums.count,
      })
      .from(Movements)
      .where(
        and(
          isNotNull(Movements.cylinderType),
          gte(Movements.businessDate, from),
          lte(Movements.businessDate, to),
        ),
      )
      .groupBy(Movements.cylinderType, Movements.businessDate, Movements.kind),
  ]);

  const ledgerFor = (cylinderType: CylinderType): LedgerDay[] => {
    const ofType = <T extends { cylinderType: CylinderType | null }>(rows: T[]) =>
      rows.filter((row) => row.cylinderType === cylinderType);
    const lastCount = ofType(lastCounts)[0] ?? null;
    return buildLedger(from, to, ofType(counts), ofType(totals), stockBefore(lastCount, ofType(before)));
  };
  return { household: ledgerFor("household"), industrial: ledgerFor("industrial") };
};

/** One day of the sheet: both types' opening, totals and closing. */
export const getDayStock = async (date: string): Promise<Record<CylinderType, LedgerDay>> => {
  const ledger = await getLedger(date, date);
  const pick = (cylinderType: CylinderType): LedgerDay => {
    const day = ledger[cylinderType][0];
    if (!day) {
      throw new Error("The ledger came back without the day it was asked for");
    }
    return day;
  };
  return { household: pick("household"), industrial: pick("industrial") };
};

/** The first day anything was recorded, so history knows how far back to go. */
export const getFirstActivityDate = async (): Promise<string | null> => {
  const result = await db.execute<{ first: string | null }>(
    sql`select least((select min(${Movements.businessDate}) from ${Movements}), (select min(${StockCounts.countedOn}) from ${StockCounts}))::text as first`,
  );
  return result.rows[0]?.first ?? null;
};
