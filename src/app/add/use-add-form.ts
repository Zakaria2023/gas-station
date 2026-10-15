"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { startTransition, useActionState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { CylinderType, cylinderTypes } from "@/db/enum";
import { applyToStock, StockDelta } from "@/lib/movement-rules";
import { addFormSchema, AddFormValues } from "@/validators/day-entry";
import { addStockAction } from "./actions";

const countOf = (value: string | undefined) => (/^\d+$/.test(value?.trim() ?? "") ? Number(value) : 0);

export const useAddForm = (defaults: AddFormValues, stock: Record<CylinderType, StockDelta>) => {
  const [state, dispatch, isPending] = useActionState(addStockAction, {});

  const form = useForm<AddFormValues>({
    resolver: zodResolver(addFormSchema),
    defaultValues: defaults,
  });

  const typed = useWatch({ control: form.control, name: ["household", "industrial"] });
  const added = Object.fromEntries(cylinderTypes.map((type, index) => [type, countOf(typed[index])])) as Record<
    CylinderType,
    number
  >;
  const after = Object.fromEntries(
    cylinderTypes.map((type) => [type, applyToStock(stock[type], "stock_in", added[type])]),
  ) as Record<CylinderType, StockDelta>;
  const total = cylinderTypes.reduce((sum, type) => sum + added[type], 0);

  const onSubmit = form.handleSubmit((values) => {
    startTransition(() => {
      dispatch(values);
    });
  });

  return { form, state, isPending, onSubmit, added, after, total };
};
