"use client";

import { usePasswordForm } from "@/app/account/password/use-password-form";
import { ActionBar } from "@/components/ui/action-bar";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { MIN_PASSWORD } from "@/validators/user";

export const PasswordForm = () => {
  const { form, state, isPending, onSubmit } = usePasswordForm();
  const {
    register,
    formState: { errors },
  } = form;

  return (
    <form onSubmit={onSubmit} noValidate>
      <div className="flex flex-col gap-4 px-4 pt-1 pb-40 lg:max-w-2xl">
        <section className="flex flex-col gap-4 rounded-card bg-surface p-4 shadow-card">
          <Field label="كلمة السر الحالية" htmlFor="current" error={errors.current?.message}>
            <Input
              id="current"
              type="password"
              {...register("current")}
              autoComplete="current-password"
              dir="ltr"
              className="text-end"
              invalid={Boolean(errors.current)}
              autoFocus
            />
          </Field>
          <Field
            label="كلمة السر الجديدة"
            htmlFor="next"
            error={errors.next?.message}
            hint={`${MIN_PASSWORD} أحرف أو أرقام على الأقل.`}
          >
            <Input
              id="next"
              type="password"
              {...register("next")}
              autoComplete="new-password"
              dir="ltr"
              className="text-end"
              invalid={Boolean(errors.next)}
            />
          </Field>
          <Field label="أعد كتابة الجديدة" htmlFor="confirm" error={errors.confirm?.message}>
            <Input
              id="confirm"
              type="password"
              {...register("confirm")}
              autoComplete="new-password"
              dir="ltr"
              className="text-end"
              invalid={Boolean(errors.confirm)}
            />
          </Field>
        </section>
      </div>

      <ActionBar error={state.error}>
        <Button type="submit" size="lg" block disabled={isPending}>
          {isPending ? "جارٍ الحفظ…" : "حفظ كلمة السر"}
        </Button>
      </ActionBar>
    </form>
  );
};
