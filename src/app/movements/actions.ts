"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isCash } from "@/lib/movement-rules";
import { createMovement, deleteMovement } from "@/services";
import { ActionResult, fail } from "@/utils";
import { MovementFormValues, movementFormSchema } from "@/validators/movement";

const revalidateAll = () => {
  // A movement changes the day, the history and a customer's debt alike.
  revalidatePath("/", "layout");
};

export const createMovementAction = async (
  _prevState: ActionResult,
  values: MovementFormValues,
): Promise<ActionResult> => {
  const parsed = movementFormSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "تحقق من البيانات" };
  }
  const { customerUuid, note, unitPrice, ...fields } = parsed.data;
  // Money lent or paid back moves no cylinder: one movement of its amount.
  const cash = isCash(fields.kind);
  let uuid: string;
  try {
    uuid = await createMovement({
      ...fields,
      cylinderType: cash ? null : fields.cylinderType,
      quantity: cash ? 1 : fields.quantity,
      unitPrice: unitPrice === "" ? null : Number(unitPrice),
      customerUuid: customerUuid || null,
      note: note || null,
    });
  } catch (error) {
    return fail(error, "تعذّر حفظ الحركة");
  }
  revalidateAll();
  redirect(`/?date=${fields.businessDate}&saved=${uuid}`);
};

export const deleteMovementAction = async (uuid: string): Promise<ActionResult> => {
  try {
    await deleteMovement(uuid);
  } catch (error) {
    return fail(error, "تعذّر حذف الحركة");
  }
  revalidateAll();
  return { success: true };
};
