"use client";

import { ReactNode } from "react";
import { usePricesForm } from "@/app/prices/use-prices-form";
import { GROUP_LABELS, kindChipClass, KindIcon } from "@/components/movements/kind-style";
import { ActionBar } from "@/components/ui/action-bar";
import { Button } from "@/components/ui/button";
import { CylinderIcon } from "@/components/ui/cylinder-icon";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Segmented } from "@/components/ui/segmented";
import { TYPE_TEXT } from "@/components/ui/type-badge";
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
      <div className="flex flex-col gap-4 px-4 pt-1 pb-40 lg:max-w-4xl lg:gap-5">
        <section className="rounded-card bg-surface p-4 shadow-card">
          <Field
            label="تسري الأسعار من"
            error={errors.effectiveFrom?.message}
            hint="الحركات من هذا اليوم وطالع بتاخد الأسعار الجديدة. الحركات القديمة بتضل على سعرها."
          >
            <Input type="date" max={today} {...register("effectiveFrom")} invalid={Boolean(errors.effectiveFrom)} />
          </Field>
        </section>

        <div className="lg:hidden">
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
        </div>

        {/* Phone: one type at a time, picked above. Desktop: both types side by side in columns. */}
        {movementGroups.map((group) => (
          <section key={group} className="rounded-card bg-surface shadow-card">
            <div className="flex items-center gap-3 px-4 pt-4">
              <h2 className="flex-1 text-sm font-extrabold text-muted">{GROUP_LABELS[group]}</h2>
              {cylinderTypes.map((type) => (
                <span key={type} className={`hidden w-40 text-center text-xs font-extrabold lg:block ${TYPE_TEXT[type]}`}>
                  {CYLINDER_TYPE_LABELS[type]}
                </span>
              ))}
            </div>
            <ul className="divide-y divide-hairline-soft">
              {kindsInGroup(group).map((kind) => {
                const error = errors[shownType]?.[kind]?.message ?? errors.household?.[kind]?.message ?? errors.industrial?.[kind]?.message;
                return (
                  <li key={kind} className="flex items-center gap-3 px-4 py-3">
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
                    {cylinderTypes.map((type) => (
                      <span
                        key={type}
                        className={`relative w-36 shrink-0 lg:block lg:w-40 ${type === shownType ? "" : "hidden"}`}
                      >
                        <Input
                          {...register(`${type}.${kind}`)}
                          aria-label={`سعر ${MOVEMENT_KIND_LABELS[kind]} ${CYLINDER_TYPE_LABELS[type]}`}
                          inputMode="decimal"
                          placeholder="—"
                          invalid={Boolean(errors[type]?.[kind])}
                          className="pe-11 text-lg font-bold tabular"
                        />
                        <span className="pointer-events-none absolute inset-y-0 end-3 flex items-center text-xs font-bold text-faint">
                          {CURRENCY}
                        </span>
                      </span>
                    ))}
                  </li>
                );
              })}
            </ul>
          </section>
        ))}

        {children}
      </div>

      <ActionBar error={state.error}>
        <Button type="submit" size="lg" block disabled={isPending}>
          {isPending ? "جارٍ الحفظ…" : "حفظ الأسعار"}
        </Button>
      </ActionBar>
    </form>
  );
};
