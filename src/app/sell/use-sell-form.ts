"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { startTransition, useActionState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { CylinderType, cylinderTypes } from "@/db/enum";
import { applyAll, StockDelta } from "@/lib/movement-rules";
import { amountOf, PricedKind, pricedKinds, PriceList, priceFor, roundMoney } from "@/lib/pricing";
import { sellFormSchema, SellFormValues } from "@/validators/day-entry";
import { sellAction } from "./actions";

const countOf = (value: string | undefined) => (/^\d+$/.test(value?.trim() ?? "") ? Number(value) : 0);

export type SoldType = {
  quantities: Record<PricedKind, number>;
  amounts: Record<PricedKind, number>;
  /** The stock once these are sold; below zero means more sold than there is. */
  after: StockDelta;
  short: boolean;
  total: number;
};

export const useSellForm = (defaults: SellFormValues, stock: Record<CylinderType, StockDelta>, prices: PriceList) => {
  const [state, dispatch, isPending] = useActionState(sellAction, {});

  const form = useForm<SellFormValues>({
    resolver: zodResolver(sellFormSchema),
    defaultValues: defaults,
  });

  const typed = useWatch({ control: form.control, name: ["household", "industrial"] });
  const sold = Object.fromEntries(
    cylinderTypes.map((type, index) => {
      const quantities = Object.fromEntries(
        pricedKinds.map((kind) => [kind, countOf(typed[index]?.[kind])]),
      ) as Record<PricedKind, number>;
      const amounts = Object.fromEntries(
        pricedKinds.map((kind) => [kind, amountOf(quantities[kind], priceFor(prices, type, kind))]),
      ) as Record<PricedKind, number>;
      const after = applyAll(
        stock[type],
        pricedKinds.map((kind) => ({ kind, quantity: quantities[kind] })),
      );
      const total = roundMoney(pricedKinds.reduce((sum, kind) => sum + amounts[kind], 0));
      return [type, { quantities, amounts, after, short: after.full < 0 || after.empty < 0, total }];
    }),
  ) as Record<CylinderType, SoldType>;

  const total = roundMoney(cylinderTypes.reduce((sum, type) => sum + sold[type].total, 0));
  const count = cylinderTypes.reduce(
    (sum, type) => sum + pricedKinds.reduce((inner, kind) => inner + sold[type].quantities[kind], 0),
    0,
  );
  const short = cylinderTypes.some((type) => sold[type].short);

  const onSubmit = form.handleSubmit((values) => {
    startTransition(() => {
      dispatch(values);
    });
  });

  return { form, state, isPending, onSubmit, sold, total, count, short };
};
