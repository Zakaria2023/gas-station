import "server-only";
import { and, asc, desc, eq, gte, lt, lte, sql } from "drizzle-orm";
import { db } from "@/db";
import { CylinderType, cylinderTypes } from "@/db/enum";
import { Movements, StockCounts } from "@/db/schema";
import { buildLedger, LedgerDay, stockBefore } from "@/lib/ledger";
import { movementSums } from "./aggregates";

export type Ledger = Record<CylinderType, LedgerDay[]>;

/**
 * One type's days from `from` to `to`. The stock just before `from` comes from
 * the last count before it plus the movements since, added up in the
 * database; then only the window itself is walked. All four questions go in
 * parallel — the database is far from the server — so a month ten years in
 * costs the same as this one.
 */
const ledgerFor = async (
  cylinderType: CylinderType,
  from: string,
  to: string,
): Promise<LedgerDay[]> => {
  const ofType = eq(StockCounts.cylinderType, cylinderType);
  const lastCountDate = sql`(select max(${StockCounts.countedOn}) from ${StockCounts} where ${ofType} and ${StockCounts.countedOn} < ${from})`;

  const [[lastCount], before, counts, totals] = await Promise.all([
    db
      .select({ full: StockCounts.full, empty: StockCounts.empty })
      .from(StockCounts)
      .where(and(ofType, lt(StockCounts.countedOn, from)))
      .orderBy(desc(StockCounts.countedOn))
      .limit(1),
    db
      .select({ kind: Movements.kind, quantity: movementSums.quantity })
      .from(Movements)
      .where(
        and(
          eq(Movements.cylinderType, cylinderType),
          lt(Movements.businessDate, from),
          // Only what came after the last count; with no count, everything.
          sql`${Movements.businessDate} >= coalesce(${lastCountDate}, '0001-01-01'::date)`,
        ),
      )
      .groupBy(Movements.kind),
    db
      .select({ countedOn: StockCounts.countedOn, full: StockCounts.full, empty: StockCounts.empty })
      .from(StockCounts)
      .where(and(ofType, gte(StockCounts.countedOn, from), lte(StockCounts.countedOn, to)))
      .orderBy(asc(StockCounts.countedOn)),
    db
      .select({
        businessDate: Movements.businessDate,
        kind: Movements.kind,
        quantity: movementSums.quantity,
        amount: movementSums.amount,
        count: movementSums.count,
      })
      .from(Movements)
      .where(
        and(
          eq(Movements.cylinderType, cylinderType),
          gte(Movements.businessDate, from),
          lte(Movements.businessDate, to),
        ),
      )
      .groupBy(Movements.businessDate, Movements.kind),
  ]);

  return buildLedger(from, to, counts, totals, stockBefore(lastCount ?? null, before));
};

/** Day by day, for both types, from `from` to `to` inclusive. */
export const getLedger = async (from: string, to: string): Promise<Ledger> => {
  const [household, industrial] = await Promise.all(
    cylinderTypes.map((cylinderType) => ledgerFor(cylinderType, from, to)),
  );
  return { household: household ?? [], industrial: industrial ?? [] };
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
