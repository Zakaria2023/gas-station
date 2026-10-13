import { cylinderTypes } from "@/db/enum";
import { CYLINDER_STATE_LABELS, CYLINDER_TYPE_LABELS } from "@/db/label";
import { CylinderIcon } from "@/components/ui/cylinder-icon";
import { TYPE_TEXT } from "@/components/ui/type-badge";
import { Balance } from "@/lib/balances";
import { formatCount, formatMoney } from "@/utils/text";

type OwedSummaryProps = {
  balance: Balance;
  title: string;
};

/** The debt summary sheet's four columns as a 2×2 grid, the total on top, the money below. */
export const OwedSummary = ({ balance, title }: OwedSummaryProps) => (
  <section className="rounded-card bg-surface p-3 shadow-card">
    <div className="flex items-center justify-between px-1 pb-2.5">
      <h2 className="text-base font-bold text-ink">{title}</h2>
      <p className="text-sm text-muted">
        المجموع <span className="text-xl font-extrabold text-ink tabular">{formatCount(balance.total)}</span>
      </p>
    </div>
    <div className="grid grid-cols-2 gap-2">
      {cylinderTypes.flatMap((type) =>
        (["full", "empty"] as const).map((state) => {
          const value = balance[type][state];
          return (
            <div key={`${type}-${state}`} className="rounded-control bg-hover px-3 py-2.5">
              <p className={`flex items-center gap-1.5 text-xs font-bold ${TYPE_TEXT[type]}`}>
                <CylinderIcon filled={state === "full"} size={15} />
                {CYLINDER_TYPE_LABELS[type]} {CYLINDER_STATE_LABELS[state]}
              </p>
              <p className={`mt-0.5 text-2xl font-extrabold tabular ${value === 0 ? "text-faint" : "text-ink"}`}>
                {formatCount(value)}
              </p>
            </div>
          );
        }),
      )}
    </div>
    <div className="mt-2 flex items-center justify-between rounded-control bg-debts-tint px-3 py-3">
      <span className="text-sm font-bold text-debts">المبلغ المستحق</span>
      <span className="text-2xl font-extrabold text-debts tabular">{formatMoney(balance.money)}</span>
    </div>
  </section>
);
