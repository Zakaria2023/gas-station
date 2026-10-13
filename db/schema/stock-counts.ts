import { InferInsertModel, InferSelectModel, sql } from "drizzle-orm";
import {
  check,
  date,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { cylinderTypeEnum } from "./movements";

/**
 * What was physically in the shop at the START of a day — the sheet's
 * "أول اليوم" columns. Without one, a day opens with the previous day's
 * closing; with one, the count wins and the running totals restart from it.
 */
export const StockCounts = pgTable(
  "stock_counts",
  {
    id: serial("id").primaryKey(),
    uuid: uuid("uuid").notNull().unique(),
    cylinderType: cylinderTypeEnum("cylinder_type").notNull(),
    countedOn: date("counted_on", { mode: "string" }).notNull(),
    full: integer("full").notNull(),
    empty: integer("empty").notNull(),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("uq_stock_counts_day").on(table.cylinderType, table.countedOn),
    check("chk_stock_counts_full", sql`${table.full} >= 0`),
    check("chk_stock_counts_empty", sql`${table.empty} >= 0`),
  ],
);

export type SelectStockCounts = InferSelectModel<typeof StockCounts>;
export type InsertStockCounts = InferInsertModel<typeof StockCounts>;
