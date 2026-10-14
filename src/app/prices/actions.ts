"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cylinderTypes } from "@/db/enum";
import { pricedKinds } from "@/lib/pricing";
import { PriceEntry, requireUser, savePrices } from "@/services";
import { ActionResult, fail } from "@/utils";
import { PricesFormValues, pricesFormSchema } from "@/validators/prices";

export const savePricesAction = async (
  _prevState: ActionResult,
  values: PricesFormValues,
): Promise<ActionResult> => {
  await requireUser();
  const parsed = pricesFormSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "تحقق من الأسعار" };
  }
  const entries: PriceEntry[] = cylinderTypes.flatMap((cylinderType) =>
    pricedKinds.map((kind) => {
      const typed = parsed.data[cylinderType][kind];
      return { cylinderType, kind, price: typed === "" ? null : Number(typed) };
    }),
  );
  let changed: number;
  try {
    changed = await savePrices(parsed.data.effectiveFrom, entries);
  } catch (error) {
    return fail(error, "تعذّر حفظ الأسعار");
  }
  // A price change revalues the stock on every day from then on.
  revalidatePath("/", "layout");
  redirect(`/prices?saved=${changed}`);
};
