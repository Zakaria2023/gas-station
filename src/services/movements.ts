import "server-only";
import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { CylinderType, MovementKind, movementKinds } from "@/db/enum";
import { CYLINDER_STATE_LABELS, CYLINDER_TYPE_LABELS } from "@/db/label";
import { Customers, Movements } from "@/db/schema";
import { foldBalance } from "@/lib/balances";
import { MOVEMENT_EFFECTS, needsCustomer } from "@/lib/movement-rules";
import { generateUuid } from "@/utils";
import { movementSums } from "./aggregates";

export type MovementFields = {
  kind: MovementKind;
  cylinderType: CylinderType;
  quantity: number;
  /** One cylinder's price; null when the movement has none. */
  unitPrice: number | null;
  customerUuid: string | null;
  businessDate: string;
  note: string | null;
};

/** A movement with the names a list shows next to it. */
export type MovementRow = {
  uuid: string;
  kind: MovementKind;
  cylinderType: CylinderType;
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

/** What a customer owes of one type, read inside the transaction that is about to change it. */
const owedInTx = async (tx: Tx, customerId: number, cylinderType: CylinderType) => {
  const rows = await tx
    .select({
      kind: Movements.kind,
      cylinderType: Movements.cylinderType,
      quantity: movementSums.quantity,
      amount: movementSums.amount,
    })
    .from(Movements)
    .where(
      and(
        eq(Movements.customerId, customerId),
        eq(Movements.cylinderType, cylinderType),
        inArray(Movements.kind, DEBT_KINDS),
      ),
    )
    .groupBy(Movements.kind, Movements.cylinderType);
  return foldBalance(rows)[cylinderType];
};

const describe = (quantity: number, cylinderType: CylinderType, kind: MovementKind) => {
  const state = MOVEMENT_EFFECTS[kind].debt?.state ?? "full";
  return `${quantity} ${CYLINDER_TYPE_LABELS[cylinderType]} ${CYLINDER_STATE_LABELS[state]}`;
};

/**
 * Record a movement. A debt needs its customer; a return can never bring back
 * more than the customer owes, checked under a lock on the customer so two
 * phones returning at once cannot both pass.
 */
export const createMovement = async (fields: MovementFields): Promise<string> => {
  if (needsCustomer(fields.kind) && !fields.customerUuid) {
    throw new Error("اختر الزبون لهذه الحركة");
  }
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

      const debt = MOVEMENT_EFFECTS[fields.kind].debt;
      if (debt?.sign === -1) {
        const owed = (await owedInTx(tx, customer.id, fields.cylinderType))[debt.state];
        if (fields.quantity > owed) {
          throw new Error(
            owed > 0
              ? `${customer.name} عليه ${describe(owed, fields.cylinderType, fields.kind)} فقط`
              : `${customer.name} ما عليه ${CYLINDER_TYPE_LABELS[fields.cylinderType]} ${CYLINDER_STATE_LABELS[debt.state]}`,
          );
        }
      }
    }

    await tx.insert(Movements).values({
      uuid,
      kind: fields.kind,
      cylinderType: fields.cylinderType,
      quantity: fields.quantity,
      unitPrice: fields.unitPrice,
      customerId,
      businessDate: fields.businessDate,
      note: fields.note,
    });
  });

  return uuid;
};

/**
 * Remove a movement entered by mistake. A debt that has already been partly
 * returned cannot go first, or the customer would owe less than nothing.
 */
export const deleteMovement = async (uuid: string): Promise<void> => {
  await db.transaction(async (tx) => {
    const [movement] = await tx
      .select({
        id: Movements.id,
        kind: Movements.kind,
        cylinderType: Movements.cylinderType,
        quantity: Movements.quantity,
        customerId: Movements.customerId,
      })
      .from(Movements)
      .where(eq(Movements.uuid, uuid));
    if (!movement) {
      return;
    }
    const debt = MOVEMENT_EFFECTS[movement.kind].debt;
    if (debt?.sign === 1 && movement.customerId !== null) {
      await tx
        .select({ id: Customers.id })
        .from(Customers)
        .where(eq(Customers.id, movement.customerId))
        .for("update");
      const owed = (await owedInTx(tx, movement.customerId, movement.cylinderType))[debt.state];
      if (owed - movement.quantity < 0) {
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
