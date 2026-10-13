"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { startTransition, useActionState, useState } from "react";
import { useForm } from "react-hook-form";
import { CylinderType } from "@/db/enum";
import { pricesFormSchema, PricesFormValues } from "@/validators/prices";
import { savePricesAction } from "./actions";

export const usePricesForm = (defaults: PricesFormValues) => {
  const [state, dispatch, isPending] = useActionState(savePricesAction, {});
  // Both types are in the form; one is shown at a time to keep the screen short.
  const [shownType, setShownType] = useState<CylinderType>("household");

  const form = useForm<PricesFormValues>({
    resolver: zodResolver(pricesFormSchema),
    defaultValues: defaults,
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

  return { form, state, isPending, onSubmit, shownType, setShownType };
};
