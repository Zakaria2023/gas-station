"use client";

import { useAddForm } from "@/app/add/use-add-form";
import { ActionBar } from "@/components/ui/action-bar";
import { Button } from "@/components/ui/button";
import { CylinderIcon } from "@/components/ui/cylinder-icon";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { TYPE_DOT, TYPE_TEXT } from "@/components/ui/type-badge";
import { CylinderType, cylinderTypes } from "@/db/enum";
import { CYLINDER_TYPE_LABELS } from "@/db/label";
import { StockDelta } from "@/lib/movement-rules";
import { formatCount } from "@/utils/text";
import { AddFormValues } from "@/validators/day-entry";

type AddFormProps = {
  defaults: AddFormValues;
  /** The day's stock as it stands, before this addition. */
  stock: Record<CylinderType, StockDelta>;
};

/** إضافة: the full cylinders that came in, one number per type. */
export const AddForm = ({ defaults, stock }: AddFormProps) => {
  const { form, state, isPending, onSubmit, added, after, total } = useAddForm(defaults, stock);
  const {
    register,
    formState: { errors },
  } = form;

  return (
    <form onSubmit={onSubmit} noValidate>
      <div className="flex flex-col gap-4 px-4 pt-1 pb-40 lg:grid lg:max-w-5xl lg:grid-cols-2 lg:gap-5">
        <p className="px-1 text-sm text-muted lg:col-span-2">
          اكتب كم جرة مليانة وصلت لكل صنف. بتنضاف على المليان اللي بالمحل، وبتشوفها بصفحة البيع.
        </p>
        {cylinderTypes.map((type) => (
          <section key={type} className="rounded-card bg-surface p-4 shadow-card">
            <h2 className="mb-3 flex items-center gap-2 text-lg font-extrabold text-ink">
              <span className={`h-2.5 w-2.5 rounded-full ${TYPE_DOT[type]}`} />
              {CYLINDER_TYPE_LABELS[type]}
            </h2>
            <Field
              label="مليان وصل"
              error={errors[type]?.message}
              hint={`بالمحل الآن ${formatCount(stock[type].full)} مليان`}
            >
              <div className="relative">
                <CylinderIcon
                  filled
                  size={20}
                  className={`pointer-events-none absolute start-3 top-3.5 ${TYPE_TEXT[type]}`}
                />
                <Input
                  {...register(type)}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="0"
                  invalid={Boolean(errors[type])}
                  className="min-h-14 ps-10 text-2xl font-extrabold tabular"
                />
              </div>
            </Field>
            {added[type] > 0 && (
              <p className="mt-3 flex items-center justify-between rounded-control bg-stock-tint px-3 py-2.5 text-sm text-stock">
                <span>بعد الإضافة</span>
                <span className="font-extrabold tabular">{formatCount(after[type].full)} مليان</span>
              </p>
            )}
          </section>
        ))}
        <section className="rounded-card bg-surface p-4 shadow-card lg:col-span-2">
          <Field label="ملاحظة" error={errors.note?.message}>
            <Textarea rows={2} {...register("note")} placeholder="اختياري، مثلاً: سيارة المعمل" />
          </Field>
        </section>
      </div>

      <ActionBar error={state.error}>
        <Button type="submit" size="lg" block disabled={isPending}>
          {isPending ? "جارٍ الحفظ…" : total > 0 ? `حفظ الإضافة · ${formatCount(total)} جرة` : "حفظ الإضافة"}
        </Button>
      </ActionBar>
    </form>
  );
};
