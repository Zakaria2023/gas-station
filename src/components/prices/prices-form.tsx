"use client";

import { TriangleAlert } from "lucide-react";
import { ReactNode } from "react";
import { Controller } from "react-hook-form";
import { usePricesForm } from "@/app/prices/use-prices-form";
import { GROUP_LABELS, kindChipClass, KindIcon } from "@/components/movements/kind-style";
import { ActionBar } from "@/components/ui/action-bar";
import { Button } from "@/components/ui/button";
import { CylinderIcon } from "@/components/ui/cylinder-icon";
import { DateField } from "@/components/ui/date-field";
import { Input } from "@/components/ui/input";
import { Segmented } from "@/components/ui/segmented";
import { TYPE_TEXT } from "@/components/ui/type-badge";
import { CylinderType, cylinderTypes } from "@/db/enum";
import { CYLINDER_TYPE_LABELS, MOVEMENT_KIND_LABELS } from "@/db/label";
import { MOVEMENT_EFFECTS, movementGroups } from "@/lib/movement-rules";
import { PricedKind, pricedKinds } from "@/lib/pricing";
import { CURRENCY, formatMoney } from "@/utils/text";
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
const ROLE_HINTS: Partial<Record<PricedKind, string>> = {
  sell_full: "وبه تنحسب قيمة المليان بالمحل وديون المليان",
  sell_empty: "وبه تنحسب قيمة الفاضي بالمحل وديون الفاضي",
};

// The debts have no prices of their own, so their group has nothing to show.
const PRICED_GROUPS = movementGroups
  .map((group) => ({ group, kinds: pricedKinds.filter((kind) => MOVEMENT_EFFECTS[kind].group === group) }))
  .filter(({ kinds }) => kinds.length > 0);

export const PricesForm = ({ defaults, today, children }: PricesFormProps) => {
  const { form, state, isPending, onSubmit, shownType, setShownType, gaps } = usePricesForm(defaults);
  const {
    register,
    formState: { errors },
  } = form;

  return (
    <form onSubmit={onSubmit} noValidate>
      <div className="flex flex-col gap-4 px-4 pt-1 pb-40 lg:max-w-4xl lg:gap-5">
        <section className="rounded-card bg-surface p-4 shadow-card">
          <Controller
            control={form.control}
            name="effectiveFrom"
            render={({ field }) => (
              <DateField
                label="تسري الأسعار من"
                value={field.value}
                max={today}
                onChange={field.onChange}
                error={errors.effectiveFrom?.message}
                hint="الحركات من هذا اليوم وطالع بتاخد الأسعار الجديدة. الحركات القديمة بتضل على سعرها."
              />
            )}
          />
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
        {PRICED_GROUPS.map(({ group, kinds }) => (
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
              {kinds.map((kind) => {
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

        {gaps.length > 0 && (
          <div className="flex items-start gap-3 rounded-card bg-warning-tint p-4 text-warning">
            <TriangleAlert size={20} className="mt-0.5 shrink-0" />
            <div className="text-sm">
              <p className="font-bold">بيع مليان عادةً = بيع فاضي + تبديل</p>
              {gaps.map(({ cylinderType, sellFull, expected }) => (
                <p key={cylinderType} className="mt-1 tabular">
                  {CYLINDER_TYPE_LABELS[cylinderType]}: بيع مليان {formatMoney(sellFull)}، والمجموع{" "}
                  {formatMoney(expected)}. تأكد من الأسعار؛ المليان بالمحل بينحسب ببيع مليان.
                </p>
              ))}
            </div>
          </div>
        )}

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
