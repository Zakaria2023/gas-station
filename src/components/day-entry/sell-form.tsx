"use client";

import Link from "next/link";
import { useSellForm } from "@/app/sell/use-sell-form";
import { kindChipClass, KindIcon } from "@/components/movements/kind-style";
import { ActionBar } from "@/components/ui/action-bar";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { TYPE_DOT } from "@/components/ui/type-badge";
import { CylinderType, cylinderTypes } from "@/db/enum";
import { CYLINDER_TYPE_LABELS, MOVEMENT_KIND_LABELS } from "@/db/label";
import { StockDelta } from "@/lib/movement-rules";
import { pricedKinds, PriceList, priceFor } from "@/lib/pricing";
import { formatCount, formatMoney } from "@/utils/text";
import { SellFormValues } from "@/validators/day-entry";

type SellFormProps = {
  defaults: SellFormValues;
  /** What is in the shop now: the morning's stock, plus what was added, less what was already sold. */
  stock: Record<CylinderType, StockDelta>;
  prices: PriceList;
};

/** بيع: how many of each sale were made, per type, at the day's prices. */
export const SellForm = ({ defaults, stock, prices }: SellFormProps) => {
  const { form, state, isPending, onSubmit, sold, total, count, short } = useSellForm(defaults, stock, prices);
  const {
    register,
    formState: { errors },
  } = form;

  return (
    <form onSubmit={onSubmit} noValidate>
      <div className="flex flex-col gap-4 px-4 pt-1 pb-40 lg:grid lg:max-w-5xl lg:grid-cols-2 lg:gap-5">
        <p className="px-1 text-sm text-muted lg:col-span-2">
          اكتب كم انباع من كل نوع. المبلغ بينحسب من الأسعار، والباقي بالمحل بينقص لحاله.
        </p>
        {cylinderTypes.map((type) => {
          const { quantities, amounts, after, short: typeShort, total: typeTotal } = sold[type];
          const typed = pricedKinds.some((kind) => quantities[kind] > 0);
          return (
            <section key={type} className="rounded-card bg-surface shadow-card">
              <div className="flex flex-wrap items-center justify-between gap-2 px-4 pt-4 pb-2">
                <h2 className="flex items-center gap-2 text-lg font-extrabold text-ink">
                  <span className={`h-2.5 w-2.5 rounded-full ${TYPE_DOT[type]}`} />
                  {CYLINDER_TYPE_LABELS[type]}
                </h2>
                <p className="text-sm text-muted">
                  المتوفر{" "}
                  <span className="font-extrabold text-ink tabular">{formatCount(stock[type].full)}</span> مليان ·{" "}
                  <span className="font-extrabold text-ink tabular">{formatCount(stock[type].empty)}</span> فاضي
                </p>
              </div>

              <ul>
                {pricedKinds.map((kind) => {
                  const price = priceFor(prices, type, kind);
                  const error = errors[type]?.[kind]?.message;
                  return (
                    <li key={kind} className="border-t border-hairline-soft px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${kindChipClass(kind)}`}
                        >
                          <KindIcon kind={kind} size={20} />
                        </span>
                        <span className="min-w-0 flex-1 leading-tight">
                          <span className="block font-bold text-ink">{MOVEMENT_KIND_LABELS[kind]}</span>
                          {price === null ? (
                            <span className="text-xs text-warning">ما في سعر</span>
                          ) : (
                            <span className="text-xs text-muted tabular">
                              {quantities[kind] > 0
                                ? `${formatCount(quantities[kind])} × ${formatMoney(price)} = ${formatMoney(amounts[kind])}`
                                : `${formatMoney(price)} للواحدة`}
                            </span>
                          )}
                        </span>
                        <Input
                          {...register(`${type}.${kind}`)}
                          aria-label={`${MOVEMENT_KIND_LABELS[kind]} ${CYLINDER_TYPE_LABELS[type]}`}
                          inputMode="numeric"
                          pattern="[0-9]*"
                          placeholder="0"
                          invalid={Boolean(error)}
                          className="min-h-12 w-28! shrink-0 text-center text-xl font-extrabold tabular"
                        />
                      </div>
                      {error && <p className="mt-1 text-sm text-danger">{error}</p>}
                    </li>
                  );
                })}
              </ul>

              {typed && (
                <div
                  className={`flex flex-wrap items-center justify-between gap-2 rounded-b-card px-4 py-3 text-sm ${
                    typeShort ? "bg-danger-tint text-danger" : "bg-hairline-soft text-muted"
                  }`}
                >
                  {typeShort ? (
                    <span className="font-bold">أكثر من المتوفر بالمحل</span>
                  ) : (
                    <span>
                      يبقى <span className="font-extrabold text-ink tabular">{formatCount(after.full)}</span> مليان ·{" "}
                      <span className="font-extrabold text-ink tabular">{formatCount(after.empty)}</span> فاضي
                    </span>
                  )}
                  <span className="font-extrabold text-ink tabular">{formatMoney(typeTotal)}</span>
                </div>
              )}
            </section>
          );
        })}

        {cylinderTypes.some((type) => pricedKinds.some((kind) => priceFor(prices, type, kind) === null)) && (
          <p className="rounded-control bg-warning-tint px-3 py-2.5 text-sm text-warning lg:col-span-2">
            بعض الأسعار ناقصة، فمبلغها صفر.{" "}
            <Link href="/prices" className="font-bold underline">
              حدّد الأسعار
            </Link>
          </p>
        )}

        <section className="rounded-card bg-surface p-4 shadow-card lg:col-span-2">
          <Field label="ملاحظة" error={errors.note?.message}>
            <Textarea rows={2} {...register("note")} placeholder="اختياري" />
          </Field>
        </section>
      </div>

      <ActionBar error={state.error ?? (short ? "انباع أكثر من المتوفر بالمحل" : undefined)}>
        <Button type="submit" size="lg" block disabled={isPending || short}>
          {isPending
            ? "جارٍ الحفظ…"
            : count > 0
              ? `حفظ البيع · ${formatCount(count)} جرة · ${formatMoney(total)}`
              : "حفظ البيع"}
        </Button>
      </ActionBar>
    </form>
  );
};
