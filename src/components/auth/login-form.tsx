"use client";

import { LogIn } from "lucide-react";
import { useLoginForm } from "@/app/login/use-login-form";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { FormError } from "@/components/ui/form-error";
import { Input } from "@/components/ui/input";

export const LoginForm = () => {
  const { form, state, isPending, onSubmit } = useLoginForm();
  const {
    register,
    formState: { errors },
  } = form;

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <Field label="اسم المستخدم" htmlFor="username" error={errors.username?.message}>
        <Input
          id="username"
          {...register("username")}
          autoComplete="username"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          dir="ltr"
          className="text-end"
          invalid={Boolean(errors.username)}
          autoFocus
        />
      </Field>
      <Field label="كلمة السر" htmlFor="password" error={errors.password?.message}>
        <Input
          id="password"
          type="password"
          {...register("password")}
          autoComplete="current-password"
          dir="ltr"
          className="text-end"
          invalid={Boolean(errors.password)}
        />
      </Field>
      <FormError message={state.error} />
      <Button type="submit" size="lg" block disabled={isPending}>
        <LogIn size={20} />
        {isPending ? "جارٍ الدخول…" : "دخول"}
      </Button>
    </form>
  );
};
