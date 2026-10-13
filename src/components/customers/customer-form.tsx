"use client";

import { Trash2 } from "lucide-react";
import { useState } from "react";
import { useCustomerForm } from "@/app/customers/use-customer-form";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { FormError } from "@/components/ui/form-error";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CustomerFormValues } from "@/validators/customer";

type CustomerFormProps = { mode: "add" } | { mode: "edit"; uuid: string; values: CustomerFormValues };

export const CustomerForm = (props: CustomerFormProps) => {
  const { form, state, isPending, onSubmit, onDelete, deleteState, isDeleting } = useCustomerForm(props);
  const [confirming, setConfirming] = useState(false);
  const {
    register,
    formState: { errors },
  } = form;

  return (
    <form onSubmit={onSubmit} noValidate>
      <div className="flex flex-col gap-4 px-4 pt-1 pb-40">
        <section className="flex flex-col gap-4 rounded-card bg-surface p-4 shadow-card">
          <Field label="الاسم" error={errors.name?.message} hint="الاسم والعائلة، حتى ما يتلخبط مع زبون ثاني.">
            <Input {...register("name")} invalid={Boolean(errors.name)} autoFocus={props.mode === "add"} />
          </Field>
          <Field label="رقم الهاتف" error={errors.phone?.message}>
            <Input
              {...register("phone")}
              type="tel"
              inputMode="tel"
              dir="ltr"
              className="text-end"
              invalid={Boolean(errors.phone)}
              placeholder="اختياري"
            />
          </Field>
          <Field label="ملاحظات" error={errors.notes?.message}>
            <Textarea rows={3} {...register("notes")} placeholder="اختياري" />
          </Field>
        </section>

        {props.mode === "edit" && (
          <section className="flex flex-col gap-2 rounded-card bg-surface p-4 shadow-card">
            <p className="text-sm text-muted">الحذف ممكن بس لزبون ما له أي حركة.</p>
            <FormError message={deleteState.error} />
            {confirming ? (
              <div className="flex gap-2">
                <Button variant="secondary" block onClick={() => setConfirming(false)}>
                  إلغاء
                </Button>
                <Button variant="danger" block onClick={onDelete} disabled={isDeleting} className="bg-danger! text-white!">
                  {isDeleting ? "جارٍ الحذف…" : "تأكيد الحذف"}
                </Button>
              </div>
            ) : (
              <Button variant="danger" block onClick={() => setConfirming(true)}>
                <Trash2 size={17} />
                حذف الزبون
              </Button>
            )}
          </section>
        )}
      </div>

      <div className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t border-hairline bg-surface/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-xl flex-col gap-2 px-4 py-3">
          <FormError message={state.error} />
          <Button type="submit" size="lg" block disabled={isPending}>
            {isPending ? "جارٍ الحفظ…" : props.mode === "edit" ? "حفظ التعديل" : "إضافة الزبون"}
          </Button>
        </div>
      </div>
    </form>
  );
};
