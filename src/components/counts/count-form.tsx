"use client";

import { Trash2 } from "lucide-react";
import { useCountForm } from "@/app/counts/use-count-form";
import { Button } from "@/components/ui/button";
import { CylinderIcon } from "@/components/ui/cylinder-icon";
import { Field } from "@/components/ui/field";
import { FormError } from "@/components/ui/form-error";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { TYPE_DOT, TYPE_TEXT } from "@/components/ui/type-badge";
import { CylinderType, cylinderTypes } from "@/db/enum";
import { CYLINDER_STATE_LABELS, CYLINDER_TYPE_LABELS } from "@/db/label";
import { StockDelta } from "@/lib/movement-rules";
import { formatCount } from "@/utils/text";
import { CountFormValues } from "@/validators/count";

type CountFormProps = {
  defaults: CountFormValues;
  /** What the movements say the day opened with, before any count. */
  expected: Record<CylinderType, StockDelta>;
  counted: Record<CylinderType, boolean>;
};

export const CountForm = ({ defaults, expected, counted }: CountFormProps) => {
  const { form, state, isPending, onSubmit, onRemove, removeState, isRemoving } = useCountForm(defaults);
  const {
    register,
    formState: { errors },
  } = form;

  return (
    <form onSubmit={onSubmit} noValidate>
      <div className="flex flex-col gap-4 px-4 pt-1 pb-40">
        <p className="px-1 text-sm text-muted">
          اكتب اللي عندك فعلاً بالمحل أول هذا اليوم. الأرقام الرمادية هي المتوقع حسب الحركات. اترك الصنف فاضي إذا ما جردته.
        </p>
        {cylinderTypes.map((type) => (
          <section key={type} className="rounded-card bg-surface p-4 shadow-card">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="flex items-center gap-2 text-lg font-extrabold text-ink">
                <span className={`h-2.5 w-2.5 rounded-full ${TYPE_DOT[type]}`} />
                {CYLINDER_TYPE_LABELS[type]}
              </h2>
              {counted[type] && (
                <Button variant="ghost" onClick={() => onRemove(type)} disabled={isRemoving} className="text-danger!">
                  <Trash2 size={16} />
                  حذف الجرد
                </Button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              {(["full", "empty"] as const).map((state) => (
                <Field
                  key={state}
                  label={CYLINDER_STATE_LABELS[state]}
                  error={errors[type]?.[state]?.message}
                  hint={`المتوقع ${formatCount(expected[type][state])}`}
                >
                  <div className="relative">
                    <CylinderIcon
                      filled={state === "full"}
                      size={20}
                      className={`pointer-events-none absolute start-3 top-3.5 ${TYPE_TEXT[type]}`}
                    />
                    <Input
                      {...register(`${type}.${state}`)}
                      inputMode="numeric"
                      pattern="[0-9]*"
                      // A grey 0 reads like a typed 0; the hint below already says it.
                      placeholder={expected[type][state] ? String(expected[type][state]) : undefined}
                      invalid={Boolean(errors[type]?.[state])}
                      className="min-h-14 ps-10 text-2xl font-extrabold tabular"
                    />
                  </div>
                </Field>
              ))}
            </div>
          </section>
        ))}
        <section className="rounded-card bg-surface p-4 shadow-card">
          <Field label="ملاحظة" error={errors.note?.message}>
            <Textarea rows={2} {...register("note")} placeholder="اختياري، مثلاً: وصلت سيارة المعمل" />
          </Field>
        </section>
        <FormError message={removeState.error} />
      </div>

      <div className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t border-hairline bg-surface/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-xl flex-col gap-2 px-4 py-3">
          <FormError message={state.error} />
          <Button type="submit" size="lg" block disabled={isPending}>
            {isPending ? "جارٍ الحفظ…" : "حفظ الجرد"}
          </Button>
        </div>
      </div>
    </form>
  );
};
