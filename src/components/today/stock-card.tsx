import { ClipboardCheck } from "lucide-react";
import { CylinderState, CylinderType } from "@/db/enum";
import { CYLINDER_STATE_LABELS, CYLINDER_TYPE_LABELS } from "@/db/label";
import { CylinderIcon } from "@/components/ui/cylinder-icon";
import { TYPE_DOT, TYPE_TEXT } from "@/components/ui/type-badge";
import { LedgerDay, stockTotal } from "@/lib/ledger";
import { formatCount, formatMoney, formatSigned } from "@/utils";

type StockValue = { full: number | null; empty: number | null; total: number };

type StockCardProps = {
  cylinderType: CylinderType;
  day: LedgerDay;
  /** What the stock is worth at the day's prices; a null part has no price yet. */
  value: StockValue;
};

const StateTile = ({
  cylinderType,
  state,
  day,
  value,
}: {
  cylinderType: CylinderType;
  state: CylinderState;
  day: LedgerDay;
  value: number | null;
}) => {
  const now = day.closing[state];
  const change = now - day.opening[state];
  const negative = now < 0;

  return (
    <div
      className={`flex flex-col rounded-control p-3 ${
        state === "full" ? (cylinderType === "household" ? "bg-household-tint" : "bg-industrial-tint") : "bg-hairline-soft"
      }`}
    >
      <div className={`flex items-center gap-1.5 text-sm font-bold ${TYPE_TEXT[cylinderType]}`}>
        <CylinderIcon filled={state === "full"} size={18} />
        {CYLINDER_STATE_LABELS[state]}
      </div>
      <p
        className={`mt-1 text-[40px] leading-none font-extrabold tabular ${
          negative ? "text-danger" : "text-ink"
        }`}
      >
        {formatCount(now)}
      </p>
      <div className="mt-2 flex items-center justify-between gap-1 text-xs text-muted">
        <span className="truncate">
          أول اليوم <span className="font-bold text-ink tabular">{formatCount(day.opening[state])}</span>
        </span>
        {change !== 0 && (
          <span
            dir="ltr"
            className={`rounded-full px-1.5 py-px font-bold tabular ${
              change > 0 ? "bg-success-tint text-success" : "bg-surface text-muted"
            }`}
          >
            {formatSigned(change)}
          </span>
        )}
      </div>
      <p className="mt-1.5 truncate text-xs font-semibold text-muted tabular">
        {value === null ? "بدون سعر" : formatMoney(value)}
      </p>
    </div>
  );
};

/** One type's stock right now: full and empty side by side, the total above, the worth below. */
export const StockCard = ({ cylinderType, day, value }: StockCardProps) => (
  <section className="rounded-card bg-surface p-3 shadow-card">
    <div className="flex items-center justify-between gap-2 px-1 pb-2.5">
      <div className="flex items-center gap-2">
        <span className={`h-2.5 w-2.5 rounded-full ${TYPE_DOT[cylinderType]}`} />
        <h2 className="text-lg font-extrabold text-ink">{CYLINDER_TYPE_LABELS[cylinderType]}</h2>
        {day.counted && (
          <span className="inline-flex items-center gap-1 rounded-full bg-hairline-soft px-2 py-0.5 text-[11px] font-bold text-muted">
            <ClipboardCheck size={12} />
            مجرود
          </span>
        )}
      </div>
      <p className="text-sm text-muted">
        المجموع{" "}
        <span className="text-xl font-extrabold text-ink tabular">{formatCount(stockTotal(day.closing))}</span>
      </p>
    </div>
    <div className="grid grid-cols-2 gap-2">
      <StateTile cylinderType={cylinderType} state="full" day={day} value={value.full} />
      <StateTile cylinderType={cylinderType} state="empty" day={day} value={value.empty} />
    </div>
    <div className="flex items-center justify-between px-1 pt-2.5 text-sm">
      <span className="text-muted">قيمة المخزون</span>
      <span className="font-extrabold text-ink tabular">{formatMoney(value.total)}</span>
    </div>
  </section>
);
