import "server-only";
import { count, sql, sum } from "drizzle-orm";
import { Movements } from "@/db/schema";

/**
 * The sums every grouped movement query needs. float8 comes back from the
 * driver as a JS number (numeric would be a string); amounts stay well inside
 * its exact range.
 */
export const movementSums = {
  quantity: sql<number>`${sum(Movements.quantity)}::int`,
  // A movement entered without a price adds nothing, rather than nulling the sum.
  amount: sql<number>`coalesce(sum(${Movements.quantity} * ${Movements.unitPrice}), 0)::float8`,
  count: sql<number>`${count()}::int`,
};
