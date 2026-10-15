"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cylinderTypes } from "@/db/enum";
import { CYLINDER_STATE_LABELS, CYLINDER_TYPE_LABELS } from "@/db/label";
import { applyAll } from "@/lib/movement-rules";
import { pricedKinds, priceFor } from "@/lib/pricing";
import { createDayMovements, DayLine, getDayStock, getPriceList, requireUser } from "@/services";
import { ActionResult, fail, formatCount } from "@/utils";
import { SellFormValues, sellFormSchema } from "@/validators/day-entry";

export const sellAction = async (_prevState: ActionResult, values: SellFormValues): Promise<ActionResult> => {
  await requireUser();
  const parsed = sellFormSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "تحقق من الأرقام" };
  }
  const { businessDate, note } = parsed.data;
  let saved: string[];
  try {
    // The prices and the stock are read again here: the page may have been open a while.
    const [stock, prices] = await Promise.all([getDayStock(businessDate), getPriceList(businessDate)]);
    const lines: DayLine[] = [];
    for (const type of cylinderTypes) {
      const sold = pricedKinds
        .filter((kind) => Number(parsed.data[type][kind]) > 0)
        .map((kind) => ({
          kind,
          cylinderType: type,
          quantity: Number(parsed.data[type][kind]),
          unitPrice: priceFor(prices, type, kind),
        }));
      // Nothing is sold that is not in the shop.
      const after = applyAll(stock[type].closing, sold);
      for (const state of ["full", "empty"] as const) {
        if (sold.length > 0 && after[state] < 0) {
          const what = `${CYLINDER_TYPE_LABELS[type]} ${CYLINDER_STATE_LABELS[state]}`;
          return { error: `المتوفر من ${what} ${formatCount(stock[type].closing[state])} فقط` };
        }
      }
      lines.push(...sold);
    }
    saved = await createDayMovements(businessDate, lines, note || null);
  } catch (error) {
    return fail(error, "تعذّر حفظ البيع");
  }
  revalidatePath("/", "layout");
  redirect(`/?date=${businessDate}&saved=${saved[0]}&done=sell`);
};
