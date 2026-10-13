import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { pgTable, serial, text, timestamp, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core";

/**
 * Someone who can owe the shop cylinders. The name is unique: the sheet's
 * debt summary matched rows by typed name, and a second spelling of the same
 * person silently split their debt in two.
 */
export const Customers = pgTable(
  "customers",
  {
    id: serial("id").primaryKey(),
    uuid: uuid("uuid").notNull().unique(),
    name: varchar("name", { length: 120 }).notNull(),
    phone: varchar("phone", { length: 30 }),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [uniqueIndex("uq_customers_name").on(table.name)],
);

export type SelectCustomers = InferSelectModel<typeof Customers>;
export type InsertCustomers = InferInsertModel<typeof Customers>;
