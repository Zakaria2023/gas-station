import "server-only";
import { and, asc, count, eq, ilike, inArray, isNotNull, or, sql, SQL } from "drizzle-orm";
import { db } from "@/db";
import { movementKinds } from "@/db/enum";
import { Customers, Movements, SelectCustomers } from "@/db/schema";
import { addBalance, Balance, emptyBalance, foldBalance, isSettled } from "@/lib/balances";
import { needsCustomer } from "@/lib/movement-rules";
import { ARABIC_FOLD_FROM, ARABIC_FOLD_TO, foldArabic, generateUuid, isUniqueViolation } from "@/utils";
import { movementSums } from "./aggregates";

export type CustomerWithBalance = Pick<SelectCustomers, "id" | "uuid" | "name" | "phone"> & {
  balance: Balance;
};

export type CustomerFields = {
  name: string;
  phone: string | null;
  notes: string | null;
};

const DEBT_KINDS = movementKinds.filter(needsCustomer);

const DUPLICATE_NAME = "يوجد زبون بنفس الاسم. أضف اسم العائلة أو اللقب للتمييز.";

/** Every customer's debt, worked out from their debt movements. */
const balancesFor = async (customerIds?: number[]): Promise<Map<number, Balance>> => {
  if (customerIds && customerIds.length === 0) {
    return new Map();
  }
  const rows = await db
    .select({
      customerId: Movements.customerId,
      kind: Movements.kind,
      cylinderType: Movements.cylinderType,
      quantity: movementSums.quantity,
      amount: movementSums.amount,
    })
    .from(Movements)
    .where(
      and(
        isNotNull(Movements.customerId),
        inArray(Movements.kind, DEBT_KINDS),
        customerIds ? inArray(Movements.customerId, customerIds) : undefined,
      ),
    )
    .groupBy(Movements.customerId, Movements.kind, Movements.cylinderType);

  const grouped = new Map<number, typeof rows>();
  for (const row of rows) {
    if (row.customerId === null) {
      continue;
    }
    const list = grouped.get(row.customerId) ?? [];
    list.push(row);
    grouped.set(row.customerId, list);
  }
  return new Map([...grouped.entries()].map(([id, list]) => [id, foldBalance(list)]));
};

/** The debt of one customer, inside a transaction when one is given. */
export const balanceOf = async (customerId: number): Promise<Balance> =>
  (await balancesFor([customerId])).get(customerId) ?? emptyBalance();

const escapeLike = (value: string) => value.replace(/[\\%_]/g, (char) => `\\${char}`);

const searchFilter = (search?: string): SQL | undefined => {
  const term = search?.trim();
  if (!term) {
    return undefined;
  }
  const pattern = `%${escapeLike(foldArabic(term))}%`;
  return or(
    // Fold the stored name the same way the typed one was (see utils/text.ts).
    sql`translate(${Customers.name}, ${ARABIC_FOLD_FROM}, ${ARABIC_FOLD_TO}) ilike ${pattern}`,
    ilike(Customers.phone, `%${escapeLike(term)}%`),
  );
};

const byName = (a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name, "ar");

export const listCustomers = async (
  filters: { search?: string; owingOnly?: boolean } = {},
): Promise<CustomerWithBalance[]> => {
  const rows = await db
    .select({ id: Customers.id, uuid: Customers.uuid, name: Customers.name, phone: Customers.phone })
    .from(Customers)
    .where(searchFilter(filters.search))
    .orderBy(asc(Customers.name));
  const balances = await balancesFor(rows.map((row) => row.id));
  return rows
    .map((row) => ({ ...row, balance: balances.get(row.id) ?? emptyBalance() }))
    .filter((row) => !filters.owingOnly || !isSettled(row.balance))
    .sort(byName);
};

/** Cylinders and money out with customers, across everyone. */
export const getTotalOwed = async (): Promise<Balance> => {
  const balances = await balancesFor();
  return [...balances.values()].reduce(addBalance, emptyBalance());
};

export const getCustomer = async (
  uuid: string,
): Promise<(SelectCustomers & { balance: Balance }) | null> => {
  const [customer] = await db.select().from(Customers).where(eq(Customers.uuid, uuid));
  if (!customer) {
    return null;
  }
  return { ...customer, balance: await balanceOf(customer.id) };
};

export const createCustomer = async (fields: CustomerFields): Promise<string> => {
  const uuid = generateUuid();
  try {
    await db.insert(Customers).values({ ...fields, uuid });
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new Error(DUPLICATE_NAME);
    }
    throw error;
  }
  return uuid;
};

export const updateCustomer = async (uuid: string, fields: CustomerFields): Promise<void> => {
  try {
    await db.update(Customers).set(fields).where(eq(Customers.uuid, uuid));
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new Error(DUPLICATE_NAME);
    }
    throw error;
  }
};

/** Only a customer with no movements can go; one with history keeps it. */
export const deleteCustomer = async (uuid: string): Promise<void> => {
  const [customer] = await db
    .select({ id: Customers.id })
    .from(Customers)
    .where(eq(Customers.uuid, uuid));
  if (!customer) {
    return;
  }
  const [used] = await db
    .select({ total: count() })
    .from(Movements)
    .where(eq(Movements.customerId, customer.id));
  if (Number(used?.total ?? 0) > 0) {
    throw new Error("لا يمكن حذف زبون له حركات مسجّلة. احذف حركاته أولاً.");
  }
  await db.delete(Customers).where(eq(Customers.id, customer.id));
};
