import { InferInsertModel, InferSelectModel, sql } from "drizzle-orm";
import {
  check,
  date,
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { cashKinds, cylinderTypes, movementKinds } from "../enum";
import { Customers } from "./customers";

export const cylinderTypeEnum = pgEnum("cylinder_type", cylinderTypes);
export const movementKindEnum = pgEnum("movement_kind", movementKinds);

/**
 * One thing that happened to the cylinders: an exchange, a sale, a debt, a
 * return, full cylinders added — or money lent to a customer and paid back. The day's
 * stock and every customer's debt are both worked out from these rows, so a
 * debt is entered once, not on two sheets.
 */
export const Movements = pgTable(
  "movements",
  {
    id: serial("id").primaryKey(),
    uuid: uuid("uuid").notNull().unique(),
    kind: movementKindEnum("kind").notNull(),
    // Null only for money lent or paid back, which moves no cylinder.
    cylinderType: cylinderTypeEnum("cylinder_type"),
    // Always 1 for money: the amount is the unit price.
    quantity: integer("quantity").notNull(),
    // The price of one cylinder when this was entered: the price list's,
    // or what was typed instead. Kept on the row, so a later price change
    // never rewrites what a past sale earned. Null when it had no price.
    unitPrice: numeric("unit_price", { precision: 14, scale: 2, mode: "number" }),
    // Required for the debt kinds (cylinders or money), optional for the rest.
    customerId: integer("customer_id").references(() => Customers.id, { onDelete: "restrict" }),
    // The shop's day, in its own time zone — not derived from created_at,
    // which is UTC on the server.
    businessDate: date("business_date", { mode: "string" }).notNull(),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("idx_movements_date").on(table.businessDate),
    index("idx_movements_customer").on(table.customerId),
    check("chk_movements_quantity", sql`${table.quantity} > 0`),
    // Cast to text: a check naming new enum values fails in the push that adds them.
    check(
      "chk_movements_cash",
      sql`(${table.kind}::text in (${sql.raw(cashKinds.map((kind) => `'${kind}'`).join(", "))})) = coalesce(${table.cylinderType} is null and ${table.quantity} = 1 and ${table.unitPrice} > 0 and ${table.customerId} is not null, false)`,
    ),
  ],
);

export type SelectMovements = InferSelectModel<typeof Movements>;
export type InsertMovements = InferInsertModel<typeof Movements>;
