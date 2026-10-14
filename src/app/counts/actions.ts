"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cylinderTypes, CylinderType } from "@/db/enum";
import { deleteCount, requireUser, saveCount } from "@/services";
import { ActionResult, fail, isIsoDate } from "@/utils";
import { CountFormValues, countFormSchema } from "@/validators/count";

export const saveCountAction = async (
  _prevState: ActionResult,
  values: CountFormValues,
): Promise<ActionResult> => {
  await requireUser();
  const parsed = countFormSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "تحقق من الأرقام" };
  }
  const { countedOn, note } = parsed.data;
  try {
    for (const cylinderType of cylinderTypes) {
      const { full, empty } = parsed.data[cylinderType];
      // A type left blank was not counted this time.
      if (full === "" && empty === "") {
        continue;
      }
      await saveCount({
        cylinderType,
        countedOn,
        full: Number(full),
        empty: Number(empty),
        note: note || null,
      });
    }
  } catch (error) {
    return fail(error, "تعذّر حفظ الجرد");
  }
  revalidatePath("/", "layout");
  redirect(`/?date=${countedOn}`);
};

export const deleteCountAction = async (
  cylinderType: CylinderType,
  date: string,
): Promise<ActionResult> => {
  await requireUser();
  if (!isIsoDate(date)) {
    return { error: "التاريخ غير صحيح" };
  }
  try {
    await deleteCount(cylinderType, date);
  } catch (error) {
    return fail(error, "تعذّر حذف الجرد");
  }
  revalidatePath("/", "layout");
  return { success: true };
};
