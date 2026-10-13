import { CYLINDER_STATE_LABELS, CYLINDER_TYPE_LABELS } from "@/db/label";
import { CylinderIcon } from "@/components/ui/cylinder-icon";
import { TYPE_TINT } from "@/components/ui/type-badge";
import { Balance, balanceEntries } from "@/lib/balances";
import { formatCount, formatMoney } from "@/utils/text";

type BalanceChipsProps = {
  balance: Balance;
};

/** What a customer owes, as one small chip per non-zero bucket: "منزلي مليان 3". */
export const BalanceChips = ({ balance }: BalanceChipsProps) => {
  const entries = balanceEntries(balance);
  if (entries.length === 0 && balance.money === 0) {
    return <span className="text-xs font-semibold text-success">ما عليه شي</span>;
  }
  return (
    <span className="flex flex-wrap gap-1">
      {entries.map(({ cylinderType, state, quantity }) => (
        <span
          key={`${cylinderType}-${state}`}
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold ${
            quantity < 0 ? "bg-success-tint text-success" : TYPE_TINT[cylinderType]
          }`}
        >
          <CylinderIcon filled={state === "full"} size={13} />
          {CYLINDER_TYPE_LABELS[cylinderType]} {CYLINDER_STATE_LABELS[state]}
          <span className="tabular">{formatCount(quantity)}</span>
        </span>
      ))}
      {balance.money !== 0 && (
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold tabular ${
            balance.money < 0 ? "bg-success-tint text-success" : "bg-debts-tint text-debts"
          }`}
        >
          {formatMoney(balance.money)}
        </span>
      )}
    </span>
  );
};
