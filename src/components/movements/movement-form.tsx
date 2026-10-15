"use client";

import { ArrowLeft, Banknote, CalendarDays, ChevronDown } from "lucide-react";
import Link from "next/link";
import { Controller } from "react-hook-form";
import { CustomerOption } from "@/app/movements/use-customer-picker";
import { useMovementForm } from "@/app/movements/use-movement-form";
import { ActionBar } from "@/components/ui/action-bar";
import { Button } from "@/components/ui/button";
import { CylinderIcon } from "@/components/ui/cylinder-icon";
import { DateField } from "@/components/ui/date-field";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Segmented } from "@/components/ui/segmented";
import { Stepper } from "@/components/ui/stepper";
import { Textarea } from "@/components/ui/textarea";
import { CylinderState, CylinderType, cylinderTypes } from "@/db/enum";
import { CYLINDER_STATE_LABELS, CYLINDER_TYPE_LABELS, MOVEMENT_KIND_LABELS } from "@/db/label";
import { movesMoney, StockDelta } from "@/lib/movement-rules";
import { PriceList } from "@/lib/pricing";
import { CURRENCY, formatCount, formatMoney, priceInputValue } from "@/utils/text";
import { MAX_QUANTITY, MovementFormValues } from "@/validators/movement";
import { CustomerPicker } from "./customer-picker";
import { KindPicker } from "./kind-picker";

type MovementFormProps = {
  defaults: MovementFormValues;
  customers: CustomerOption[];
  stock: Record<CylinderType, StockDelta>;
  stockDate: string;
  today: string;
  prices: PriceList;
};

const QUICK_AMOUNTS = [5, 10, 20, 50];

const TYPE_SELECTED: Record<CylinderType, string> = {
  household: "bg-household text-white",
  industrial: "bg-industrial text-white",
};

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="flex flex-col gap-2">
    <h2 className="px-1 text-sm font-extrabold text-muted">{title}</h2>
    {children}
  </section>
);

const PreviewValue = ({ state, before, after }: { state: CylinderState; before: number; after: number }) => (
  <div className="flex items-center gap-2">
    <CylinderIcon filled={state === "full"} size={18} className="text-muted" />
    <span className="text-sm text-muted">{CYLINDER_STATE_LABELS[state]}</span>
    <span className="text-base text-muted tabular">{formatCount(before)}</span>
    {/* Right to left, so "becomes" points left. */}
    <ArrowLeft size={15} className="text-faint" />
    <span
      className={`text-lg font-extrabold tabular ${
        after < 0 ? "text-danger" : after === before ? "text-muted" : "text-ink"
      }`}
    >
      {formatCount(after)}
    </span>
  </div>
);

export const MovementForm = ({ defaults, customers, stock, stockDate, today, prices }: MovementFormProps) => {
  const movement = useMovementForm({ defaults, customers, stock, stockDate, prices });
  const {
    form: {
      control,
      register,
      setValue,
      formState: { errors },
    },
  } = movement;

  const { overOwed, cash } = movement;

  return (
    <form onSubmit={movement.onSubmit} noValidate>
      {/* Desktop: what it is on one side, who, how many and for how much on the other. */}
      <div className="flex flex-col gap-6 px-4 pt-1 pb-44 lg:grid lg:grid-cols-2 lg:items-start lg:gap-8 lg:pb-32">
        <div className="flex flex-col gap-6">
          <Section title="الصنف">
            {cash ? (
              // Same height as the type switch, so the tiles below do not jump under the finger.
              <p className="flex min-h-14 items-center gap-2 rounded-control bg-hairline-soft px-4 text-sm text-muted">
                <Banknote size={20} className="shrink-0" />
                المصاري ما إلها صنف: بس المبلغ.
              </p>
            ) : (
              <Controller
                control={control}
                name="cylinderType"
                render={({ field }) => (
                  <Segmented
                    label="الصنف"
                    size="lg"
                    value={field.value}
                    onChange={(next) => movement.choose({ cylinderType: next })}
                    options={cylinderTypes.map((type) => ({
                      value: type,
                      label: CYLINDER_TYPE_LABELS[type],
                      icon: <CylinderIcon filled size={20} />,
                      selectedClassName: TYPE_SELECTED[type],
                    }))}
                  />
                )}
              />
            )}
          </Section>

          <Section title="نوع الحركة">
            <Controller
              control={control}
              name="kind"
              render={({ field }) => <KindPicker value={field.value} onChange={(next) => movement.choose({ kind: next })} />}
            />
          </Section>
        </div>

        <div className="flex flex-col gap-6">

          {movement.withCustomer && (
            <Section title="الزبون">
              <Controller
                control={control}
                name="customerUuid"
                render={({ field }) => (
                  <CustomerPicker
                    customers={customers}
                    value={field.value}
                    onChange={field.onChange}
                    owedBucket={movement.owedBucket}
                    invalid={Boolean(errors.customerUuid)}
                  />
                )}
              />
              {errors.customerUuid && <p className="px-1 text-sm text-danger">{errors.customerUuid.message}</p>}
            </Section>
          )}

          {!cash && (
            <Section title="العدد">
              <Controller
                control={control}
                name="quantity"
                render={({ field }) => (
                  <Stepper
                    label="العدد"
                    value={field.value}
                    onChange={field.onChange}
                    max={MAX_QUANTITY}
                    invalid={Boolean(errors.quantity) || overOwed}
                  />
                )}
              />
              <div className="grid grid-cols-4 gap-2">
                {QUICK_AMOUNTS.map((amount) => (
                  <button
                    key={amount}
                    type="button"
                    onClick={() => setValue("quantity", amount, { shouldValidate: true })}
                    className={`min-h-11 rounded-control text-base font-bold tabular transition active:scale-95 ${
                      movement.quantity === amount
                        ? "bg-primary-tint text-primary ring-2 ring-primary/30"
                        : "bg-surface text-ink shadow-card"
                    }`}
                  >
                    {amount}
                  </button>
                ))}
              </div>
              {errors.quantity && <p className="px-1 text-sm text-danger">{errors.quantity.message}</p>}
              {movement.owed !== null && movement.owedBucket && movement.owedBucket !== "cash" && (
                <p className={`px-1 text-sm font-semibold ${overOwed ? "text-danger" : "text-muted"}`}>
                  {movement.owed > 0
                    ? `عليه ${formatCount(movement.owed)} ${CYLINDER_TYPE_LABELS[movement.cylinderType]} ${
                        CYLINDER_STATE_LABELS[movement.owedBucket.state]
                      }${overOwed ? " فقط" : ""}`
                    : "هذا الزبون ما عليه من هذا الصنف"}
                </p>
              )}
            </Section>
          )}

          {movesMoney(movement.kind) && (
            <Section title={cash ? "المبلغ" : "سعر الواحدة"}>
              <div className="relative">
                <Input
                  {...register("unitPrice")}
                  inputMode="decimal"
                  placeholder={cash ? "0" : "بدون سعر"}
                  invalid={Boolean(errors.unitPrice) || (cash && overOwed)}
                  className="min-h-14 pe-14 text-2xl font-extrabold tabular"
                />
                <span className="pointer-events-none absolute inset-y-0 end-4 flex items-center text-base font-bold text-muted">
                  {CURRENCY}
                </span>
              </div>
              {errors.unitPrice && <p className="px-1 text-sm text-danger">{errors.unitPrice.message}</p>}
              {cash ? (
                movement.owed !== null && (
                  <p className={`px-1 text-sm font-semibold ${overOwed ? "text-danger" : "text-muted"}`}>
                    {movement.owed > 0
                      ? `عليه ${formatMoney(movement.owed)} مصاري${overOwed ? " فقط" : ""}`
                      : "هذا الزبون ما عليه مصاري"}
                  </p>
                )
              ) : movement.listPrice === null ? (
                <p className="px-1 text-sm text-muted">
                  ما في سعر لهذه الحركة بلائحة الأسعار.{" "}
                  <Link href="/prices" className="font-bold text-primary">
                    حدّد الأسعار
                  </Link>
                </p>
              ) : movement.unitPrice !== movement.listPrice ? (
                <button
                  type="button"
                  onClick={() => setValue("unitPrice", priceInputValue(movement.listPrice), { shouldValidate: true })}
                  className="self-start px-1 text-sm font-semibold text-primary"
                >
                  سعر اللائحة {formatMoney(movement.listPrice)} · رجّعه
                </button>
              ) : (
                <p className="px-1 text-sm text-muted">من لائحة الأسعار، وبتقدر تغيّره لهذه الحركة بس.</p>
              )}
              {!cash && movement.unitPrice !== null && movement.quantity > 0 && (
                <div className="flex items-center justify-between rounded-control bg-primary-tint px-4 py-3">
                  <span className="text-sm font-semibold text-primary tabular">
                    {formatCount(movement.quantity)} × {formatMoney(movement.unitPrice)}
                  </span>
                  <span className="text-xl font-extrabold text-primary tabular">{formatMoney(movement.total)}</span>
                </div>
              )}
            </Section>
          )}

          {movement.showPreview && (
            <section className="rounded-card bg-surface p-4 shadow-card">
              <p className="mb-2 text-sm font-bold text-ink">
                بعد الحفظ · {CYLINDER_TYPE_LABELS[movement.cylinderType]}
                {movement.businessDate !== today && <span className="font-normal text-muted"> (آخر ذلك اليوم)</span>}
              </p>
              <div className="flex flex-col gap-1.5">
                <PreviewValue state="full" before={movement.before.full} after={movement.after.full} />
                <PreviewValue state="empty" before={movement.before.empty} after={movement.after.empty} />
              </div>
            </section>
          )}

          <details className="group rounded-card bg-surface shadow-card" open={defaults.businessDate !== today || undefined}>
            <summary className="flex min-h-14 cursor-pointer list-none items-center gap-3 px-4 [&::-webkit-details-marker]:hidden">
              <CalendarDays size={20} className="text-muted" />
              <span className="flex-1 font-bold text-ink">التاريخ والملاحظة</span>
              <ChevronDown size={18} className="text-faint transition-transform group-open:rotate-180" />
            </summary>
            <div className="flex flex-col gap-4 px-4 pb-4">
              <Controller
                control={control}
                name="businessDate"
                render={({ field }) => (
                  <DateField
                    label="التاريخ"
                    value={field.value}
                    max={today}
                    onChange={field.onChange}
                    error={errors.businessDate?.message}
                  />
                )}
              />
              <Field label="ملاحظة" error={errors.note?.message}>
                <Textarea rows={2} {...register("note")} placeholder="اختياري" />
              </Field>
            </div>
          </details>
        </div>
      </div>

      <ActionBar error={movement.state.error}>
        <Button type="submit" size="lg" block disabled={movement.isPending || overOwed}>
          {movement.isPending
            ? "جارٍ الحفظ…"
            : cash
              ? `حفظ · ${MOVEMENT_KIND_LABELS[movement.kind]}${movement.total > 0 ? ` · ${formatMoney(movement.total)}` : ""}`
              : `حفظ · ${MOVEMENT_KIND_LABELS[movement.kind]} ${
                movement.quantity > 0 ? formatCount(movement.quantity) : ""
              } ${CYLINDER_TYPE_LABELS[movement.cylinderType]}${
                movement.unitPrice !== null && movement.total > 0 ? ` · ${formatMoney(movement.total)}` : ""
              }`}
        </Button>
      </ActionBar>
    </form>
  );
};
