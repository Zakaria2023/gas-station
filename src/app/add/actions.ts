"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cylinderTypes } from "@/db/enum";
import { createDayMovements, requireUser } from "@/services";
import { ActionResult, fail } from "@/utils";
import { AddFormValues, addFormSchema } from "@/validators/day-entry";

export const addStockAction = async (_prevState: ActionResult, values: AddFormValues): Promise<ActionResult> => {
  await requireUser();
  const parsed = addFormSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "تحقق من الأرقام" };
  }
  const { businessDate, note } = parsed.data;
  const lines = cylinderTypes
    .filter((type) => Number(parsed.data[type]) > 0)
    .map((type) => ({ kind: "stock_in" as const, cylinderType: type, quantity: Number(parsed.data[type]), unitPrice: null }));
  let saved: string[];
  try {
    saved = await createDayMovements(businessDate, lines, note || null);
  } catch (error) {
    return fail(error, "تعذّر حفظ الإضافة");
  }
  revalidatePath("/", "layout");
  redirect(`/?date=${businessDate}&saved=${saved[0]}&done=add`);
};
