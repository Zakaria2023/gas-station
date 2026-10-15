"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { startTransition, useActionState, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { CylinderType, cylinderTypes } from "@/db/enum";
import { roundMoney } from "@/lib/pricing";
import { pricesFormSchema, PricesFormValues } from "@/validators/prices";
import { savePricesAction } from "./actions";

const priceOf = (value: string | undefined): number | null =>
  /^\d{1,12}(\.\d{1,2})?$/.test(value?.trim() ?? "") ? Number(value) : null;

/** A type whose بيع مليان is not بيع فاضي + تبديل, with what it would be. */
export type FullPriceGap = { cylinderType: CylinderType; sellFull: number; expected: number };

export const usePricesForm = (defaults: PricesFormValues) => {
  const [state, dispatch, isPending] = useActionState(savePricesAction, {});
  // Both types are in the form; one is shown at a time to keep the screen short.
  const [shownType, setShownType] = useState<CylinderType>("household");

  const form = useForm<PricesFormValues>({
    resolver: zodResolver(pricesFormSchema),
    defaultValues: defaults,
  });

  // A full is the empty cylinder plus its gas: بيع مليان = بيع فاضي + تبديل.
  // Only a warning, since the shop may round or discount.
  const typed = useWatch({ control: form.control, name: ["household", "industrial"] });
  const gaps: FullPriceGap[] = cylinderTypes.flatMap((cylinderType, index) => {
    const exchange = priceOf(typed[index]?.exchange);
    const sellFull = priceOf(typed[index]?.sell_full);
    const sellEmpty = priceOf(typed[index]?.sell_empty);
    if (exchange === null || sellFull === null || sellEmpty === null) {
      return [];
    }
    const expected = roundMoney(sellEmpty + exchange);
    return sellFull === expected ? [] : [{ cylinderType, sellFull, expected }];
  });

  const onSubmit = form.handleSubmit(
    (values) => {
      startTransition(() => {
        dispatch(values);
      });
    },
    (errors) => {
      // An error on the hidden type would be invisible; show that type.
      if (!errors[shownType] && (errors.household || errors.industrial)) {
        setShownType(errors.household ? "household" : "industrial");
      }
    },
  );

  return { form, state, isPending, onSubmit, shownType, setShownType, gaps };
};
