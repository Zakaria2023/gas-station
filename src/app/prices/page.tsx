import { History } from "lucide-react";
import { Metadata } from "next";
import { PricesForm } from "@/components/prices/prices-form";
import { PageHeader } from "@/components/ui/page-header";
import { Toast } from "@/components/ui/toast";
import { TypeBadge } from "@/components/ui/type-badge";
import { cylinderTypes } from "@/db/enum";
import { MOVEMENT_KIND_LABELS } from "@/db/label";
import { pricedKinds } from "@/lib/pricing";
import { getPriceChanges, getPriceList, requireUser } from "@/services";
import { formatMoney, formatShortDay, isIsoDate, priceInputValue, todayIso } from "@/utils";
import { PricesFormValues } from "@/validators/prices";

export const metadata: Metadata = { title: "الأسعار" };

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

const PricesPage = async ({ searchParams }: Props) => {
  await requireUser();
  const params = await searchParams;
  const today = todayIso();
  const asked = first(params.from);
  const from = isIsoDate(asked) && asked <= today ? asked : today;
  const saved = first(params.saved);

  const [list, changes] = await Promise.all([getPriceList(from), getPriceChanges()]);
  const values = Object.fromEntries(
    cylinderTypes.map((type) => [
      type,
      Object.fromEntries(pricedKinds.map((kind) => [kind, priceInputValue(list[type][kind])])),
    ]),
  ) as Omit<PricesFormValues, "effectiveFrom">;

  return (
    <>
      <PageHeader title="الأسعار" subtitle="سعر الجرة الواحدة لكل حركة" backHref="/more" />
      <PricesForm key={from} today={today} defaults={{ effectiveFrom: from, ...values }}>
        {changes.length > 0 && (
          <section className="rounded-card bg-surface shadow-card">
            <h2 className="flex items-center gap-2 px-4 pt-4 pb-1 text-base font-bold text-ink">
              <History size={18} className="text-muted" />
              آخر التعديلات
            </h2>
            <ul className="divide-y divide-hairline-soft">
              {changes.map((change) => (
                <li
                  key={`${change.effectiveFrom}-${change.cylinderType}-${change.kind}`}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm"
                >
                  <span className="w-24 shrink-0 text-muted">{formatShortDay(change.effectiveFrom)}</span>
                  <TypeBadge cylinderType={change.cylinderType} />
                  <span className="min-w-0 flex-1 truncate text-ink">{MOVEMENT_KIND_LABELS[change.kind]}</span>
                  <span className="font-bold text-ink tabular">
                    {change.price === null ? "بدون سعر" : formatMoney(change.price)}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </PricesForm>

      {saved !== undefined && (
        <Toast key={saved} message={saved === "0" ? "ما تغيّر شي" : `تم حفظ ${saved} سعر`} />
      )}
    </>
  );
};

export default PricesPage;
