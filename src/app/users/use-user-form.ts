"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { startTransition, useActionState } from "react";
import { useForm } from "react-hook-form";
import { ActionResult } from "@/utils";
import {
  EditUserFormValues,
  editUserFormSchema,
  NewUserFormValues,
  newUserFormSchema,
  ResetPasswordFormValues,
  resetPasswordFormSchema,
} from "@/validators/user";
import { createUserAction, resetPasswordAction, signOutUserAction, updateUserAction } from "./actions";

export const useNewUserForm = () => {
  const [state, dispatch, isPending] = useActionState(createUserAction, {});
  const form = useForm<NewUserFormValues>({
    resolver: zodResolver(newUserFormSchema),
    defaultValues: { name: "", username: "", password: "", role: "staff" },
  });
  const onSubmit = form.handleSubmit((values) => {
    startTransition(() => {
      dispatch(values);
    });
  });
  return { form, state, isPending, onSubmit };
};

export const useEditUserForm = (uuid: string, values: EditUserFormValues) => {
  const [state, dispatch, isPending] = useActionState(
    (prevState: ActionResult, next: EditUserFormValues) => updateUserAction(uuid, prevState, next),
    {},
  );
  const form = useForm<EditUserFormValues>({
    resolver: zodResolver(editUserFormSchema),
    defaultValues: values,
  });
  const onSubmit = form.handleSubmit((next) => {
    startTransition(() => {
      dispatch(next);
    });
  });
  return { form, state, isPending, onSubmit };
};

/** Setting someone's password, and signing them out everywhere: two small forms on the user's page. */
export const useUserAccess = (uuid: string) => {
  const [resetState, dispatchReset, isResetting] = useActionState(
    (prevState: ActionResult, values: ResetPasswordFormValues) => resetPasswordAction(uuid, prevState, values),
    {},
  );
  const [signOutState, signOut, isSigningOut] = useActionState<ActionResult>(() => signOutUserAction(uuid), {});

  const resetForm = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordFormSchema),
    defaultValues: { password: "" },
  });
  const onReset = resetForm.handleSubmit((values) => {
    startTransition(() => {
      dispatchReset(values);
    });
    resetForm.reset();
  });
  const onSignOut = () => {
    startTransition(() => {
      signOut();
    });
  };

  return { resetForm, resetState, isResetting, onReset, signOutState, isSigningOut, onSignOut };
};
