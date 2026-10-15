import "server-only";
import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { CylinderType, MovementKind, movementKinds } from "@/db/enum";
import { CYLINDER_STATE_LABELS, CYLINDER_TYPE_LABELS } from "@/db/label";
import { Customers, Movements } from "@/db/schema";
import { Balance, bucketOf, foldBalance, owedIn } from "@/lib/balances";
import { isCash, isReturn, MOVEMENT_EFFECTS, needsCustomer } from "@/lib/movement-rules";
import { formatMoney, generateUuid } from "@/utils";
import { movementSums } from "./aggregates";

export type MovementFields = {
  kind: MovementKind;
  /** Null for money lent or paid back. */
  cylinderType: CylinderType | null;
  /** 1 for money. */
  quantity: number;
  /** One cylinder's price, or the amount of money; null when the movement has none. */
  unitPrice: number | null;
  customerUuid: string | null;
  businessDate: string;
  note: string | null;
};

/** A movement with the names a list shows next to it. */
export type MovementRow = {
  uuid: string;
  kind: MovementKind;
  cylinderType: CylinderType | null;
  quantity: number;
  unitPrice: number | null;
  businessDate: string;
  note: string | null;
  createdAt: Date;
  customerUuid: string | null;
  customerName: string | null;
};

const DEBT_KINDS = movementKinds.filter(needsCustomer);

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

/** What a customer owes, read inside the transaction that is about to change it. */
const owedInTx = async (tx: Tx, customerId: number): Promise<Balance> => {
  const rows = await tx
    .select({
      kind: Movements.kind,
      cylinderType: Movements.cylinderType,
      quantity: movementSums.quantity,
      amount: movementSums.amount,
    })
    .from(Movements)
    .where(and(eq(Movements.customerId, customerId), inArray(Movements.kind, DEBT_KINDS)))
    .groupBy(Movements.kind, Movements.cylinderType);
  return foldBalance(rows);
};

/** Of what is owed, the part a debt or return of this kind moves: cylinders of one type and state, or money. */
const owedFor = (owed: Balance, kind: MovementKind, cylinderType: CylinderType | null): number => {
  const bucket = bucketOf(kind, cylinderType);
  return bucket ? owedIn(owed, bucket) : 0;
};

/** A movement's size in the unit its debt is counted in: cylinders, or ل.س. */
const sizeOf = (kind: MovementKind, quantity: number, unitPrice: number | null): number =>
  isCash(kind) ? (unitPrice ?? 0) : quantity;

/** "3 منزلي مليان" or "5,000 ل.س"; without an amount, just what it is: "منزلي مليان", "مصاري". */
const describe = (owed: number | null, cylinderType: CylinderType | null, kind: MovementKind) => {
  if (!cylinderType) {
    return owed === null ? "مصاري" : formatMoney(owed);
  }
  const state = MOVEMENT_EFFECTS[kind].debt?.state ?? "full";
  const what = `${CYLINDER_TYPE_LABELS[cylinderType]} ${CYLINDER_STATE_LABELS[state]}`;
  return owed === null ? what : `${owed} ${what}`;
};

/**
 * Record a movement. A debt needs its customer; a return can never bring back
 * more than the customer owes, checked under a lock on the customer so two
 * phones returning at once cannot both pass. Money has no cylinder type and
 * is one movement whose price is the amount.
 */
export const createMovement = async (fields: MovementFields): Promise<string> => {
  if (needsCustomer(fields.kind) && !fields.customerUuid) {
    throw new Error("اختر الزبون لهذه الحركة");
  }
  const cash = isCash(fields.kind);
  if (cash && !(fields.unitPrice && fields.unitPrice > 0)) {
    throw new Error("أدخل المبلغ");
  }
  if (!cash && !fields.cylinderType) {
    throw new Error("اختر الصنف");
  }
  const cylinderType = cash ? null : fields.cylinderType;
  const quantity = cash ? 1 : fields.quantity;
  const uuid = generateUuid();

  await db.transaction(async (tx) => {
    let customerId: number | null = null;
    if (fields.customerUuid) {
      const [customer] = await tx
        .select({ id: Customers.id, name: Customers.name })
        .from(Customers)
        .where(eq(Customers.uuid, fields.customerUuid))
        .for("update");
      if (!customer) {
        throw new Error("هذا الزبون غير موجود");
      }
      customerId = customer.id;

      if (isReturn(fields.kind)) {
        const owed = owedFor(await owedInTx(tx, customer.id), fields.kind, cylinderType);
        if (sizeOf(fields.kind, quantity, fields.unitPrice) > owed) {
          throw new Error(
            owed > 0
              ? `${customer.name} عليه ${describe(owed, cylinderType, fields.kind)} فقط`
              : `${customer.name} ما عليه ${describe(null, cylinderType, fields.kind)}`,
          );
        }
      }
    }

    await tx.insert(Movements).values({
      uuid,
      kind: fields.kind,
      cylinderType,
      quantity,
      unitPrice: fields.unitPrice,
      customerId,
      businessDate: fields.businessDate,
      note: fields.note,
    });
  });

  return uuid;
};

export type DayLine = {
  kind: MovementKind;
  cylinderType: CylinderType;
  quantity: number;
  unitPrice: number | null;
};

/**
 * Several movements of one day that need no customer — the day's sales, or
 * the full cylinders that came in — saved together in one insert.
 */
export const createDayMovements = async (
  businessDate: string,
  lines: DayLine[],
  note: string | null,
): Promise<string[]> => {
  if (lines.some((line) => needsCustomer(line.kind) || isCash(line.kind) || line.quantity < 1)) {
    throw new Error("حركة غير صالحة");
  }
  const rows = lines.map((line) => ({ uuid: generateUuid(), ...line, customerId: null, businessDate, note }));
  if (rows.length > 0) {
    await db.insert(Movements).values(rows);
  }
  return rows.map((row) => row.uuid);
};

/**
 * Remove a movement entered by mistake. A debt that has already been partly
 * returned cannot go first, or the customer would owe less than nothing — in
 * cylinders or in money.
 */
export const deleteMovement = async (uuid: string): Promise<void> => {
  await db.transaction(async (tx) => {
    const [movement] = await tx
      .select({
        id: Movements.id,
        kind: Movements.kind,
        cylinderType: Movements.cylinderType,
        quantity: Movements.quantity,
        unitPrice: Movements.unitPrice,
        customerId: Movements.customerId,
      })
      .from(Movements)
      .where(eq(Movements.uuid, uuid));
    if (!movement) {
      return;
    }
    if (needsCustomer(movement.kind) && !isReturn(movement.kind) && movement.customerId !== null) {
      await tx
        .select({ id: Customers.id })
        .from(Customers)
        .where(eq(Customers.id, movement.customerId))
        .for("update");
      const owed = owedFor(await owedInTx(tx, movement.customerId), movement.kind, movement.cylinderType);
      if (owed - sizeOf(movement.kind, movement.quantity, movement.unitPrice) < 0) {
        throw new Error("الزبون رجّع جزءاً من هذا الدين. احذف حركة الإرجاع أولاً.");
      }
    }
    await tx.delete(Movements).where(eq(Movements.id, movement.id));
  });
};

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

/** Everything entered for one day, newest first. */
export const getDayMovements = (date: string): Promise<MovementRow[]> =>
  db
    .select(rowSelection)
    .from(Movements)
    .leftJoin(Customers, eq(Movements.customerId, Customers.id))
    .where(eq(Movements.businessDate, date))
    .orderBy(desc(Movements.createdAt));

/** A customer's history, newest first. */
export const getCustomerMovements = (customerId: number, limit = 200): Promise<MovementRow[]> =>
  db
    .select(rowSelection)
    .from(Movements)
    .leftJoin(Customers, eq(Movements.customerId, Customers.id))
    .where(eq(Movements.customerId, customerId))
    .orderBy(desc(Movements.businessDate), desc(Movements.createdAt))
    .limit(limit);
