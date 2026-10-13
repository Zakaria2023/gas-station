import { Banknote, ClipboardList, NotebookPen, Warehouse } from "lucide-react";
import { StatTile } from "@/components/ui/stat-tile";
import { formatCount, formatMoney } from "@/utils/text";

type DayStatsProps = {
  income: number;
  stockValue: number;
  owedMoney: number;
  owedCylinders: number;
  movementCount: number;
};

/**
 * The desktop's headline numbers for the day, in the app's tile style. A phone
 * reads the same numbers further down the page, so this row only shows from
 * `lg` up.
 */
export const DayStats = ({ income, stockValue, owedMoney, owedCylinders, movementCount }: DayStatsProps) => (
  <section className="hidden rounded-card bg-surface p-3 shadow-card lg:col-span-12 lg:block">
    <div className="grid grid-cols-4 gap-2">
      <StatTile
        label="المقبوض اليوم"
        value={formatMoney(income)}
        tone="success"
        empty={income === 0}
        icon={<Banknote size={17} />}
      />
      <StatTile
        label="قيمة المخزون"
        value={formatMoney(stockValue)}
        tone="primary"
        empty={stockValue === 0}
        icon={<Warehouse size={17} />}
      />
      <StatTile
        label="ديون عند الزبائن"
        value={formatMoney(owedMoney)}
        tone="debts"
        empty={owedMoney === 0 && owedCylinders === 0}
        icon={<NotebookPen size={17} />}
        hint={`${formatCount(owedCylinders)} جرة`}
      />
      <StatTile
        label="حركات اليوم"
        value={formatCount(movementCount)}
        tone="stock"
        empty={movementCount === 0}
        icon={<ClipboardList size={17} />}
      />
    </div>
  </section>
);
