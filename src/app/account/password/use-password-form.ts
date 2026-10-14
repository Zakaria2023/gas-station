"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { startTransition, useActionState } from "react";
import { useForm } from "react-hook-form";
import { passwordFormSchema, PasswordFormValues } from "@/validators/user";
import { changePasswordAction } from "./actions";

export const usePasswordForm = () => {
  const [state, dispatch, isPending] = useActionState(changePasswordAction, {});

  const form = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: { current: "", next: "", confirm: "" },
  });

  const onSubmit = form.handleSubmit((values) => {
    startTransition(() => {
      dispatch(values);
    });
  });

  return { form, state, isPending, onSubmit };
};
