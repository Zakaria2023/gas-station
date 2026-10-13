"use client";

import { ReactNode } from "react";
import { usePricesForm } from "@/app/prices/use-prices-form";
import { GROUP_LABELS, kindChipClass, KindIcon } from "@/components/movements/kind-style";
import { Button } from "@/components/ui/button";
import { CylinderIcon } from "@/components/ui/cylinder-icon";
import { Field } from "@/components/ui/field";
import { FormError } from "@/components/ui/form-error";
import { Input } from "@/components/ui/input";
import { Segmented } from "@/components/ui/segmented";
import { CylinderType, cylinderTypes, MovementKind } from "@/db/enum";
import { CYLINDER_TYPE_LABELS, MOVEMENT_KIND_LABELS } from "@/db/label";
import { kindsInGroup, movementGroups } from "@/lib/movement-rules";
import { CURRENCY } from "@/utils/text";
import { PricesFormValues } from "@/validators/prices";

type PricesFormProps = {
  defaults: PricesFormValues;
  today: string;
  /** Shown under the prices, above the save bar: the history of changes. */
  children?: ReactNode;
};

const TYPE_SELECTED: Record<CylinderType, string> = {
  household: "bg-household text-white",
  industrial: "bg-industrial text-white",
};

// What each price is used for, beyond pricing its own movement.
const ROLE_HINTS: Partial<Record<MovementKind, string>> = {
  exchange: "وبه تنحسب قيمة المليان بالمحل",
  sell_empty: "وبه تنحسب قيمة الفاضي بالمحل",
  return_full: "إذا تركته فاضي: نفس سعر دين مليان",
  return_empty: "إذا تركته فاضي: نفس سعر دين فاضي",
};

export const PricesForm = ({ defaults, today, children }: PricesFormProps) => {
  const { form, state, isPending, onSubmit, shownType, setShownType } = usePricesForm(defaults);
  const {
    register,
    formState: { errors },
  } = form;

  return (
    <form onSubmit={onSubmit} noValidate>
      <div className="flex flex-col gap-4 px-4 pt-1 pb-40">
        <section className="rounded-card bg-surface p-4 shadow-card">
          <Field
            label="تسري الأسعار من"
            error={errors.effectiveFrom?.message}
            hint="الحركات من هذا اليوم وطالع بتاخد الأسعار الجديدة. الحركات القديمة بتضل على سعرها."
          >
            <Input type="date" max={today} {...register("effectiveFrom")} invalid={Boolean(errors.effectiveFrom)} />
          </Field>
        </section>

        <Segmented
          label="الصنف"
          size="lg"
          value={shownType}
          onChange={setShownType}
          options={cylinderTypes.map((type) => ({
            value: type,
            label: CYLINDER_TYPE_LABELS[type],
            icon: <CylinderIcon filled size={20} />,
            selectedClassName: TYPE_SELECTED[type],
          }))}
        />

        {movementGroups.map((group) => (
          <section key={group} className="rounded-card bg-surface shadow-card">
            <h2 className="px-4 pt-4 text-sm font-extrabold text-muted">{GROUP_LABELS[group]}</h2>
            <ul className="divide-y divide-hairline-soft">
              {kindsInGroup(group).map((kind) => {
                const error = errors[shownType]?.[kind]?.message;
                return (
                  <li key={`${shownType}-${kind}`} className="flex items-center gap-3 px-4 py-3">
                    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${kindChipClass(kind)}`}>
                      <KindIcon kind={kind} size={19} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[15px] font-bold text-ink">{MOVEMENT_KIND_LABELS[kind]}</span>
                      {error ? (
                        <span className="block text-xs text-danger">{error}</span>
                      ) : (
                        ROLE_HINTS[kind] && <span className="block text-xs text-faint">{ROLE_HINTS[kind]}</span>
                      )}
                    </span>
                    <span className="relative w-36 shrink-0">
                      <Input
                        {...register(`${shownType}.${kind}`)}
                        aria-label={`سعر ${MOVEMENT_KIND_LABELS[kind]} ${CYLINDER_TYPE_LABELS[shownType]}`}
                        inputMode="decimal"
                        placeholder="—"
                        invalid={Boolean(error)}
                        className="pe-11 text-lg font-bold tabular"
                      />
                      <span className="pointer-events-none absolute inset-y-0 end-3 flex items-center text-xs font-bold text-faint">
                        {CURRENCY}
                      </span>
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}

        {children}
      </div>

      <div className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t border-hairline bg-surface/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-xl flex-col gap-2 px-4 py-3">
          <FormError message={state.error} />
          <Button type="submit" size="lg" block disabled={isPending}>
            {isPending ? "جارٍ الحفظ…" : "حفظ الأسعار"}
          </Button>
        </div>
      </div>
    </form>
  );
};
