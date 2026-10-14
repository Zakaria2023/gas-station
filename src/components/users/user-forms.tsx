"use client";

import { KeyRound, LogOut, ShieldCheck, UserRound } from "lucide-react";
import { Controller } from "react-hook-form";
import { useEditUserForm, useNewUserForm, useUserAccess } from "@/app/users/use-user-form";
import { ActionBar } from "@/components/ui/action-bar";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { FormError } from "@/components/ui/form-error";
import { Input } from "@/components/ui/input";
import { Segmented } from "@/components/ui/segmented";
import { userRoles } from "@/db/enum";
import { USER_ROLE_LABELS } from "@/db/label";
import { EditUserFormValues, MIN_PASSWORD } from "@/validators/user";

const ROLE_OPTIONS = userRoles.map((role) => ({
  value: role,
  label: USER_ROLE_LABELS[role],
  icon: role === "admin" ? <ShieldCheck size={18} /> : <UserRound size={18} />,
}));

const ROLE_HINT = "المدير بيضيف المستخدمين وبيغيّر كلماتهم. الموظف بيشتغل بكل شي غير هيك.";

/** A password typed by an admin for someone else: shown as typed, so it can be told to them. */
const TEMP_PASSWORD_HINT = `${MIN_PASSWORD} أحرف على الأقل. بيغيّرها هو أول ما يدخل.`;

export const NewUserForm = () => {
  const { form, state, isPending, onSubmit } = useNewUserForm();
  const {
    control,
    register,
    formState: { errors },
  } = form;

  return (
    <form onSubmit={onSubmit} noValidate>
      <div className="flex flex-col gap-4 px-4 pt-1 pb-40 lg:max-w-2xl">
        <section className="flex flex-col gap-4 rounded-card bg-surface p-4 shadow-card">
          <Field label="الاسم" htmlFor="name" error={errors.name?.message}>
            <Input id="name" {...register("name")} invalid={Boolean(errors.name)} autoFocus />
          </Field>
          <Field
            label="اسم المستخدم"
            htmlFor="username"
            error={errors.username?.message}
            hint="بالإنجليزي، للدخول. مثل: ahmad"
          >
            <Input
              id="username"
              {...register("username")}
              autoComplete="off"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              dir="ltr"
              className="text-end"
              invalid={Boolean(errors.username)}
            />
          </Field>
          <Field label="كلمة السر" htmlFor="password" error={errors.password?.message} hint={TEMP_PASSWORD_HINT}>
            <Input
              id="password"
              {...register("password")}
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              dir="ltr"
              className="text-end"
              invalid={Boolean(errors.password)}
            />
          </Field>
          <Field label="الدور" hint={ROLE_HINT}>
            <Controller
              control={control}
              name="role"
              render={({ field }) => (
                <Segmented label="الدور" value={field.value} onChange={field.onChange} options={ROLE_OPTIONS} />
              )}
            />
          </Field>
        </section>
      </div>

      <ActionBar error={state.error}>
        <Button type="submit" size="lg" block disabled={isPending}>
          {isPending ? "جارٍ الحفظ…" : "إضافة المستخدم"}
        </Button>
      </ActionBar>
    </form>
  );
};

type EditUserFormProps = {
  uuid: string;
  username: string;
  values: EditUserFormValues;
  isSelf: boolean;
};

export const EditUserForm = ({ uuid, username, values, isSelf }: EditUserFormProps) => {
  const { form, state, isPending, onSubmit } = useEditUserForm(uuid, values);
  const {
    control,
    register,
    formState: { errors },
  } = form;

  return (
    <form onSubmit={onSubmit} noValidate>
      <section className="flex flex-col gap-4 rounded-card bg-surface p-4 shadow-card">
        <Field label="الاسم" htmlFor="name" error={errors.name?.message}>
          <Input id="name" {...register("name")} invalid={Boolean(errors.name)} />
        </Field>
        <Field label="اسم المستخدم" hint="ما بيتغيّر.">
          <Input value={username} readOnly disabled dir="ltr" className="text-end" />
        </Field>
        <Field label="الدور" hint={ROLE_HINT}>
          <Controller
            control={control}
            name="role"
            render={({ field }) => (
              <Segmented label="الدور" value={field.value} onChange={field.onChange} options={ROLE_OPTIONS} />
            )}
          />
        </Field>
        {!isSelf && (
          <Field label="الحساب" hint="الموقوف ما بيقدر يدخل، وبيطلع من كل الأجهزة. حركاته بتضل.">
            <Controller
              control={control}
              name="active"
              render={({ field }) => (
                <Segmented
                  label="الحساب"
                  value={field.value ? "on" : "off"}
                  onChange={(next) => field.onChange(next === "on")}
                  options={[
                    { value: "on", label: "فعّال" },
                    { value: "off", label: "موقوف", selectedClassName: "bg-danger text-white" },
                  ]}
                />
              )}
            />
          </Field>
        )}
      </section>

      <ActionBar error={state.error}>
        <Button type="submit" size="lg" block disabled={isPending}>
          {isPending ? "جارٍ الحفظ…" : "حفظ التعديل"}
        </Button>
      </ActionBar>
    </form>
  );
};

/** Set a new password for someone else, or sign them out of every phone. */
export const UserAccess = ({ uuid }: { uuid: string }) => {
  const access = useUserAccess(uuid);
  const {
    register,
    formState: { errors },
  } = access.resetForm;

  return (
    <section className="flex flex-col gap-4 rounded-card bg-surface p-4 shadow-card">
      <form onSubmit={access.onReset} noValidate className="flex flex-col gap-2">
        <Field label="كلمة سر جديدة" htmlFor="reset" error={errors.password?.message} hint={TEMP_PASSWORD_HINT}>
          <Input
            id="reset"
            {...register("password")}
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            dir="ltr"
            className="text-end"
            invalid={Boolean(errors.password)}
          />
        </Field>
        <FormError message={access.resetState.error} />
        {access.resetState.success && (
          <p className="text-sm font-semibold text-success">تغيّرت كلمة السر، وطلع من كل الأجهزة.</p>
        )}
        <Button type="submit" variant="secondary" disabled={access.isResetting}>
          <KeyRound size={18} />
          {access.isResetting ? "جارٍ الحفظ…" : "تعيين كلمة السر"}
        </Button>
      </form>
      <div className="flex flex-col gap-2">
        <p className="text-sm text-muted">إذا ضاع موبايله: بيطلع من كل الأجهزة وبيرجع يدخل بكلمة السر.</p>
        <FormError message={access.signOutState.error} />
        {access.signOutState.success && <p className="text-sm font-semibold text-success">طلع من كل الأجهزة.</p>}
        <Button variant="danger" onClick={access.onSignOut} disabled={access.isSigningOut}>
          <LogOut size={18} />
          {access.isSigningOut ? "جارٍ…" : "تسجيل الخروج من كل الأجهزة"}
        </Button>
      </div>
    </section>
  );
};
