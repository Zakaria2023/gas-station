"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { startTransition, useActionState } from "react";
import { useForm } from "react-hook-form";
import { CylinderType } from "@/db/enum";
import { countFormSchema, CountFormValues } from "@/validators/count";
import { deleteCountAction, saveCountAction } from "./actions";

export const useCountForm = (defaults: CountFormValues) => {
  const [state, dispatch, isPending] = useActionState(saveCountAction, {});
  const [removeState, remove, isRemoving] = useActionState(
    (_prev: { error?: string }, cylinderType: CylinderType) => deleteCountAction(cylinderType, defaults.countedOn),
    {},
  );

  const form = useForm<CountFormValues>({
    resolver: zodResolver(countFormSchema),
    defaultValues: defaults,
  });

  const onSubmit = form.handleSubmit((values) => {
    startTransition(() => {
      dispatch(values);
    });
  });

  const onRemove = (cylinderType: CylinderType) => {
    form.setValue(`${cylinderType}.full`, "");
    form.setValue(`${cylinderType}.empty`, "");
    startTransition(() => {
      remove(cylinderType);
    });
  };

  return { form, state, isPending, onSubmit, onRemove, removeState, isRemoving };
};
