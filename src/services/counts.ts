import "server-only";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { CylinderType } from "@/db/enum";
import { SelectStockCounts, StockCounts } from "@/db/schema";
import { generateUuid } from "@/utils";

export type CountFields = {
  cylinderType: CylinderType;
  countedOn: string;
  full: number;
  empty: number;
  note: string | null;
};

/** The morning counts already entered for a day, by type. */
export const getCountsForDay = async (
  date: string,
): Promise<Partial<Record<CylinderType, SelectStockCounts>>> => {
  const rows = await db.select().from(StockCounts).where(eq(StockCounts.countedOn, date));
  return Object.fromEntries(rows.map((row) => [row.cylinderType, row]));
};

/** Record what was counted; a second count for the same day and type replaces the first. */
export const saveCount = async (fields: CountFields): Promise<void> => {
  await db
    .insert(StockCounts)
    .values({ ...fields, uuid: generateUuid() })
    .onConflictDoUpdate({
      target: [StockCounts.cylinderType, StockCounts.countedOn],
      set: { full: fields.full, empty: fields.empty, note: fields.note },
    });
};

/** Drop a count, so the day opens with the previous day's closing again. */
export const deleteCount = async (cylinderType: CylinderType, date: string): Promise<void> => {
  await db
    .delete(StockCounts)
    .where(and(eq(StockCounts.cylinderType, cylinderType), eq(StockCounts.countedOn, date)));
};
