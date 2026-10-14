import { HandCoins, NotebookPen } from "lucide-react";
import { CylinderIcon } from "@/components/ui/cylinder-icon";
import { StatTile } from "@/components/ui/stat-tile";
import { SummaryCard } from "@/components/ui/summary-card";
import { cylinderTypes } from "@/db/enum";
import { CYLINDER_STATE_LABELS, CYLINDER_TYPE_LABELS } from "@/db/label";
import { Balance } from "@/lib/balances";
import { formatCount, formatMoney } from "@/utils/text";

type OwedSummaryProps = {
  balance: Balance;
  title: string;
  meta?: string;
};

/**
 * What is owed, in the app's summary style: the money first (all of it, then
 * the part that is cash borrowed), then the debt summary sheet's four columns
 * (household and industrial, full and empty).
 */
export const OwedSummary = ({ balance, title, meta }: OwedSummaryProps) => (
  <SummaryCard title={title} meta={meta ?? `${formatCount(balance.total)} جرة`}>
    <div className="grid grid-cols-2 gap-2 @2xl:grid-cols-6">
      <StatTile
        label="المبلغ المستحق"
        value={formatMoney(balance.money)}
        tone="debts"
        empty={balance.money === 0}
        icon={<NotebookPen size={16} />}
      />
      <StatTile
        label="منها دين مصاري"
        value={formatMoney(balance.cash)}
        tone="debts"
        empty={balance.cash === 0}
        icon={<HandCoins size={16} />}
      />
      {cylinderTypes.flatMap((type) =>
        (["full", "empty"] as const).map((state) => {
          const value = balance[type][state];
          return (
            <StatTile
              key={`${type}-${state}`}
              label={`${CYLINDER_TYPE_LABELS[type]} ${CYLINDER_STATE_LABELS[state]}`}
              value={formatCount(value)}
              tone={type}
              empty={value === 0}
              icon={<CylinderIcon filled={state === "full"} size={16} />}
            />
          );
        }),
      )}
    </div>
  </SummaryCard>
);
