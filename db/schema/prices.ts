import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { date, numeric, pgTable, serial, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { cylinderTypeEnum, movementKindEnum } from "./movements";

/**
 * The price list: what one cylinder of a movement costs, per type, from a day
 * onward. A new price is a new row, so the old one still prices the days
 * before it. A null price means "no price from this day".
 */
export const Prices = pgTable(
  "prices",
  {
    id: serial("id").primaryKey(),
    uuid: uuid("uuid").notNull().unique(),
    cylinderType: cylinderTypeEnum("cylinder_type").notNull(),
    kind: movementKindEnum("kind").notNull(),
    price: numeric("price", { precision: 14, scale: 2, mode: "number" }),
    effectiveFrom: date("effective_from", { mode: "string" }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("uq_prices_day").on(table.cylinderType, table.kind, table.effectiveFrom),
  ],
);

export type SelectPrices = InferSelectModel<typeof Prices>;
export type InsertPrices = InferInsertModel<typeof Prices>;
