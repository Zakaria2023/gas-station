import "server-only";
import { and, asc, desc, eq, lte } from "drizzle-orm";
import { db } from "@/db";
import { CylinderType, MovementKind } from "@/db/enum";
import { Prices } from "@/db/schema";
import { emptyPriceList, PriceList } from "@/lib/pricing";
import { generateUuid } from "@/utils";

export type PriceEntry = {
  cylinderType: CylinderType;
  kind: MovementKind;
  price: number | null;
};

export type PriceChange = PriceEntry & { effectiveFrom: string };

/** The prices in force on a day: for each type and kind, the latest set on or before it. */
export const getPriceList = async (date: string): Promise<PriceList> => {
  const rows = await db
    .selectDistinctOn([Prices.cylinderType, Prices.kind], {
      cylinderType: Prices.cylinderType,
      kind: Prices.kind,
      price: Prices.price,
    })
    .from(Prices)
    .where(lte(Prices.effectiveFrom, date))
    .orderBy(asc(Prices.cylinderType), asc(Prices.kind), desc(Prices.effectiveFrom));
  const list = emptyPriceList();
  for (const row of rows) {
    list[row.cylinderType][row.kind] = row.price;
  }
  return list;
};

/**
 * Set prices from a day onward. Only the ones that differ from what is already
 * in force that day are written, so the history shows real changes.
 */
export const savePrices = async (effectiveFrom: string, entries: PriceEntry[]): Promise<number> => {
  const current = await getPriceList(effectiveFrom);
  const changed = entries.filter(
    (entry) => (current[entry.cylinderType][entry.kind] ?? null) !== entry.price,
  );
  for (const entry of changed) {
    await db
      .insert(Prices)
      .values({ ...entry, uuid: generateUuid(), effectiveFrom })
      .onConflictDoUpdate({
        target: [Prices.cylinderType, Prices.kind, Prices.effectiveFrom],
        set: { price: entry.price },
      });
  }
  return changed.length;
};

/** The latest price changes, newest first, for the history under the price list. */
export const getPriceChanges = (limit = 40): Promise<PriceChange[]> =>
  db
    .select({
      cylinderType: Prices.cylinderType,
      kind: Prices.kind,
      price: Prices.price,
      effectiveFrom: Prices.effectiveFrom,
    })
    .from(Prices)
    .orderBy(desc(Prices.effectiveFrom), desc(Prices.createdAt))
    .limit(limit);

/** Drop the prices set on one day for one type and kind, so the earlier ones apply again. */
export const deletePriceChange = async (
  cylinderType: CylinderType,
  kind: MovementKind,
  effectiveFrom: string,
): Promise<void> => {
  await db
    .delete(Prices)
    .where(
      and(
        eq(Prices.cylinderType, cylinderType),
        eq(Prices.kind, kind),
        eq(Prices.effectiveFrom, effectiveFrom),
      ),
    );
};
