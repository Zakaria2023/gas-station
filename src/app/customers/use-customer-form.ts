"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { startTransition, useActionState } from "react";
import { useForm } from "react-hook-form";
import { ActionResult } from "@/utils";
import { customerFormSchema, CustomerFormValues } from "@/validators/customer";
import { createCustomerAction, deleteCustomerAction, updateCustomerAction } from "./actions";

type UseCustomerFormArgs = { mode: "add" } | { mode: "edit"; uuid: string; values: CustomerFormValues };

export const useCustomerForm = (args: UseCustomerFormArgs) => {
  const action =
    args.mode === "edit"
      ? (prevState: ActionResult, values: CustomerFormValues) => updateCustomerAction(args.uuid, prevState, values)
      : createCustomerAction;
  const [state, dispatch, isPending] = useActionState(action, {});
  const [deleteState, remove, isDeleting] = useActionState<ActionResult>(
    () => (args.mode === "edit" ? deleteCustomerAction(args.uuid) : Promise.resolve({})),
    {},
  );

  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: args.mode === "edit" ? args.values : { name: "", phone: "", notes: "" },
  });

  const onSubmit = form.handleSubmit((values) => {
    startTransition(() => {
      dispatch(values);
    });
  });

  const onDelete = () => {
    startTransition(() => {
      remove();
    });
  };

  return { form, state, isPending, onSubmit, onDelete, deleteState, isDeleting };
};
