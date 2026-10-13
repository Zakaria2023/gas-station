import "server-only";
import { and, asc, eq, gte, lte, max, min, sql } from "drizzle-orm";
import { db } from "@/db";
import { CylinderType, cylinderTypes } from "@/db/enum";
import { Movements, StockCounts } from "@/db/schema";
import { buildLedger, LedgerDay } from "@/lib/ledger";
import { movementSums } from "./aggregates";

export type Ledger = Record<CylinderType, LedgerDay[]>;

/**
 * Where a type's running totals start for a range beginning on `from`: the
 * latest count on or before it, else the first movement ever, else `from`.
 * Both are asked in one round trip: the database is far from the server.
 */
const startFor = async (cylinderType: CylinderType, from: string): Promise<string> => {
  const latestCount = db
    .select({ date: max(StockCounts.countedOn) })
    .from(StockCounts)
    .where(and(eq(StockCounts.cylinderType, cylinderType), lte(StockCounts.countedOn, from)));
  const firstMovement = db
    .select({ date: min(Movements.businessDate) })
    .from(Movements)
    .where(eq(Movements.cylinderType, cylinderType));
  // ::text keeps the dates as "YYYY-MM-DD" whatever the driver does with a date.
  const result = await db.execute<{ counted_on: string | null; first_movement: string | null }>(
    sql`select (${latestCount})::text as counted_on, (${firstMovement})::text as first_movement`,
  );
  const row = result.rows[0];
  if (row?.counted_on) {
    return row.counted_on;
  }
  return row?.first_movement && row.first_movement < from ? row.first_movement : from;
};

const ledgerFor = async (
  cylinderType: CylinderType,
  from: string,
  to: string,
): Promise<LedgerDay[]> => {
  const start = await startFor(cylinderType, from);
  const [counts, totals] = await Promise.all([
    db
      .select({ countedOn: StockCounts.countedOn, full: StockCounts.full, empty: StockCounts.empty })
      .from(StockCounts)
      .where(
        and(
          eq(StockCounts.cylinderType, cylinderType),
          gte(StockCounts.countedOn, start),
          lte(StockCounts.countedOn, to),
        ),
      )
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
          gte(Movements.businessDate, start),
          lte(Movements.businessDate, to),
        ),
      )
      .groupBy(Movements.businessDate, Movements.kind),
  ]);
  return buildLedger(start, to, counts, totals).filter((day) => day.date >= from);
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
