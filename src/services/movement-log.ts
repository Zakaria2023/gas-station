import "server-only";
import { and, asc, count, desc, eq, gt, gte, inArray, lte, SQL } from "drizzle-orm";
import { db } from "@/db";
import { cashKinds } from "@/db/enum";
import { Customers, Movements } from "@/db/schema";
import { KindSummaryRow } from "@/lib/ledger";
import { MovementFilters } from "@/lib/movement-filters";
import { movementSums } from "./aggregates";
import { MovementRow } from "./movements";

/**
 * Every movement ever, narrowed by date range, type, kind and customer —
 * read a page at a time and added up in the database, so ten years of rows
 * never travel to the server at once.
 */

export const LOG_PAGE_SIZE = 50;

export type MovementLogPage = {
  rows: MovementRow[];
  total: number;
  page: number;
  pageCount: number;
};

/** One kind of one type over the filtered period: how many, how much, how often. */
export type MovementSummaryRow = KindSummaryRow;

const whereOf = (filters: MovementFilters): SQL | undefined =>
  and(
    filters.from ? gte(Movements.businessDate, filters.from) : undefined,
    filters.to ? lte(Movements.businessDate, filters.to) : undefined,
    filters.cylinderType ? eq(Movements.cylinderType, filters.cylinderType) : undefined,
    filters.kind ? eq(Movements.kind, filters.kind) : undefined,
    filters.customerUuid ? eq(Customers.uuid, filters.customerUuid) : undefined,
  );

const rowSelection = {
  uuid: Movements.uuid,
  kind: Movements.kind,
  cylinderType: Movements.cylinderType,
  quantity: Movements.quantity,
  unitPrice: Movements.unitPrice,
  businessDate: Movements.businessDate,
  note: Movements.note,
  createdAt: Movements.createdAt,
  customerUuid: Customers.uuid,
  customerName: Customers.name,
};

/** One page of the log, newest day first and newest entry first within a day. */
export const listMovements = async (filters: MovementFilters, page: number): Promise<MovementLogPage> => {
  const where = whereOf(filters);
  const current = Math.max(1, page);
  // The count and the page in one round trip; a page past the end comes back empty.
  const [[totals], rows] = await Promise.all([
    db
      .select({ total: count() })
      .from(Movements)
      .leftJoin(Customers, eq(Movements.customerId, Customers.id))
      .where(where),
    db
      .select(rowSelection)
      .from(Movements)
      .leftJoin(Customers, eq(Movements.customerId, Customers.id))
      .where(where)
      .orderBy(desc(Movements.businessDate), desc(Movements.createdAt), desc(Movements.id))
      .limit(LOG_PAGE_SIZE)
      .offset((current - 1) * LOG_PAGE_SIZE),
  ]);
  const total = Number(totals?.total ?? 0);
  return { rows, total, page: current, pageCount: Math.max(1, Math.ceil(total / LOG_PAGE_SIZE)) };
};

/** The filtered period added up per kind and type, for the totals above the log. */
export const summarizeMovements = (filters: MovementFilters): Promise<MovementSummaryRow[]> =>
  db
    .select({
      kind: Movements.kind,
      cylinderType: Movements.cylinderType,
      quantity: movementSums.quantity,
      amount: movementSums.amount,
      count: movementSums.count,
    })
    .from(Movements)
    .leftJoin(Customers, eq(Movements.customerId, Customers.id))
    .where(whereOf(filters))
    .groupBy(Movements.kind, Movements.cylinderType);

/**
 * Money lent and paid back from `from` to `to`, per kind. The ledger walks
 * cylinders type by type and leaves these out; a day's or a month's money
 * adds them to its rows.
 */
export const summarizeCash = (from: string, to: string): Promise<MovementSummaryRow[]> =>
  db
    .select({
      kind: Movements.kind,
      cylinderType: Movements.cylinderType,
      quantity: movementSums.quantity,
      amount: movementSums.amount,
      count: movementSums.count,
    })
    .from(Movements)
    .where(
      and(
        inArray(Movements.kind, cashKinds),
        gte(Movements.businessDate, from),
        lte(Movements.businessDate, to),
      ),
    )
    .groupBy(Movements.kind, Movements.cylinderType);

/**
 * The whole filtered log, oldest first, in batches — for the spreadsheet
 * export. Each batch picks up after the last id, so years of rows stream
 * out without one giant query.
 */
export async function* streamMovements(
  filters: MovementFilters,
  batchSize = 2_000,
): AsyncGenerator<MovementRow[]> {
  let afterId = 0;
  for (;;) {
    const batch = await db
      .select({ ...rowSelection, id: Movements.id })
      .from(Movements)
      .leftJoin(Customers, eq(Movements.customerId, Customers.id))
      .where(and(whereOf(filters), gt(Movements.id, afterId)))
      .orderBy(asc(Movements.id))
      .limit(batchSize);
    if (batch.length === 0) {
      return;
    }
    afterId = batch[batch.length - 1]!.id;
    yield batch;
    if (batch.length < batchSize) {
      return;
    }
  }
}

/** The customer a filter names, for the chip that shows and clears it. */
export const getCustomerName = async (uuid: string): Promise<string | null> => {
  const [row] = await db.select({ name: Customers.name }).from(Customers).where(eq(Customers.uuid, uuid));
  return row?.name ?? null;
};
